---
status: accepted
date: 2026-09-01
deciders: website-architect
---

# PostGIS schema + Row Level Security (RLS)

## Kontextus és probléma

Az Eger Város Probléma Térkép alapvető funkciója, hogy a felhasználók **földrajzi pontokhoz** (lat/lng) kötik a bejelentéseiket, és a térképes UI `/problems/nearby?lat=&lng=&radius=` query-vel kérdezi le a közeli pin-eket. Ez szükségessé teszi:

- **Térinformatikai indexelést** (PostGIS GIST), hogy a közeli-pin lekérdezés sub-millisecond legyen, ne sequential scan.
- **Geometriai pontosságot** (gömbön mért távolság, nem sík-Euklideszi), mert a Föld görbülete 1 km-es távolság felett már számít.
- **Többféle hozzáférési szintet**: a problémák olvashatók publikusan, de csak a tulajdonosuk szerkesztheti őket; a vote-ok csak a sajátjukat írhatják; az intézményeket csak admin módosíthatja; a wiki-t csak a service_role írhatja.

A Supabase a Postgres 15-öt futtatja PostGIS kiterjesztéssel + RLS támogatással, tehát az infrastruktúra adott — a döntés csak az, hogy **milyen típust és milyen policy-kat** definiálunk.

## Döntés

### Térinformatikai típus

A `problems` tábla `location` mezője `geography(Point, 4326)` — WGS84 lat/lng **gömbön** (a `4326` SRID a WGS84-et jelöli, a `geography` típus pedig a Föld gömbjén számolja a távolságot méterben, nem fokban).

```sql
"location" geography(Point, 4326)
```

A klienst `latitude` / `longitude` Float mezők szolgálják ki (denormalizált, mert az OpenAPI contract és a térkép komponensek sík koordinátákkal dolgoznak). A kettő szinkronját egy BEFORE INSERT/UPDATE trigger biztosítja:

```sql
CREATE OR REPLACE FUNCTION problems_set_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW."location" := ST_SetSRID(ST_MakePoint(NEW."longitude", NEW."latitude"), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

A trigger az `apps/api/prisma/migrations/0001_init/migration.sql`-ben fut le migrációkor.

### Térinformatikai index

A `problems.location` mezőn GIST indexet hozunk létre:

```sql
CREATE INDEX "problems_location_gist"
  ON "problems" USING GIST ("location");
```

A GIST index a PostGIS alapértelmezett R-tree implementációja — `ST_DWithin` / `ST_Distance` / `&&` operátorok sub-millisecond sebességre gyorsítják a közeli-pin query-t akár több százezer sor felett is.

### Connection pool (Prisma ↔ Supabase)

A Supabase két végpontot biztosít:

- **Direct** (`db.<project>.supabase.co:5432`) — hosszú ideig futó kapcsolat, migrációhoz.
- **Pooler** (`db.<project>.supabase.co:6543`) — PgBouncer, tranziens kapcsolatok, runtime API-hoz.

A Prisma két környezeti változót kap, és a `datasource db` blokkban külön `url` + `directUrl` mezőket tölti fel:

| Változó | Végpont | Használat |
|---|---|---|
| `DATABASE_URL` | pooler (6543) | API runtime (minden query) |
| `DIRECT_URL` | direct (5432) | `prisma migrate` (DDL) |

Ez azért fontos, mert a Prisma migrate session-je nem tud PgBouncer mögött tranzakciót nyitni a `CREATE INDEX` / `ALTER TABLE` utasításokhoz, és a direct connection a Supabase ingyenes tier-én is elérhető.

### Row Level Security policy-k

Minden táblán `ENABLE ROW LEVEL SECURITY`, és policy-k:

| Tábla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `problems` | `USING (true)` | `WITH CHECK (auth.uid() IS NOT NULL)` | `auth.uid() = created_by OR jwt.admin` | `auth.uid() = created_by OR jwt.admin` |
| `votes` | `USING (true)` | `WITH CHECK (auth.uid() = user_id)` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `institutions` | `USING (true)` | `admin only` | `admin only` | `admin only` |
| `wiki_entries` | `USING (true)` | `service_role only` | `service_role only` | `service_role only` |
| `users` | `USING (true)` | (trigger) | — | — |
| `problem_institution_links` | `USING (true)` | `admin only` | `admin only` | `admin only` |

A role claim forrása: `auth.jwt() ->> 'app_metadata' ->> 'role'` (`'admin' | 'user'`).

A service_role key a NestJS szerveroldali kliensben használatos, és a Supabase-ban automatikusan megkerüli az RLS-t (a `service_role` claim a `role` mezőben van, nem az `app_metadata`-ban).

### Triggerek

Két trigger:

1. **`problems_location_sync`** (BEFORE INSERT/UPDATE) — a `latitude`/`longitude` változásakor újraszámolja a `location`-t.
2. **`on_auth_user_created`** (AFTER INSERT/UPDATE on `auth.users`) — tükrözi a Supabase Auth-ból érkező új felhasználót a `public.users` táblába (FK célpont). Csak akkor jön létre, ha a `auth.users` séma létezik (Supabase deploy-okon igen, vanilla Postgres-en nem — guarded `DO $$ ... $$` blokk).

## Alternatívák, amiket megvizsgáltunk

### `geometry(Point, 4326)` a `geography` helyett

- **Pro**: gyorsabb számítás (síkon, fokban), kisebb tárolóhely.
- **Kontra**: a `ST_DWithin` síkon dolgozik (fokok), tehát a "2 km-es sugarú kör" nem 2 km a Földön, hanem ami a sík-Euklideszi metrikával jön ki (Eger szélességi fokán ez ~ 30%-os eltérés). A `geography` típus a gömbön számol, és a felhasználó számára mindig méterben fejezzük ki a távolságot.

### MongoDB geospatial index

- **Pro**: egyszerű API, `$nearSphere` aggregáció.
- **Kontra**: nincs valódi SQL, nehezebb aggregáció, ritkábban használt GIS query-k, és a teljes stack-ről le kellene mondanunk (a többi döntés Postgres-re épül).

### Saját bbox pre-filter (lat BETWEEN … AND lng BETWEEN …)

- **Pro**: nincs PostGIS függőség, egyszerű.
- **Kontra**: az Egyenlítőn kívül a bbox-szal nem tudsz kört lekérdezni (a távolság a szélességi foktól függ), és a sarkok felé a négyszög nem kört közelít. A felhasználó azt várja, hogy "2 km-re" tényleg 2 km legyen.

### Alkalmazás-szintű authorizáció NestJS guard-okkal (RLS nélkül)

- **Pro**: a service-ekben explicit, könnyen debuggolható.
- **Kontra**: amint elfelejtünk egy guard-ot egy controller-re, az adat nyilvánosan szivárog. Az RLS a **default**: amihez nincs policy, az blokkolva van. A NestJS guard-ok továbbra is megmaradnak a service-szintű jogosultság-ellenőrzéshez, de a védelem utolsó vonala az adatbázis.

### Csak index, RLS nélkül

- **Pro**: egyszerűbb migráció.
- **Kontra**: minden service kézzel ellenőrzi, hogy a `created_by` megegyezik-e a user-rel. Egyetlen elfelejtett `WHERE` clause = adatszivárgás. A Supabase RLS ezt fordíthatatlan biztonsági mentőövként adja.

## Következmények

### Pozitív

- **Sub-millisecond geo query** GIST index-szel — a térkép simán 60 fps-en renderel akár 100k pin felett is.
- **PostGIS az iparági szabvány**: jól dokumentált, rengeteg library wrapper (Node.js, Python, stb.), és a Supabase admin UI is támogatja.
- **RLS = defence in depth**: ha a NestJS guard-ok elfelejtenek egy ellenőrzést, a Postgres akkor is blokkol. Ez a Supabase egyik fő ígérete.
- **Service_role jól el van szigetelve**: csak a NestJS service-ek és az AI-worker érik el, mindkettő szerver-oldali, mindkettő auditálható.

### Negatív

- **A `geography(Point, 4326)` típust a Prisma nem tudja natívan olvasni** — `Unsupported(...)` kell, és minden olvasás/írás a `location` mezőre raw SQL. Ezt a `voting` service és a `problems.nearby` query kezeli; a többi service a `latitude`/`longitude` Float mezőkön dolgozik.
- **Az RLS policy-k a JWT `app_metadata.role` claimet olvassák** — ez a Supabase dashboardon kézzel állítható, nincs önkiszolgáló admin UI. MVP-ig elfogadható.
- **A direct connection szükséges a migrációhoz** — a Supabase pooler (PgBouncer transaction mode) nem támogatja a DDL tranzakciókat. A `DIRECT_URL` env változót mindig be kell állítani.
- **A PostGIS extension telepítése** superuser jogot igényel — a Supabase automatikusan biztosítja, vanilla Postgres-en külön `CREATE EXTENSION postgis;` kell.

### Kockázatok

- **A `problems.location` GIST index nagy táblán lassú INSERT** — az MVP 10k soros táblára nem gond, de 1M+ problémánál fontolóra kell venni a particionálást (V3+).
- **A `service_role` key kompromittálódása kritikus**: bárki írhat a `wiki_entries`-be és módosíthat bármilyen táblát. Mitigation: secret rotation + audit log a service_role query-kre.
- **A migration 0001_init nem fog futni vanilla Postgres-en** a `auth.users` trigger miatt — guarded DO blokk figyelembe veszi, de a fejlesztői sandbox-ot a Supabase-on kell tartani.
- **Ha a Supabase leáll**, a teljes auth + GIS funkció leáll — nincs failover. Mitigation: read-replica + backup policy (V2).

## Owner

- **Döntéshozó**: `website-architect`
- **Végrehajtó**: `website-architect` (Task 1: schema + migration + RLS)
- **Felülvizsgálat**: 2026-12-01 (V2 fázis előtt — ha a teljesítmény nem elég, fontolóra kell venni a particionálást vagy egy Materialized View-t a `problems_with_score`-hoz)
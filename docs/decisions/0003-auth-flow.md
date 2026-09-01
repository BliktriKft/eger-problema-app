---
status: accepted
date: 2026-09-01
deciders: website-architect
---

# Auth flow (Supabase Auth + JWT + NestJS guard)

## Kontextus és probléma

A felhasználók email + Google + Apple + Meta OAuth provider-eken keresztül jelentkeznek be (a `BliktriKft/eger-problema-app` MVP stack része). Az alkalmazás három futtatókörnyezetben használja az azonosítót:

1. **Web (Next.js)** — böngészőben tárolt JWT, a Supabase JS client (`@supabase/supabase-js`) kezeli a session-t.
2. **Mobil (React Native + Expo)** — SecureStore-ban tárolt JWT, ugyanaz a Supabase JS client.
3. **Backend (NestJS)** — a kliens által küldött JWT-t verifikálja, és ebből tudja meg, ki a `created_by`, ki szavazhat, stb.

A három rétegnek egységesen kell kezelnie:
- a session lejáratát és frissítését,
- a service_role key használatát a szerveren (admin / migration / AI-worker),
- a felhasználói szerepkört (`user` vs. `admin`).

A RLS policy-k a `auth.uid()` és `auth.jwt()` függvényekre építenek, ezért ezeket a szerver oldalon is ugyanúgy kell értelmezni, mint a Supabase saját PostgREST API-ján.

## Döntés

A hitelesítés egységesen Supabase Auth-ra épül, három komponenssel:

| Komponens | Kulcs | Hol használjuk |
|---|---|---|
| **anon key** (`SUPABASE_ANON_KEY`) | publikus, JWT-t ad | web + mobil kliensek |
| **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) | titkos, RLS-t megkerüli | NestJS szerver, AI worker, migrációk |
| **JWT verification** | a Supabase által aláírt RS256 token | NestJS `AuthGuard` middleware |

**Folyamat (server-side):**

1. A kliens bejelentkezik a Supabase Auth-ba (email vagy OAuth).
2. A kapott tokent a `Authorization: Bearer <jwt>` header-ben küldi a NestJS API-nak.
3. A NestJS `SupabaseAuthGuard` a service_role key-jel hívja a `supabase.auth.getUser(jwt)` metódust — ez **szerver-oldali** verifikáció (nem kliens-oldali), és visszaadja a megbízható user UUID-t + a `role` claimet.
4. A controller a request `user` object-re szúrja az eredményt; onnan a service-ek `@CurrentUser()` decorator-on keresztül érik el.
5. A RLS policy-k az `auth.uid()` és `auth.jwt() ->> 'app_metadata' ->> 'role'` alapján döntenek.

**Service role használat:**

- A NestJS indításkor létrehoz egy `supabase` klienst a service_role kulccsal, **kizárólag szerver-oldali** műveletekre: AI-worker proxy, admin CRUD, migration-ök.
- A service_role client soha nem kerül a kliens bundle-be; a build-time guard (`@eger/api/src/modules/auth/auth.service.ts`) init-time ellenőrzi, hogy az env változók jelen vannak.

**JWT payload struktúra (Supabase):**

```json
{
  "sub": "00000000-0000-0000-0000-000000000000",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": { "role": "user" | "admin" },
  "exp": 1700000000
}
```

Az `app_metadata.role` claim a RLS policy-k alapja. Admin jogosultságot a Supabase Dashboardon, kézzel állítunk be (V2: admin UI).

## Alternatívák, amiket megvizsgáltunk

### Saját JWT auth (Passport + bcrypt)

- **Pro**: teljes kontroll, nincs vendor lock-in.
- **Kontra**: újra kell implementálni az OAuth flow-t minden providerre, refresh token rotation, email verification, jelszó-visszaállítás — ez hetek munkája. A Supabase mindezt ingyen adja.

### NextAuth.js (Auth.js) a weben, Supabase a mobilon

- **Pro**: a weben egyszerűbb a session kezelés.
- **Kontra**: két különböző auth rendszer a két platformon → szinkronizációs bug-ok, a NestJS-nek kétféle tokent kellene verifikálnia. A Supabase konzisztens web + mobil + backend.

### Clerk / Auth0

- **Pro**: gazdagabb feature-set (MFA, organization-ok, audit log).
- **Kontra**: fizetős a használható tier-en, és még egy vendor a stackben. A Supabase ingyenes tier MVP-re bőven elég.

### Lucia / oslo (lightweight, saját kód)

- **Pro**: minimális függőségek, nincs vendor lock-in.
- **Kontra**: kézzel kell megírni minden OAuth integrációt, a refresh rotation-t, a magic linket, stb. — ez lassabb, mint a Supabase.

## Következmények

### Pozitív

- **Egységes auth**: egyetlen `supabase.auth.getUser(jwt)` hívás a NestJS-ben, nincs külön session-kezelés vagy token refresh.
- **RLS-sel szinkronban**: az `auth.uid()` és `auth.jwt()` policy-k ugyanúgy működnek a Supabase PostgREST-en és a NestJS-en keresztül, mert mindkettő a Supabase JWT-t használja.
- **OAuth provider-ek azonnal**: Google, Apple, Meta, email magic link, email+jelszó — mind a Supabase beépített szolgáltatása, nem kell OAuth app-ot regisztrálnunk egyenként (bár a provider credentials-et igen).
- **Ingyenes tier elegendő MVP-re**: 50 000 MAU-ig ingyenes a Supabase Auth.

### Negatív

- **Vendor lock-in**: ha elhagyjuk a Supabase-t, a teljes auth rendszert újra kell írni.
- **A service_role key kompromittálódása kritikus**: bárki, aki hozzáfér, megkerüli az RLS-t. Mitigation: secret rotation, kizárólag szerver-oldali használat, env-ben tárolás (soha nem a kliens bundle-ben).
- **A Supabase admin UI-n kézzel kell admin role-t beállítani**, amíg nincs saját admin UI. Ez átmeneti kellemetlenség, de a V1 MVP-hez elfogadható.
- **A Supabase free tier 50 000 MAU-nál megáll** — ha gyorsan növekszünk, gyorsan fizetős tier-re kell váltanunk.

### Kockázatok

- **JWT secret rotáció** a Supabase-ban ritka, de ha megtörténik, minden kliens tokene érvénytelen lesz. Mitigation: a kliensek a Supabase JS clienttel automatikusan frissítenek; a NestJS csak szerver-oldalon verifikál, nem cache-eli a titkot.
- **OAuth provider leállás** (Google/Apple/Meta) → átmenetileg csak email/jelszóval lehet belépni. Mitigation: email+jelszó fallback mindig elérhető.
- **A `getUser(jwt)` Supabase API rate limit** — 200 req/sec project-enként. MVP-re bőven elég.

## Owner

- **Döntéshozó**: `website-architect`
- **Végrehajtó**: `website-architect` (Task 2: `SupabaseAuthGuard` implementáció + `@CurrentUser()` decorator + auth.service tesztek)
- **Felülvizsgálat**: 2026-12-01 (V2 fázis előtt — ha szükséges, akkor váltás Clerk-re vagy saját auth-ra)
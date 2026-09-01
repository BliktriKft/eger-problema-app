---
status: accepted
date: 2026-09-01
deciders: website-architect, manager (Adam)
---

# Stack választás

## Kontextus és probléma

Az Eger Város Probléma Térkép egy közösségi problémabejelentő alkalmazás, ami web (Next.js) + iOS + Android (React Native) platformokon fut. Szükségünk van:

- Erős, típusos backend API-ra (REST + GraphQL később?)
- Térinformatikai (geo) lekérdezésekre (PostGIS)
- Beépített auth rendszerre (OAuth: Google, Apple, Meta + email/jelszó)
- Realtime frissítésre (új probléma pin → minden user térképén megjelenik)
- Storage-ra (problémához csatolt képek)
- Mobil és web közös kódbázisra, ahol lehetséges
- AI-wiki generálásra (webes keresés + scraper + LLM)
- Gyors MVP-re (4 hét) és olcsó üzemeltetésre

## Döntés

A következő stack-et választjuk:

| Réteg | Technológia | Indoklás |
|---|---|---|
| Backend | **NestJS 10** + TypeScript | Erős DI, module rendszer, OpenAPI auto-gen, class-validator, jól skálázható |
| Database + Auth + Realtime + Storage | **Supabase** (Postgres 15 + PostGIS + Auth + Realtime + Storage) | Egyetlen szolgáltatásban minden, ami kell; ingyenes tier MVP-re; PostGIS natívan |
| ORM | **Prisma** | Típusos, migráció-kezelés, jól működik a NestJS-sel (bár a PostGIS típusokkal kiegészítés kell) |
| Web frontend | **Next.js 14** (App Router) | SSR + RSC, jól skálázható, nagy ökoszisztéma |
| Web UI | **TailwindCSS** + **shadcn/ui** | Gyors, testreszabható, modern |
| Térkép (web) | **Leaflet** + **OpenStreetMap** csempék | Ingyenes, nincs API kulcs kötöttség (mint a Mapbox), elegendő MVP-hez |
| Mobil | **React Native + Expo SDK 51** | Egy kódbázis iOS + Android, expo-router a navigáció, EAS Build a CI/CD |
| Térkép (mobil) | **react-native-maps** OSMap csempékkel | OSMap konzisztens a Leaflet-tel |
| Monorepo | **pnpm workspaces** + **Turborepo** | Gyors, hatékony, cache-elhető |
| AI-wiki | **Google News API** + egyedi scraper (Eger TV, Egri Hírek, HEOL) + **Anthropic Claude API** | Friss, magyar nyelvű források + LLM summarization |
| Auth | **Supabase Auth** (email + Google + Apple + Meta OAuth) | Beépített, jól dokumentált, mobil + web azonos flow |
| Hosting | TBD (MVP: Fly.io vagy saját VPS Coolify) | Későbbi döntés |

## Alternatívák, amiket megvizsgáltunk

### Backend alternatívák

- **Express/Fastify** + saját DI → kevesebb konvenció, több boilerplate
- **FastAPI (Python)** → más nyelv a backend-en és az LLM/AI oldalon, nehezebb lenne a tool sharing
- **tRPC** → típusos RPC, ale a mobil natív kliens nehezen támogatja
- **Django + DRF** → lassabb iteráció, kevesebb típusbiztonság

### DB alternatívák

- **Saját Postgres + PostGIS** (Supabase nélkül) → auth, realtime, storage külön szolgáltatás → több üzemeltetési teher
- **Firebase** → nincs valódi SQL, nehezebb geo lekérdezések
- **MongoDB** → nincs natív geo indexelés, ritkábban használt GIS query-k

### Térkép alternatívák

- **Mapbox** → szebb, ale fizetős, és az MVP-hez nem kell
- **Google Maps** → legjobb minőség, ale a legszigorúbb licencfeltételek és árazás
- **MapLibre** + saját OSMap tile server → MVP-hez overkill

### Mobil alternatívák

- **Flutter** → szebb UI, ale a web és mobil nem oszthatják meg a TypeScript kódot
- **2× natív (Swift + Kotlin)** → 2× fejlesztési idő, drága MVP-re

## Következmények

### Pozitív

- A Supabase egyetlen BaaS-ben adja az auth + DB + realtime + storage funkciókat, kevesebb üzemeltetési teher
- A TypeScript end-to-end (web + mobil + backend + shared types) → kevesebb runtime hiba
- A pnpm + Turborepo gyorsítja a monorepo build-eket
- A NestJS moduláris, könnyű új funkciót hozzáadni (pl. crowdfunding V3-ban)

### Negatív

- A Supabase lock-in: ha váltani kell, az auth + realtime + storage külön szolgáltatás lesz
- A PostGIS + Prisma kombináció nem natívan támogatja a geo típusokat, szükség van némi kiegészítésre (raw SQL a komplexebb query-khez)
- A React Native + Expo néhány natúk korlátot hoz (push notification, Bluetooth, stb.) — de az MVP-hez nem kell
- A Google News API fizetős (100$ / hó 5000 kérés után) — de MVP-re az ingyenes 100 kérés/nap elég

### Kockázatok

- **Supabase leállás** → kritikus, mert minden rajta fut. Mitigation: backup policy + status monitoring
- **OSMap tile server túlterhelés** → ritka, de a tile-okat lokálisan cache-elhetjük
- **Google News API kvóta túllépés** → a scraper önállóan is működik, fallback-ként

## Owner

- Döntéshozó: `manager` (Adam) + `website` (lead)
- Végrehajtó: `website-architect`
- Felülvizsgálat: 2026-12-01 (V2 fázis előtt)
# Eger Város Probléma Térkép

Közösségi problémabejelentő alkalmazás Eger városához. Web (Next.js) + iOS + Android (React Native), NestJS backend, Supabase (Postgres + PostGIS + Auth), AI-alapú wiki a problémák hátteréről.

## Cél

A TISZA-s probléma-térkép utódja: a felhasználók egy térképen jelölhetik a városi problémákat (kátyú, közlekedés, közintézmény, közbiztonság stb.), a többi felhasználó upvote/downvote-olhat, az AI pedig wiki-szerű összefoglalót készít a probléma hátteréről helyi hírforrásokból. Közintézmények (iskola, kórház, uszoda stb.) külön kategóriaként jelölhetők, és az intézményt érintő bejelentések anonim módon is beküldhetők.

## Stack

| Réteg | Technológia |
|---|---|
| Frontend (web) | Next.js 14 (App Router) + TailwindCSS + shadcn/ui |
| Frontend (mobile) | React Native + Expo + react-native-maps |
| Backend API | NestJS 10 + TypeScript |
| Database + Auth | Supabase (Postgres 15 + PostGIS + Auth + Storage) |
| Térkép | OpenStreetMap + Leaflet (web) / react-native-maps (mobile) |
| Auth | Supabase Auth (email + Google + Apple + Meta OAuth) |
| AI-wiki | Google News API + helyi scraper (Eger TV, Egri Hírek, HEOL) + LLM |
| Monorepo | pnpm workspaces + Turborepo |
| CI/CD | GitHub Actions |

## Repository struktúra

```
eger-problema-app/
├── apps/
│   ├── web/          # Next.js web app (apps/web/README.md)
│   ├── mobile/       # React Native (Expo) iOS + Android (apps/mobile/README.md)
│   └── api/          # NestJS backend (apps/api/README.md)
├── packages/
│   └── shared/       # Megosztott TypeScript típusok és Zod sémák
├── docs/
│   └── decisions/    # Architecture Decision Records (ADR-ek)
├── scripts/          # DevOps scriptek
└── .github/
    └── workflows/    # GitHub Actions CI
```

## Gyors indulás (fejlesztőknek)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env  # töltsd ki a Supabase + OAuth kulcsokat
cp apps/web/.env.example apps/web/.env
pnpm --filter @eger/api dev
pnpm --filter @eger/web dev
```

## Csapat

A fejlesztést a `website` team agent profiljai végzik (lásd: `~/.hermes/profiles/website*/SOUL.md`):

- **website** (lead) — Bubbles / Puszedli — teljes koordináció
- **website-architect** — NestJS + Supabase schema + ADR-ek
- **website-frontend** — Next.js + Leaflet/OSMap
- **website-mobile** — React Native + OSMap
- **website-ai** — Google News API + scraper + LLM
- **website-designer** — Figma + design tokenek
- **website-qa** — Playwright (web) + Detox (mobile)

A manager profile (Blossom) felügyeli a rendszert, de nem ír kódot.

## Fázisok

- **MVP (4 hét)** — web app + auth + térkép + bejelentés + upvote + intézmény-címkék
- **V2 (4 hét)** — iOS + Android shell, AI-wiki
- **V3** — Crowdfunding integráció (adjukössze API bridge)

## Licenc

MIT
# apps/api — Backend (NestJS 10)

A `BliktriKft/eger-problema-app` backend API-ja.

## Stack

- **NestJS 10** + **TypeScript**
- **Supabase JS** (Postgres + PostGIS + Auth + Storage)
- **Prisma** ORM (PostGIS típusokkal kiegészítve)
- **@nestjs/swagger** (auto-generated OpenAPI a `/api/docs`-on)
- **class-validator** + **class-transformer** (DTO validáció)
- **@nestjs/throttler** (rate limiting)
- **Pino** (strukturált logging)
- **Jest** (unit + integration tesztek)

## Modulok

| Modul | Felelős profil | Funkció |
|---|---|---|
| `auth` | website-architect | OAuth callback handlerek + session kezelés |
| `problems` | website-architect | Probléma CRUD + geo query (PostGIS) |
| `voting` | website-frontend | Upvote/downvote aggregáció |
| `institutions` | website-architect | Egri közintézmények katalógusa + kategória |
| `wiki` | website-ai | AI-wiki generálás (cikkek + összefoglalók) |
| `scraper` | website-ai | Helyi hírportál scraper (Eger TV, Egri Hírek, HEOL) |
| `crowdfunding` | TBD V3 | Külső platform bridge (adjukössze API) |
| `health` | — | `/health` endpoint (Kubernetes liveness/readiness) |

## Könyvtárstruktúra

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── problems/
│   │   ├── voting/
│   │   ├── institutions/
│   │   ├── wiki/
│   │   ├── scraper/
│   │   ├── crowdfunding/
│   │   └── health/
│   ├── common/              # Decorators, guards, pipes, filters
│   ├── config/              # Környezeti változók + validáció
│   └── database/            # Prisma client + migrációk
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/                    # E2E tesztek
```

## Parancsok

```bash
pnpm --filter @eger/api dev                  # localhost:8000
pnpm --filter @eger/api build
pnpm --filter @eger/api test                 # Jest
pnpm --filter @eger/api test:e2e             # Supertel
pnpm --filter @eger/api db:migrate             # Prisma migráció
pnpm --filter @eger/api db:seed               # Seed adatok (intézmények, teszt user)
pnpm --filter @eger/api docs:export           # OpenAPI export → packages/shared
```

## Környezeti változók (apps/api/.env)

```
NODE_ENV=development
PORT=8000
SUPABASE_URL=*** Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=*** service_role key (server-only!)>
DATABASE_URL=*** Postgres connection string, direct>
GOOGLE_NEWS_API_KEY=*** Google Cloud API key>
NEWS_SCRAPER_USER_AGENT="EgerProblemaBot/0.1 (+contact)"
ANTHROPIC_API_KEY=*** Claude API key a wiki generáláshoz>
CORS_ORIGIN=http://localhost:3000
THROTTLE_TTL=60
THROTTLE_LIMIT=100
LOG_LEVEL=info
```

## Owner

- `website-architect` — séma, DTO-k, OpenAPI, RBAC
- `website-ai` — wiki + scraper modulok

## Deploy

- **Dev**: Docker Compose (`apps/api/docker-compose.yml`)
- **Staging**: Fly.io (`fly.toml`)
- **Production**: TBD — ajánlott: Railway, Render, vagy saját VPS (Coolify)
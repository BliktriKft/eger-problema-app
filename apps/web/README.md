# apps/web — Web alkalmazás (Next.js 14)

A `BliktriKft/eger-problema-app` webes frontendje.

## Stack

- **Next.js 14** (App Router)
- **TailwindCSS** + **shadcn/ui**
- **Leaflet** + OpenStreetMap csempék
- **Supabase JS client** (auth + adat)
- **TanStack Query** (server state)
- **Zod** + **react-hook-form** (űrlapok)

## Könyvtárstruktúra

```
apps/web/
├── app/
│   ├── (auth)/              # Bejelentkezési flow
│   │   ├── login/
│   │   └── register/
│   ├── (main)/              # Főoldali route-ok (bejelentkezett user)
│   │   ├── map/             # Térkép nézet
│   │   ├── problems/        # Probléma lista + részletek
│   │   └── submit/          # Új probléma beküldése
│   ├── api/                 # Next.js API route-ok (ha kell SSR)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── map/                 # Leaflet wrapper + pin rétegek
│   ├── problems/            # Probléma kártyák + form
│   ├── voting/              # Upvote/downvote
│   └── ui/                  # shadcn/ui komponensek
├── lib/
│   ├── supabase/            # Supabase client + auth helpers
│   └── api/                 # NestJS API client
└── public/                 # Statikus assetek (pin ikonok, logó)
```

## Parancsok

```bash
pnpm --filter @eger/web dev      # localhost:3000
pnpm --filter @eger/web build
pnpm --filter @eger/web lint
pnpm --filter @eger/web test     # Playwright E2E
```

## Környezeti változók (apps/web/.env)

```
NEXT_PUBLIC_SUPABASE_URL=*** Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=*** Supabase anon key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Owner

`website-frontend` agent profile (lásd: `~/.hermes/profiles/website-frontend/SOUL.md`).
# packages/shared — Megosztott típusok és sémák

A `BliktriKft/eger-problema-app` web és api package-ei között megosztot TypeScript típusok és Zod validációs sémák.

## Stack

- **TypeScript** (strict mode)
- **Zod** (séma + inference)
- **tsup** (bundle)

## Struktúra

```
packages/shared/
├── src/
│   ├── types/               # Típusdefiníciók
│   │   ├── problem.ts
│   │   ├── institution.ts
│   │   ├── user.ts
│   │   └── vote.ts
│   ├── schemas/             # Zod sémák (request/response validáció)
│   ├── constants/           # Megosztott konstansok (kategóriák, státuszok)
│   └── index.ts
└── package.json
```

## Parancsok

```bash
pnpm --filter @eger/shared build
pnpm --filter @eger/shared lint
pnpm --filter @eger/shared test
```

## Használat

```typescript
// apps/api
import { ProblemSchema, type Problem } from '@eger/shared';

// apps/web
import type { Problem } from '@eger/shared';
```

## Owner

`website-architect` agent profile.
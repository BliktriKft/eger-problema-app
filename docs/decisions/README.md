# ADR-ek (Architecture Decision Records)

Az Eger Város Probléma Térkép technológiai döntéseinek nyilvántartása.

## Formátum

Minden ADR a [MADR](https://adr.github.io/madr/) 4.0 formátumot követi: `NNNN-rövid-cím.md`.

## Státuszok

- **proposed** — javasolt, még nincs elfogadva
- **accepted** — elfogadott, aktív
- **deprecated** — elavult, ne használd új kontextusban
- **superseded by NNNN** — egy későbbi ADR felülírta

## Lista

| Szám | Cím | Státusz |
|---|---|---|
| [0001](0001-stack-valasztas.md) | Stack választás (NestJS + Supabase + Next.js + React Native + OSMap) | accepted |
| [0002](0002-monorepo-tooling.md) | Monorepo tooling (pnpm + Turborepo) | accepted |
| [0003](0003-auth-flow.md) | Auth flow (Supabase Auth + JWT + NestJS guard) | accepted |
| [0004](0004-postgis-schema-rls.md) | PostGIS schema + Row Level Security | accepted |

## Hogyan írj új ADR-t

1. Másold az [`_template.md`](_template.md) fájlt
2. Nevezd át `NNNN-rövid-cím.md` formátumra (a szám az utolsó ADR + 1)
3. Töltsd ki a kötelező mezőket
4. Nyiss PR-t a `website-architect` review-jával
5. Merge után frissítsd a fenti táblázatot

## Owner

`website-architect` agent profile.
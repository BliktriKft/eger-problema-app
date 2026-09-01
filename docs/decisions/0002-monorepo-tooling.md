---
status: accepted
date: 2026-09-01
deciders: website-architect, manager (Adam)
---

# Monorepo tooling (pnpm + Turborepo)

## Kontextus

Három alkalmazásunk van (Next.js web, React Native mobil, NestJS API), plusz egy megosztott types/schemas package. Egyetlen GitHub repo-ban akarjuk őket tartani, mert:

- A types/schemas-t mindhárom app használja
- Az API változásakor a web + mobil azonnal látom a hibát (type check)
- Egyetlen helyen van a CI, a docs, az ADR-ek
- A worker agent-ek könnyebben koordinálnak (egy repo, egy issue tracker)

## Döntés

- **pnpm workspaces** (a node_modules symlink megoldás hatékony, kevés a duplikáció)
- **Turborepo** (az inkrementális build és a cache révén gyorsabb a CI)
- **GitHub Actions** (a BliktriKft org-ban van, és az új projekt oda megy)

## Alternatívák

- **npm workspaces** → működik, de lassabb és több a lemezhasználat
- **Yarn workspaces (v1 / v2+)** → Yarn 1 lassú, Yarn 2/3 (Berry) komplexebb konfiguráció, plug'n'play problémák a NestJS-sel
- **Nx** → erősebb, ale MVP-hez overkill, lassabb a tanulási görbe
- **Lerna** → legacy, pnpm jobb

## Következmények

### Pozitív

- pnpm install gyors, lockfile megbízható
- Turborepo cache révén a CI inkrementális (ha csak az API változott, a web nem build-el újra)
- A worker agent-ek egyszerűen `pnpm --filter @eger/web test` módon futtatnak parancsokat

### Negatív

- A React Native + pnpm néhány edge case-t hoz (Metro bundler konfiguráció), de a Expo SDK 51+ jól működik pnpm-mel
- A lockfile (`pnpm-lock.yaml`) néha review-konfliktusokat okoz, ale ez bármelyik monorepo-nál így van

## Owner

- Végrehajtó: `website-architect`
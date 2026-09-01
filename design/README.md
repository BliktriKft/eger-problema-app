# Design system — Eger Város Probléma Térkép

> Source of truth for all visual design decisions. Engineers consume:
> - **Design tokens** → `tokens/*.json` → generated to `apps/web/tailwind.config.ts` + `apps/web/app/globals.css` + `apps/mobile/src/theme/tokens.ts` via `pnpm --filter @eger/design export:tokens`
> - **Component specs** → `components/*.md` (Markdown with prop tables, accessibility notes, examples) + `map/pins.tsx` (precise TSX spec for the pin component)
> - **Map pin icons** → `map/*.svg` (raw SVGs for Figma / docs / Storybook) + `map/pins.tsx` (React component spec)

## Quick links

| Need                                          | Look here                                       |
|-----------------------------------------------|-------------------------------------------------|
| Add a new color                               | `tokens/colors.json` + run `pnpm export:tokens` |
| Add a new component                           | `components/<name>.md` following the 9 existing specs |
| Adjust spacing/radius/shadow                  | `tokens/spacing.json`, `tokens/radius.json`, `tokens/shadows.json` |
| Add an animation                              | `tokens/motion.json`                             |
| Tweak a button or card                        | `components/button.md`, `components/card.md`    |
| Add a new pin type                            | `components/map-marker.md` + `map/pins.tsx` + `map/pin-<type>.svg` |
| See accessibility contract                    | `components/*.md` "Accessibility" section      |
| Verify WCAG AA contrast                       | `accessibility-audit.md`                        |

## Structure

```
design/
├── tokens/                # JSON source of truth (W3C Design Tokens format)
│   ├── schema.json
│   ├── index.json         # auto-generated aggregator
│   ├── colors.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── shadows.json
│   └── motion.json
├── components/            # 9 Markdown specs
│   ├── button.md
│   ├── card.md
│   ├── dialog.md
│   ├── form.md
│   ├── vote-buttons.md
│   ├── map-marker.md
│   ├── empty-state.md
│   ├── loading-state.md
│   └── error-state.md
├── map/                   # Pin SVGs + React spec
│   ├── pin-default.svg
│   ├── pin-school.svg
│   ├── pin-hospital.svg
│   ├── pin-pool.svg
│   ├── pin-library.svg
│   ├── pin-government.svg
│   ├── pin-other.svg
│   └── pins.tsx
├── scripts/               # Token + Figma tooling
│   ├── validate-tokens.ts     # pnpm tokens:validate
│   ├── build-index.ts         # pnpm tokens:build
│   ├── export-tokens.ts       # pnpm export:tokens
│   ├── figma-export.ts         # pnpm figma:export (BLOCKED — no PAT)
├── exports/               # Figma frame exports (empty until Figma file exists)
├── figma-url.txt          # URL placeholder + manual bootstrap instructions
├── package.json           # @eger/design workspace package
├── tsconfig.json
└── README.md              # this file
```

## Build pipeline

```
   ┌──────────────────────┐
   │ design/tokens/*.json │   ← manual edits
   └──────────┬───────────┘
              │ tokens:validate   (CI gate)
              │ tokens:build      (regenerates index.json)
              ▼
   ┌──────────────────────────────────────┐
   │ apps/web/tailwind.config.ts           │   ← generated, fenced
   │ apps/web/app/globals.css              │   ← generated, fenced
   │ apps/mobile/src/theme/tokens.ts       │   ← generated, fenced
   └──────────────────────────────────────┘
              ▲
              │ export:tokens      (run on every PR that touches tokens/)
              │
   ┌──────────────────────┐
   │ design/scripts/      │
   │ export-tokens.ts     │
   └──────────────────────┘
```

## Conventions

- Tokens are W3C Design Tokens Community Group format (`{ value, type, description }`).
- Component specs follow the template: Purpose, Variants, Anatomy, Props, States, Accessibility, Examples, Don'ts, Changelog.
- Generated files use `/* === AUTO-GEN:DESIGN_TOKENS === */` fences; hand-written code above/below the fences is preserved across re-runs.
- Mobile and web share the same token values via the export script — never edit generated files directly.

## Owner

`website-designer` agent profile. Questions or change requests: write to `~/.hermes/profiles/website/plans/` with subject `designer-change-<topic>`.
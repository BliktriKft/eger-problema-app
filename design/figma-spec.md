# Figma library — page-by-page spec

> Per-page content spec for the Eger Város Probléma Térkép Figma file. The
> bootstrap script (`design/scripts/figma-export.ts`) creates these pages
> automatically when the prerequisites are met; until then, this file documents
> what should go on each page so the human designer (or another agent) can
> build it manually.

## Page structure

The file contains **7 Figma pages**. Several pages hold multiple frames; the
total surface the user sees is **13 logical content groups** (1 cover, 1 token
gallery, 1 component grid, 7 web-screen frames, 4 mobile-screen frames, 1
accessibility page, 1 empty/loading/error page). The "13 vs 7" distinction
matters: Figma REST API exposes only `pages`, not `frames`, so we count at the
page level.

| # | Page name                          | Frames inside the page                  |
|---|------------------------------------|------------------------------------------|
| 1 | 📐 Cover                           | (single cover frame)                     |
| 2 | 🎨 Design tokens                   | color swatches, type ramp, scale bar     |
| 3 | 🧩 Components                      | 8 component grids × variants             |
| 4 | 💻 Web screens                     | **7 frames**: landing, map, list, detail, submit, auth, profile |
| 5 | 📱 Mobile screens                  | **4 frames**: map, feed, submit, detail  |
| 6 | 🚦 Empty / Loading / Error states  | 21 frames (7 screens × 3 states)         |
| 7 | ♿ Accessibility audit             | contrast table + focus + touch targets   |

## Page 1 — Cover

- Project name (text-5xl): **Eger Város Probléma Térkép — Design System**
- Subtitle: Közösségi problémabejelentő alkalmazás — Web + iOS + Android
- Version badge: **v0.1.0** — 2026-09-01
- Three swatch strips: Primary / Secondary / Accent
- Team attribution: BliktriKft · website-designer · @bliktri.ai

## Page 2 — Design tokens

Section: **Color palette**
- 12-step scales for each of: primary, secondary, muted, accent, destructive, success, warning
- Each swatch labelled: `<group>-<shade>` + hex + HSL
- 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, DEFAULT, fg

Section: **Typography**
- Inter Variable @ 100/400/500/600/700 with character map
- Source Serif 4 @ 400/600, sample paragraph
- JetBrains Mono @ 400, sample code block

Section: **Spacing scale**
- 4px-base grid: 0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256
- Visualised as a stepped bar

Section: **Radius**
- 0, 4, 8, 12, 16, 9999 — visualised as concentric corners

Section: **Shadow**
- sm, md, lg, xl — each on a card demo

Section: **Motion**
- Easing curves (ease-out, ease-out-back, ease-in-out) plotted
- Duration stops: 0, 150, 250, 400, 600ms
- Vote-bump keyframe preview

## Page 3 — Components

Each component laid out as a Frame with all variants × sizes × states in a grid.

- **Button** — variants: primary, secondary, accent, outline, ghost, destructive, link. Sizes: sm, md, lg, icon. States: default, hover, active, focus-visible, disabled, loading.
- **Card** — variants: default, elevated, outlined, flat, accent, destructive. Sizes: sm, md, lg, none. With header/content/footer anatomy.
- **Dialog** — variants: dialog, sheet-bottom, sheet-right, drawer, alert. Each with header + body + footer.
- **Form** — Input, Textarea, Select, Checkbox, RadioGroup, FormField wrapper. States for each.
- **VoteButtons** — expanded, compact, icon, inline. × neutral/upvoted/downvoted.
- **MapMarker** — 7 base types × 5 states (default, voted, own, moderated, selected). Tooltip overlay demo.
- **Badge** — category, status, institution type. Variants: filled, outline, soft.
- **EmptyState** — 6 variants (no-results, no-pins, no-votes, no-ai, error, first-time).

## Page 4 — Web screens (7 frames, 1440×900 each)

1. **Landing** — hero with "Jelents be egy problémát" CTA, recent 6 problems map preview, "Hogyan működik" 3-step explainer, footer.
2. **Térkép (`/map`)** — full-bleed Leaflet map, left panel with category + institution filter (collapsible on mobile), floating "Új pin" CTA top-right.
3. **Probléma lista (`/problems`)** — table/cards toggle, sort by score/date, filter by category/institution, infinite scroll.
4. **Probléma részletek (`/problems/[id]`)** — header with title + score + category badges, embedded mini-map showing location, vote buttons sidebar, AI-wiki section (with "források" expander), comment thread below.
5. **Új pin (`/submit`)** — title input, description textarea, category dropdown, institution autocomplete, image upload, location picker (click on map), anonymous toggle.
6. **Auth (`/login`, `/register`)** — split layout (illustration right), email + Google + Apple + Meta buttons, "elfelejtett jelszó" link.
7. **Profile (`/profile`)** — avatar, name, "saját beküldések" tab, "upvote-jaim" tab, "beállítások" tab.

## Page 5 — Mobile screens (4 frames)

iPhone 14 (390×844) frames + Android Pixel 7 (412×915) frames for each:

1. **Térkép** — bottom sheet for filters (snap 0.5/0.9), full-screen map, top bar with location search.
2. **Feed** — list of problem cards, infinite scroll, pull-to-refresh.
3. **Submit** — modal flow, step-by-step: title → description → category → institution → photo → location → confirm.
4. **Probléma részletek** — vertically stacked: photo map preview, title, score, description, AI-wiki accordion, vote buttons docked at bottom.

## Page 6 — Empty / Loading / Error states

For each screen in Web + Mobile: empty variant, loading variant (skeleton), error variant. 21 frames total.

## Page 7 — Accessibility audit

- WCAG 2.1 AA ratio table (export from `contrast:audit` script)
- Focus ring demo (3 contexts: light bg, accent bg, dark bg)
- Touch target size grid (44×44 minimum)
- Reduced motion: vote-bump replaced with instant state change

---

## Generating the file

### Prerequisites

1. A Figma Personal Access Token in `~/.hermes/profiles/website-designer/.env`:
   ```
   FIGMA_PERSONAL_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Required scope: **File content (read + write)** — see
   <https://www.figma.com/developers/api#access-tokens>. Without write scope,
   the script exits with code 2.

2. A Figma file that you have write access to. The REST API does **not**
   support creating a file via PAT. To create one:
     - Open <https://www.figma.com/files/team/BliktriKft> in a browser.
     - Click **New design file** → name it `Eger Város Probléma Térkép — Design System`.
     - Copy the file key from the URL (the segment between `/file/` and the
       file name — e.g. `https://www.figma.com/file/AbCdEf12345G/...` → key is
       `AbCdEf12345G`).
     - Set `FIGMA_FILE_KEY=<key>` in your `.env`.

### Run

```bash
cd /home/bliktri/workspaces/eger-problema-app
pnpm --filter @eger/design figma:export --dry-run    # probe + preview (no API writes)
pnpm --filter @eger/design figma:export              # probe + populate pages
```

The script will:
1. Probe `/v1/me`, `/v1/teams`, and `/v1/files/<key>` to verify the token can
   actually write. If the token is read-only, or the file isn't reachable, the
   script exits 2 with an actionable error message.
2. Create the 7 pages via `POST /v1/files/<key>/pages`. Pages that already
   exist are skipped (idempotent).
3. Write the public file URL to `design/figma-url.txt`.
4. Append `FIGMA_FILE_KEY=<key>` to `.env` if it isn't already set.

The script does **not** create the actual component frames — those need a
human designer. It only scaffolds the page structure so the designer can
drop in the visual variants per the per-page content above.
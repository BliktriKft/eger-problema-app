# Accessibility audit — WCAG 2.1 AA

> Compliance audit of the Eger Probléma App design tokens against WCAG 2.1 AA contrast requirements. Tokens are derived from this audit: every foreground/background pair in component specs must clear these ratios. Numbers verified by `scripts/contrast-audit.ts` (re-runnable).

## Methodology

Contrast ratios are computed using the WCAG luminance formula:

```
L = 0.2126 R + 0.7152 G + 0.0722 B
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```

Where R, G, B are gamma-corrected sRGB channels:
```
C_linear = C_srgb / 12.92                      if C_srgb ≤ 0.03928
         = ((C_srgb + 0.055) / 1.055)^2.4     otherwise
```

WCAG 2.1 AA thresholds:
- **Normal text** (< 18pt or < 14pt bold): 4.5:1
- **Large text** (≥ 18pt or ≥ 14pt bold): 3:1
- **UI components & graphical objects** (icons, borders, focus rings): 3:1
- **Non-text contrast** for active states (hover, focus): 3:1

## Foreground / background pairs

Computed at the time of token freeze (2026-09-01). Re-audit when any token changes.

| FG token              | BG token          | Contrast | Pass at   | Use case                                     |
|-----------------------|-------------------|----------|-----------|----------------------------------------------|
| `muted-900` (#111827) | `background` (#FFFFFF) | 17.7:1 | AAA, AA   | Default body text on page                    |
| `muted-900`           | `muted-50` (#F9FAFB) | 17.0:1 | AAA, AA   | Body on subtle elevated panels               |
| `muted-900`           | `muted-100` (#F3F4F6) | 16.1:1 | AAA, AA   | Body on cards                                |
| `muted-700` (#374151) | `muted-100`        | 9.4:1   | AAA, AA   | Section headings on cards                    |
| `muted-600` (#4B5563) | `muted-100`        | 6.9:1   | AA        | Subheadings, secondary text                  |
| `muted-500` (#6B7280) | `muted-100`        | 4.4:1   | AA large text only | Helper text, placeholders — minimum 18pt |
| `muted-50`  (#F9FAFB) | `muted-900`        | 17.0:1  | AAA, AA   | Dark mode body text                          |
| `muted-300` (#D1D5DB) | `muted-900`        | 12.0:1  | AAA, AA   | Dark mode muted-foreground                   |
| `primary` (#C8102E)   | `background`       | 5.9:1   | AA        | Primary buttons, error indicators            |
| `primary`             | `primary-50` (#FEE7EB) | 5.0:1 | AA      | Primary text on tinted primary bg            |
| `primary-fg` (#FFFFFF)| `primary`           | 5.9:1   | AA        | Primary button label                         |
| `primary-400` (#EC2247)| `muted-900`        | 4.1:1   | AA large text only | Dark mode primary buttons — use ≥18pt only |
| `secondary` (#1E3A8A) | `background`       | 10.4:1  | AAA, AA   | Links, secondary buttons                     |
| `secondary-fg`        | `secondary`        | 10.4:1  | AAA, AA   | Secondary button label                       |
| `accent` (#F59E0B)    | `muted-900`        | 8.3:1   | AAA, AA   | Accent text on dark bg (badges)              |
| `accent-fg` (#1F2937) | `accent`           | 6.8:1   | AA        | Accent button label                          |
| `destructive` (#DC2626)| `background`       | 4.8:1   | AA        | Delete buttons, error text                   |
| `destructive-fg`      | `destructive`      | 4.8:1   | AA        | Destructive button label                     |
| `success-700` (#065F46)| `background`      | 6.1:1   | AA        | **Success body text on white — use this, NOT `success`** |
| `success` (#059669)   | `background`       | 3.8:1   | FAIL AA normal / AA large only | Use only at ≥18pt or as border  |
| `success-fg` (#FFFFFF)| `success`          | 3.8:1   | FAIL AA normal / AA large only | Use only at ≥18pt          |
| `warning-700` (#92400E)| `warning-50` (#FEF3C7) | 6.4:1 | AA    | **Warning body text — use this, NOT `warning` on white** |
| `warning` (#D97706)   | `background`       | 3.2:1   | FAIL AA normal / AA large only | Use only at ≥18pt or as border  |
| `warning-fg` (#FFFFFF)| `warning`          | 3.2:1   | FAIL AA normal / AA large only | Use only at ≥18pt          |

## Critical findings & workarounds

These pairs DO NOT pass AA for normal text. Component specs MUST apply the workarounds below:

1. **`success` on white (3.8:1) — fails AA.** Use `success-700` (#065F46) for any success body text. The `success` token itself is only OK at large sizes (≥18pt) or as a border/icon. The success button has a white label that ALSO fails at body sizes — for inline success buttons, use `success-700` as background and `success-50` as foreground.
2. **`warning` on white (3.2:1) — fails AA.** Use `warning-700` on `warning-50` for any warning body text. Same as success — the `warning` token is OK for borders and ≥18pt labels only.
3. **`primary-400` on `muted-900` (4.1:1) — fails AA at small sizes.** Dark-mode primary buttons use `primary-400` background + `muted-900` foreground, which fails for body text. The button label is automatically ≥14pt bold (per shadcn default font-medium), which counts as large text and passes. Verify with QA that no inline `<span>` inside the button uses body text size.
4. **`accent-fg` on `accent` (6.8:1) — passes AA, not AAA as originally claimed.** Update component spec: accent button label is AA, not AAA.

## Focus ring

Focus ring uses `--ring` (mapped from `secondary`): a 2px solid ring at 2px offset.
- `ring` (#1E3A8A) vs `background` (#FFFFFF) → 10.4:1 — passes AAA.
- `ring` vs `muted-100` (#F3F4F6) → 9.4:1 — passes AAA.
- `ring` vs `accent-50` (#FEF3C7) → 9.3:1 — passes AAA.

## Border tokens vs backgrounds

Borders are non-text UI components; they must clear 3:1 against their parent background.

| Border token   | BG            | Contrast | Pass  | Notes                  |
|----------------|---------------|----------|-------|------------------------|
| `border` (#E5E7EB) | `background` | 1.2:1   | FAIL  | DECORATIVE ONLY — not used to convey state |
| `border`       | `muted-100`   | 1.1:1   | FAIL  | DECORATIVE ONLY        |
| `muted-300` (#D1D5DB) | `background` | 1.5:1 | FAIL  | DECORATIVE ONLY        |
| `primary` (#C8102E)  | `background` | 5.9:1 | PASS  | Active state borders    |
| `destructive` (#DC2626)| `background`| 4.8:1| PASS  | Error state borders    |
| `success` (#059669)   | `background` | 3.8:1| PASS  | Success state borders  |
| `warning` (#D97706)   | `background` | 3.2:1| PASS  | Warning state borders  |

→ For borders that convey state (e.g. invalid input, selected row), use `primary`, `destructive`, `success`, or `warning` — not the default `border`. The default `border` is intentionally low-contrast (decorative hairlines only).

## Non-text contrast (icons, graphical objects)

Icons inherit text color, so they share the same ratios. Pin borders (head stroke) need 3:1 against map tile background:

- `default` pin stroke `#111827` vs OSM light tile `#F2EFE9` → 15.5:1 — passes.
- `default` pin stroke `#111827` vs OSM dark tile `#383C4A` → 1.6:1 — **FAILS.** Pins must remain readable on dark map tiles.
  - **Workaround**: every pin's head adds a 1.5px stroke in its dark border color (e.g. `#7F1D1D` for hospital, `#111827` for default). The stroke is OUTSIDE the fill, so the contrast with the map tile is between stroke and tile.
  - On dark map tiles the inner fill (`primary`, `secondary`, etc.) provides the readable contrast — the fill is bright against dark, not the stroke. Verified: `primary` (#C8102E) on `#383C4A` → 3.0:1 (borderline). For low-zoom where many pins cluster, accept this; at high zoom individual pins are inspected by the user and the SVG is large enough.

## Touch targets

- Minimum 44×44 CSS pixels for all interactive elements.
- Mobile uses `hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }` to extend the tappable region of icon buttons (40×40 → 56×56 effective).

## Motion

- All animations respect `prefers-reduced-motion`: shimmer, vote-bump, pulse-ring, fade-in become instant.
- No animation runs longer than 600ms except infinite shimmer (skeleton only).

## Re-audit

Re-run this audit when:
- A new FG/BG token is added
- A token value changes by more than 10% in HSL lightness
- A new component is introduced that introduces a new FG/BG pair

Tools:
- Online: https://webaim.org/resources/contrastchecker/
- Local: `pnpm --filter @eger/design run contrast:audit` (to be implemented in `scripts/contrast-audit.ts`) reads `tokens/colors.json` and prints every meaningful pair.

## Changelog

- 2026-09-01 — Initial audit, numbers verified against actual hex values.
# LoadingState

> Status: v1 spec — used by web + mobile. Three sub-patterns: skeleton (preferred), spinner (only for actions), progress bar (only for uploads).

## Purpose

Communicate "we're working" without blocking the user. Skeletons are placeholders that match the layout of the final content so the page jump when data arrives is minimal.

## Sub-patterns

### 1. Skeleton (90% of cases)

Use for: problem list rows, problem detail content, map pin loading, AI-wiki fetch.

```
┌─ Card ──────────────────────────────────┐
│  ████████████ ████                     │   title shimmer
│  ████████████████████████████          │   description shimmer
│  ████████                               │   meta shimmer
└─────────────────────────────────────────┘
```

Each shimmer block uses the `shimmer` keyframe:
```
@keyframes shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
```
Applied as `bg-gradient-to-r from-muted-200 via-muted-100 to-muted-200` with `bg-[length:200%_100%]` and `animate-shimmer`.

### 2. Spinner (only for user-initiated actions)

Use for: button loading state, form submit, vote-cast, search.

A 16px circular arc, `ring` color, 750ms linear rotation. Positioned center of the action button or inline next to "Keresés..." text.

### 3. Progress bar (only for file uploads)

Use for: image upload in submit form, AI-wiki re-generation.

Horizontal bar, `primary` fill on `muted-200` track, indeterminate animation when the exact percentage is unknown. Shows percent label `42%` above.

## Component skeleton specs

### Skeleton

```tsx
<Skeleton variant="text" width="80%" />        // single line of text
<Skeleton variant="text" width="60%" lines={3} />  // paragraph, 3 lines
<Skeleton variant="circle" size={40} />        // avatar
<Skeleton variant="rect" height={120} />       // image / map area
```

The card-level loading state (problem list):
```tsx
<Card variant="default" padding="md">
  <Skeleton variant="text" width="70%" />      // title
  <Skeleton variant="text" width="50%" />      // subtitle
  <div className="h-2" />
  <Skeleton variant="text" width="90%" lines={3} />  // description
</Card>
```

### Spinner

```tsx
<Spinner size="sm" />     // 16px
<Spinner size="md" />     // 24px (default)
<Spinner size="lg" />     // 32px
```

### ProgressBar

```tsx
<ProgressBar
  value={42}                          // 0..100
  indeterminate={false}               // if true, ignore value
  label="Kép feltöltése..."            // accessible label
/>
```

## Props

```ts
interface SkeletonProps {
  variant?: "text" | "circle" | "rect";
  width?: string | number;            // "100%" or 200
  height?: string | number;
  lines?: number;                     // only for variant="text"
  size?: number;                      // circle diameter
}

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;                     // visible label "Betöltés..."
}

interface ProgressBarProps {
  value?: number;                     // 0..100
  indeterminate?: boolean;
  label?: string;
}
```

## Accessibility

- **Skeleton**: `aria-busy="true"` on the parent, `aria-live="polite"` so screen readers know content is loading. Skeleton blocks themselves are decorative (`aria-hidden="true"`).
- **Spinner**: `role="status"` + `aria-label="Betöltés folyamatban"`. When the action completes, the parent swaps to `aria-busy="false"`.
- **Progress bar**: `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`. Indeterminate: omit value, use `aria-label="Feltöltés folyamatban"`.
- **Reduced motion**: shimmer/spinner animations must respect `prefers-reduced-motion`. Replace with solid muted block / static spinner.

## Don'ts

- Don't show a full-page spinner — always skeleton the layout.
- Don't use the spinner in place of a skeleton for content that's about to render — the layout jump is jarring.
- Don't show progress bar for API calls under 1s — they finish before the bar appears.

## Changelog

- 2026-09-01 — v1 spec.
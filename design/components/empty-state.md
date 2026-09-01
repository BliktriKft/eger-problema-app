# EmptyState

> Status: v1 spec — used by web + mobile. Renders an illustration, message, and optional CTA.

## Purpose

When the user lands on a screen that has no data yet — empty map region, no problems in a filter, no search results. The empty state is the user's first impression of "this is a real app", so it can't be a sad illustration plus "No data".

## Anatomy

```
         ┌──────────────────────┐
         │                      │
         │     [illustration]   │   120-200px tall, full-width
         │                      │
         ├──────────────────────┤
         │  Cím (text-lg)       │   1 line, semibold
         │  Leírás (text-sm     │   1-3 lines, muted-foreground
         │   muted-foreground)  │
         │                      │
         │  [CTA button]        │   optional
         └──────────────────────┘
```

The whole block is centered horizontally, max-width 480px.

## Variants

| Variant     | Illustration                          | Default copy                                          | CTA                              |
|-------------|---------------------------------------|-------------------------------------------------------|----------------------------------|
| `no-results`| search.svg (line illustration)        | "Nincs a keresésnek megfelelő probléma."               | "Szűrők törlése"                 |
| `no-pins`   | map-empty.svg                         | "Ebben a körzetben még nincs bejelentés."             | "Legyen az első!"                |
| `no-votes`  | vote-empty.svg                        | "Még nem szavaztál semmire."                          | "Fedezd fel a térképet"          |
| `no-ai`     | ai-empty.svg                          | "Erről a problémáról még nincs AI-wiki."              | "Értesít, ha kész" (later)       |
| `error`     | warning.svg                           | "Valami elromlott. Próbáld újra."                     | "Újrapróbálkozás"                |
| `first-time`| welcome.svg                           | "Üdv Egerben! Jelentsd az első problémát."            | "Bejelentés indítása"            |

The actual SVG illustrations live in `design/illustrations/` (out of MVP scope but follow same naming).

## States

| State      | Visual                                                | Animation |
|------------|-------------------------------------------------------|-----------|
| default    | as variant                                            | —         |
| hover (CTA)| shade -100                                            | 150ms     |
| focus-visible | `ring` 2px around CTA                              | instant   |

## Props (web)

```ts
interface EmptyStateProps {
  variant: "no-results" | "no-pins" | "no-votes" | "no-ai" | "error" | "first-time";
  title: string;          // override the default copy
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
  };
  illustration?: React.ReactNode;     // override the default illustration
}
```

## Props (mobile)

```ts
interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}
```

## Accessibility

- **Heading role**: the title is `<h2>` (web) or `accessibilityRole="header"` (mobile).
- **Image**: the illustration is decorative — `alt=""` (web) / `accessibilityElementsHidden={true}` (mobile). Don't describe the illustration in screen reader text.
- **CTA**: standard button a11y rules — see `button.md`.

## Examples

```tsx
// Problem list, no filters match
<EmptyState
  variant="no-results"
  action={{ label: "Szűrők törlése", onClick: clearFilters }}
/>

// Map at extreme zoom-out with no clusters
<EmptyState
  variant="no-pins"
  action={{ label: "Bejelentés indítása", onClick: navigateToSubmit, variant: "primary" }}
/>

// Custom copy for moderation queue
<EmptyState
  variant="no-results"
  title="Nincs függőben lévő bejelentés"
  description="Mindenkit naprakészen moderáltunk."
  action={{ label: "Vissza a térképhez", onClick: goBack }}
/>
```

## Don'ts

- Don't use the same illustration for `error` and `first-time` — error should feel heavy, welcome should feel inviting.
- Don't omit the CTA when there's a clear next action — leaving the user stranded kills engagement.
- Don't make the empty state taller than 75% of the viewport — it's a state, not a destination.

## Changelog

- 2026-09-01 — v1 spec.
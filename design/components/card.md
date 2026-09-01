# Card

> Status: v1 spec — used by web + mobile. Wraps shadcn/ui `Card` (web) and a `View` with `borderRadius: radius.lg` + shadow (mobile).

## Purpose

The fundamental surface for grouped content: problem list rows, problem detail header, AI-wiki sections, institution badges, and modals.

## Variants

| Variant      | Background       | Border             | Shadow     | Use case                              |
|--------------|------------------|--------------------|------------|---------------------------------------|
| `default`    | `card` (white)   | `border` 1px       | `shadow.sm`| List rows, problem detail sections    |
| `elevated`   | `card`           | none               | `shadow.md`| Modals, popovers, vote button area    |
| `outlined`   | `background`     | `border` 1px       | none       | Inline grouped forms, filters         |
| `flat`       | `muted`          | none               | none       | Sub-cards inside another card         |
| `accent`     | `accent` (50)    | `accent` 1px       | none       | AI-wiki reveal, highlights            |
| `destructive`| `destructive` 50 | `destructive` 1px  | none       | Error banners, moderation warnings    |

## Padding scale

| Size   | Padding | Use case                       |
|--------|---------|--------------------------------|
| `sm`   | 12px    | Compact list rows              |
| `md`   | 16px    | DEFAULT — most cards           |
| `lg`   | 24px    | Detail headers, dialogs        |
| `none` | 0       | Media-only cards (image fills) |

## Anatomy

```
┌─ CardHeader ────────────────┐
│ Title (text-lg semibold)    │   row 1
│ Subtitle (text-sm muted)    │   row 2 (optional)
├─ CardContent ───────────────┤
│ Body                        │
│                             │
├─ CardFooter ────────────────┤
│ Action buttons / meta       │   right-aligned
└─────────────────────────────┘
```

All sub-components are optional. Most common pattern in this app is `CardHeader` + `CardContent` only.

## Props (web)

```ts
interface CardProps {
  variant?: "default" | "elevated" | "outlined" | "flat" | "accent" | "destructive";
  padding?: "sm" | "md" | "lg" | "none";
  asChild?: boolean;
  interactive?: boolean;             // makes the whole card a Link
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

## Props (mobile)

```ts
interface CardProps {
  variant?: CardVariant;
  padding?: "sm" | "md" | "lg" | "none";
  onPress?: () => void;              // makes it tappable
  accessibilityRole?: "button" | "summary";
  accessibilityLabel?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}
```

## Accessibility

- **Heading**: if the card has a primary title, wrap it in `<h2>` / `<h3>` so screen readers can navigate by heading. The card itself is NOT a heading.
- **Interactive cards**: when `onClick`/`onPress` is set, the card becomes `role="button"` (web) or `accessibilityRole="button"` (mobile). Must have an `aria-label` describing the action.
- **Focus ring**: must match the `ring` token. The default web focus is a 2px ring, offset 2px, color `ring`.
- **Contrast**: card titles must meet WCAG AA (4.5:1 against card background). The `muted-foreground` token does NOT — use `foreground` for titles.

## Composes with

- `<VoteButtons>` — placed in `CardFooter`
- `<Badge>` — used in `CardHeader` for category / institution type / status
- `<Button variant="ghost" size="sm">` — for inline actions

## Examples

```tsx
// Problem list row
<Card variant="default" padding="md" interactive onClick={() => navigate(`/problems/${id}`)}>
  <CardHeader>
    <h3 className="text-lg font-semibold">{problem.title}</h3>
    <p className="text-sm text-muted-foreground">{problem.institution.name}</p>
  </CardHeader>
  <CardContent>
    <p className="text-sm line-clamp-2">{problem.description}</p>
  </CardContent>
  <CardFooter className="justify-between">
    <Badge variant="outline">{categoryLabel(problem.category)}</Badge>
    <VoteButtons score={problem.score} state={voteState(problem)} compact />
  </CardFooter>
</Card>

// AI-wiki section
<Card variant="accent" padding="lg">
  <CardHeader>
    <SparklesIcon /> AI-wiki összefoglaló
  </CardHeader>
  <CardContent className="font-serif leading-relaxed">
    {wiki.summary}
  </CardContent>
</Card>
```

## Don'ts

- Don't nest cards inside cards without using `flat` variant on the inner one — depth stops being readable.
- Don't use `elevated` for an entire list — use `default` for rows so the eye scans flat.
- Don't put `interactive` on a card that contains another tappable element — keep the tap target singular.

## Changelog

- 2026-09-01 — v1 spec.
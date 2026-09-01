# Button

> Status: v1 spec — used by web + mobile. Backed by shadcn/ui on web (with our token override) and a native `Pressable` wrapper on mobile.

## Purpose

The single most-used interactive component. Primary calls to action, secondary actions, ghost buttons on dense surfaces, and destructive confirmations.

## Variants

| Variant      | Token mapping                          | Use case                                      |
|--------------|----------------------------------------|-----------------------------------------------|
| `primary`    | `bg-primary` / `text-primary-fg`        | Submit problem, upvote, "Bejelentem" CTA       |
| `secondary`  | `bg-secondary` / `text-secondary-fg`    | Secondary CTAs, login with email              |
| `accent`     | `bg-accent` / `text-accent-fg`          | AI-wiki reveal, attention grabs               |
| `outline`    | `border-border` / `bg-background`       | Cancel, "Mégse"                               |
| `ghost`      | `bg-transparent` / `text-foreground`   | Tertiary actions in dense lists               |
| `destructive`| `bg-destructive` / `text-destructive-fg`| Delete, ban, remove                           |
| `link`       | `text-secondary` underline on hover     | Inline action, "Tovább"                        |

## Sizes

| Size   | Height | Padding-x | font-size | Use case                          |
|--------|--------|-----------|-----------|-----------------------------------|
| `sm`   | 32px   | 12px      | `sm`      | Inline form actions, table rows   |
| `md`   | 40px   | 16px      | `base`    | DEFAULT — most buttons            |
| `lg`   | 48px   | 24px      | `lg`      | Landing page hero CTAs            |
| `icon` | 40px   | 0         | n/a       | Square icon-only (×, +, vote ▲)   |

## States (applied to all variants × sizes)

| State      | Visual                                              | Animation     |
|------------|-----------------------------------------------------|---------------|
| default    | as token                                            | —             |
| hover      | shade -100 (lighter) for `primary`/`secondary`, +100 for `outline`/`ghost` | 150ms ease-out |
| active     | shade -200                                          | 100ms ease-in |
| focus-visible | `ring` (2px solid `ring`, offset 2px)             | instant       |
| disabled   | `bg-muted` `text-muted-foreground` opacity-50      | —             |
| loading    | spinner replaces text; aria-busy=true              | shimmer 1500ms |

## Props (web — shadcn/ui + extend)

```ts
interface ButtonProps {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
  asChild?: boolean;                    // shadcn Slot pattern
  loading?: boolean;                    // shows spinner
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  children?: React.ReactNode;
  onClick?: (e: MouseEvent) => void;
  disabled?: boolean;
  "aria-label"?: string;                // required for icon-only
}
```

## Props (mobile — React Native)

```ts
interface ButtonProps {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: React.ComponentType<any>;
  rightIcon?: React.ComponentType<any>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;           // required
  accessibilityRole?: "button" | "link";
  testID?: string;
  children: React.ReactNode;
}
```

## Accessibility

- **Focus visible**: `ring` token, 2px width, 2px offset, `outline-style: solid` (not none). Never use `outline: none` without an explicit focus ring.
- **Keyboard**: `Space` and `Enter` activate the button. Tab order must be sequential.
- **Screen reader**: `aria-label` is mandatory for icon-only buttons. The visible text label IS the aria-label for buttons with text. Loading state uses `aria-busy="true"`.
- **Disabled state**: do NOT use `disabled` attr on the underlying `<button>` — set `aria-disabled="true"` and visually disable, so screen readers can still announce the action.
- **Touch target**: minimum 44×44 CSS pixels (mobile uses hitSlop `8px` to extend the tappable area).

## Composability

- Use `asChild` (web) to render `<a>` / `<Link>` styled as a button — keeps the focus ring + semantics.
- Mobile: pass `<Pressable accessibilityRole="button">` underneath the React Native wrapper.

## Examples

```tsx
// Primary CTA on submit page
<Button variant="primary" size="lg" leftIcon={MapPinIcon}>Új pin leadása</Button>

// Destructive confirm in moderation modal
<Button variant="destructive" onClick={confirmDelete}>Probléma törlése</Button>

// Inline icon button (vote)
<Button variant="ghost" size="icon" aria-label="Upvote" onClick={upvote}>
  <ArrowUpIcon />
</Button>
```

## Don'ts

- Don't use `primary` for destructive actions — they need `destructive` so screen reader users hear "Törlés megerősítése".
- Don't combine `primary` + `accent` on the same screen — only one primary visual focus at a time.
- Don't put `loading` spinner on `ghost` or `link` — show inline change instead.

## Changelog

- 2026-09-01 — v1 spec, committed with design tokens.
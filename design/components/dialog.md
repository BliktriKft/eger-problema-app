# Dialog / Sheet

> Status: v1 spec — used by web + mobile. Web uses Radix Dialog primitives (shadcn/ui) on top of our tokenized CSS variables; mobile uses a custom `Modal` wrapper around `react-native-modal` or the built-in Expo Router `<Modal>`.

## Purpose

Confirmation prompts (delete a problem, anonymous submit?), focused forms (institution search picker), and contextual detail expansion (AI-wiki "források" expander inside the problem detail page).

## Variants

| Variant   | Surface         | Background overlay | Animation                | Use case                       |
|-----------|-----------------|--------------------|--------------------------|--------------------------------|
| `dialog`  | centered, 480px | 60% black          | fade-in + scale 0.96 → 1 | Confirmations, focused forms   |
| `sheet-bottom` | full width, 50% height | 60% black | slide-up from bottom      | Mobile filters, mobile submit  |
| `sheet-right` | 480px wide, full height | 60% black | slide-in from right       | Web filter panel, side nav     |
| `drawer`  | full height     | 80% black          | slide-up full-screen     | Mobile problem detail (push)    |
| `alert`   | centered, 360px | 80% black          | fade-in                  | Destructive confirm            |

All variants share:
- `border-radius: radius.lg` (12px) — except `drawer` which is `radius.none` top corners
- `shadow-lg`
- Backdrop: `rgb(0 0 0 / 0.6)` with backdrop-blur `4px` on web
- Trap focus inside the dialog while open
- Close on `Esc` (web), Android back button, iOS swipe-down (drawer only)

## Anatomy

```
┌─ Header ──────────────────────┐
│ Title                          │
│ Description (optional)         │   ✕ close (top-right)
├─ Body ────────────────────────┤
│ Content                        │
│                                │
├─ Footer ──────────────────────┤
│       [Cancel]  [Confirm]      │   right-aligned, gap-2
└────────────────────────────────┘
```

For destructive confirmations:
```
┌─ Header (destructive variant) ┐
│ ⚠ Probléma törlése             │
│ Ez a művelet nem visszavonható.│
├─ Footer ──────────────────────┤
│       [Mégse]  [Törlés]        │   törlés = destructive variant
└────────────────────────────────┘
```

## Props (web)

```ts
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "dialog" | "sheet-bottom" | "sheet-right" | "drawer" | "alert";
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissable?: boolean;          // default true; click backdrop closes
  // shadcn-style: use DialogTitle, DialogDescription, DialogFooter inside children for
  // flexible composition.
}
```

## Props (mobile)

```ts
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  variant?: "sheet-bottom" | "drawer";
  title?: string;
  snapPoints?: number[];          // for bottom sheet: [0.5, 0.9]
  children: React.ReactNode;
  // For drawers: also expose onDismiss and gestureEnabled.
}
```

## Accessibility

- **Focus trap**: focus enters on the first focusable element; cycles through dialog; returns to the trigger on close.
- **Aria**: `<div role="dialog" aria-modal="true" aria-labelledby="<title-id>">`. Title is `aria-labelledby`, description is `aria-describedby`.
- **Esc to close** (web): bound globally while open.
- **Backdrop click**: closes if `dismissable=true`. Otherwise require explicit cancel button.
- **iOS swipe-down**: only on `drawer` variant. Must respect `gestureEnabled` prop.
- **Reduced motion**: when `prefers-reduced-motion`, skip the slide/scale and just fade.
- **Scroll lock**: body scroll is locked while open (web). On mobile, only the sheet content scrolls; underlying screen does not.

## Examples

```tsx
// Destructive confirm
<Dialog
  open={pendingDelete}
  onOpenChange={setPendingDelete}
  variant="alert"
  title="Probléma törlése"
  description="Ez a művelet nem visszavonható. A probléma és minden szavazat véglegesen törlődik."
  footer={
    <>
      <Button variant="outline" onClick={() => setPendingDelete(false)}>Mégse</Button>
      <Button variant="destructive" onClick={confirmDelete}>Törlés</Button>
    </>
  }
/>

// Mobile filter sheet
<Sheet
  visible={filtersOpen}
  onClose={() => setFiltersOpen(false)}
  variant="sheet-bottom"
  snapPoints={[0.5, 0.9]}
  title="Szűrők"
>
  <CategoryFilter />
  <InstitutionFilter />
  <Button onClick={apply} size="lg" className="w-full">Alkalmaz</Button>
</Sheet>
```

## Don'ts

- Don't use `dialog` for content taller than 75vh — switch to `drawer` (mobile) or full-page route (web).
- Don't trap focus in a dialog that opens another dialog — use a `nested-dialog` aware focus trap (Radix handles this; the mobile sheet wrapper must implement it).
- Don't use destructive variant header styling on a non-destructive action — that's confusing.

## Changelog

- 2026-09-01 — v1 spec.
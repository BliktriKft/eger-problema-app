# Form

> Status: v1 spec — Input, Textarea, Select, Checkbox, RadioGroup, FormField wrapper, FormLabel, FormMessage. Backed by react-hook-form + Zod on web; by the same Zod schemas + custom hooks on mobile.

## Purpose

Every form in the app — new pin submission, login, register, profile edit, moderation queue filters.

## Component anatomy (Input as the example)

```
┌─────────────────────────────────┐
│ Cimke (label, semibold, text-sm)│  optional but recommended
├─────────────────────────────────┤
│ ┌───────────────────────────┐   │
│ │ Helyőrző szöveg (placeholder)│   │  input
│ └───────────────────────────┘   │
├─────────────────────────────────┤
│ Segítség (helper, text-xs muted)│  optional
└─────────────────────────────────┘
                            ↑
                Error message replaces helper
                  text-destructive-foreground
                  text-destructive bg-destructive-50
                  (visible only when error present)
```

## Components

### Input

```ts
interface InputProps {
  type?: "text" | "email" | "password" | "url" | "search" | "tel";
  size?: "sm" | "md" | "lg";      // default md = 40px height
  invalid?: boolean;                // visual error state
  disabled?: boolean;
  readOnly?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  autoComplete?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}
```

Sizes: `sm` 32px, `md` 40px (default), `lg` 48px.

### Textarea

Same as Input but multi-line. Min height 96px, max 320px, auto-grow up to max.

### Select

```ts
interface SelectProps {
  options: { value: string; label: string }[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}
```

On web: native `<select>` for MVP (a11y wins). On mobile: `@react-native-picker/picker`.

### Checkbox / Radio

Square (16px) for checkbox, circle (16px) for radio. Custom styled, not native — keeps visual consistency across browsers.

### FormField (wrapper)

Composes `Label + Input + helper/error`. Use this for 90% of fields — keeps the spacing consistent.

```tsx
<FormField
  label="Cím"
  helper="Röviden, lényegre törően."
  error={errors.title?.message}
  required
>
  <Input {...register("title")} invalid={!!errors.title} />
</FormField>
```

## States

| State      | Border                       | Background         | Notes                          |
|------------|------------------------------|--------------------|--------------------------------|
| default    | `input` (gray-200)           | `background`       | —                              |
| hover      | `muted-foreground`           | `background`       | —                              |
| focus      | `ring` 2px + `border-input`  | `background`       | ring offset 2px                |
| invalid    | `destructive` 2px            | `destructive-50`   | aria-invalid=true              |
| disabled   | `muted-300`                  | `muted-100`        | text-muted-foreground          |
| read-only  | `input`                      | `muted-50`         | cursor: default                |

## Validation pattern

- Inline validation triggers on `blur`, not on `change` — don't shout at users while they're typing.
- Submit-time validation: if any field is still invalid, focus the first invalid field.
- Server errors: surfaced in the same slot as inline errors, with an extra icon `AlertCircleIcon`.

## Accessibility

- **Label association**: every input MUST have a `<label>` linked via `htmlFor` or wrapping the input. Never rely on placeholder alone.
- **Required indicator**: visible `*` after the label, plus `aria-required="true"` on the input.
- **Error association**: error message has `id="<field>-error"`, input has `aria-describedby="<field>-error"`.
- **Helper text**: also `aria-describedby` (multiple IDs allowed, space-separated).
- **Disabled**: use `disabled` + `aria-disabled="true"` — never disable alone.
- **Touch target**: 44×44 minimum. Mobile hitSlop extends tappable area.
- **Keyboard**: Tab order follows visual order. Space toggles checkbox/radio. Esc cancels a select dropdown.

## Layout

Form sections stack vertically with `gap-6` (24px). Within a section, fields stack with `gap-4` (16px). Inline field groups (city + postcode) stack horizontally with `gap-2` (8px) on desktop, vertically on mobile.

## Examples

```tsx
// Submit form (web)
<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
  <FormField
    label="Cím"
    required
    helper="Pl.: „Kátyú a Kossuth utcában, a 12. ház előtt”"
    error={errors.title?.message}
  >
    <Input {...register("title")} placeholder="Rövid leírás" />
  </FormField>

  <FormField label="Kategória" required error={errors.category?.message}>
    <Select
      options={CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
      {...register("category")}
    />
  </FormField>

  <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
    Bejelentem
  </Button>
</form>
```

## Don'ts

- Don't rely on placeholder as a label — accessibility fails and users lose context after the first keystroke.
- Don't validate on every keystroke (annoying) or only on submit (silent until too late) — `onBlur` is the sweet spot.
- Don't put more than 4 inline fields in a row on mobile — switch to stacked.

## Changelog

- 2026-09-01 — v1 spec.
# ErrorState

> Status: v1 spec — used by web + mobile. For full-screen errors (page-level) and inline errors (form fields, list rows).

## Purpose

Surface failures gracefully. The user should never see a raw "TypeError: undefined" — they see a human message, a recovery action, and a way to report if it's persistent.

## Sub-patterns

### 1. Full-screen error (page-level)

Network failure, 500 from the API, auth expired, etc.

```
┌────────────────────────────────────┐
│                                    │
│           [warning icon]           │   destructive variant
│                                    │
│   Nem sikerült betölteni az       │   title (text-2xl)
│   adatokat.                        │
│                                    │
│   Ellenőrizd az internetkapcso-   │   description (text-sm muted)
│   latod, vagy próbáld újra.        │
│                                    │
│   [Újrapróbálkozás]  [Vissza]      │   primary + outline CTAs
│                                    │
└────────────────────────────────────┘
```

### 2. Inline error (form field, list row)

Replaces the empty state of a specific region.

```
┌────────────────────────────────────┐
│ ⚠ Nem sikerült betölteni ezt       │   destructive card variant
│   a problémát.                     │
│              [Újra]                │
└────────────────────────────────────┘
```

### 3. Toast (transient)

For success/confirmations and minor errors. Don't overuse — toasts disappear.

```
┌────────────────────────────────────┐
│  ✓ Szavazatod rögzítettük.         │   success variant
└────────────────────────────────────┘
```

## Severity → variant mapping

| Severity  | Variant       | Icon            | When                                       |
|-----------|---------------|-----------------|--------------------------------------------|
| info      | `info`        | `InfoIcon`      | "A problémát moderátorunk ellenőrzi."     |
| success   | `success`     | `CheckIcon`     | "Szavazatod rögzítettük."                  |
| warning   | `warning`     | `AlertTriangle` | "Az internetkapcsolatod instabil."         |
| error     | `destructive`  | `AlertCircle`   | "Nem sikerült betölteni az adatokat."      |

## Component anatomy

For full-screen:
```
<ErrorState
  severity="error"
  title="Nem sikerült betölteni az adatokat."
  description="Ellenőrizd az internetkapcsolatod, vagy próbáld újra."
  primaryAction={{ label: "Újrapróbálkozás", onClick: retry }}
  secondaryAction={{ label: "Vissza a térképhez", onClick: navigateToMap }}
  errorCode="ERR_NETWORK"   // optional, shown to developers only
/>
```

For inline:
```
<ErrorState
  severity="error"
  variant="inline"
  title="Nem sikerült betölteni ezt a problémát."
  action={{ label: "Újra", onClick: retry }}
/>
```

For toast (transient):
```
toast.error("Nem sikerült elküldeni a szavazatod.");
toast.success("Szavazatod rögzítettük.");
```

## Props

```ts
interface ErrorStateProps {
  severity: "info" | "success" | "warning" | "error";
  variant?: "full" | "inline" | "toast";   // default "full"
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  errorCode?: string;                       // for support/debug — hidden in prod
  onDismiss?: () => void;                   // for toast / inline
}
```

## Accessibility

- **Role**: `role="alert"` for `error` and `warning` (announced immediately). `role="status"` for `success` and `info` (announced politely).
- **Live region**: full-screen errors use `aria-live="assertive"`. Toasts and inline use `aria-live="polite"`.
- **Focus**: full-screen error gets focus on its primary action button when shown, so keyboard users can immediately retry.
- **Icon**: decorative — `aria-hidden="true"`.
- **Toast duration**: max 5 seconds for success, 8 seconds for error. Dismissible via close button or click.

## Recovery patterns

Always offer a path forward:
1. **Retry** — primary action when the failure is transient (network, 503, 429).
2. **Navigate back** — secondary action when the user came from elsewhere.
3. **Sign in** — when the error is 401.
4. **Contact support** — last resort, with `mailto:` or a support page link. Only for true unrecoverables.

## Don'ts

- Don't show raw error messages ("TypeError: Cannot read property 'title' of undefined") — log them server-side, show a human message client-side.
- Don't auto-dismiss error toasts — they need acknowledgment. Auto-dismiss only success toasts.
- Don't use `error` severity for "feature not available yet" — that's `info`.
- Don't show a full-screen error when only one section failed — use inline error for that section and keep the rest of the page working.

## Examples

```tsx
// Network failure on map page
<ErrorState
  severity="error"
  title="Nem sikerült betölteni a térképet."
  description="Ellenőrizd az internetkapcsolatod, vagy próbáld újra."
  primaryAction={{ label: "Újrapróbálkozás", onClick: refetch }}
  secondaryAction={{ label: "Vissza a főoldalra", onClick: navigateHome }}
/>

// Inline error on a single problem card
<ErrorState
  severity="error"
  variant="inline"
  title="Nem sikerült betölteni ezt a problémát."
  action={{ label: "Újra", onClick: retry }}
/>

// Toast after a successful vote
toast.success("Szavazatod rögzítettük.", { duration: 3000 });
```

## Changelog

- 2026-09-01 — v1 spec.
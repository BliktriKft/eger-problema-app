# MapMarker (pin)

> Status: v1 spec — used by web (Leaflet) + mobile (react-native-maps). Pin is the most-seen UI element; getting it right matters.

## Purpose

Mark problem locations on the map. Six base shapes for institution types, plus state variants (default, hover, voted, own, moderated, anonymous).

## Anatomy

```
        ┌───┐
        │ ● │   pin head (32×40 with 12px tail)
        └─┬─┘
          ▼     tail point (anchors to lat/lng)
```

The pin SVG is in `design/map/pin-{type}-{state}.svg`. State is rendered by swapping the inner fill and adding optional halo/badge.

## Base types

| Type          | Icon (lucide)              | Inner shape  | Use case                          |
|---------------|----------------------------|--------------|-----------------------------------|
| `default`     | `MapPin` (filled)          | circle       | Generic problem pin               |
| `school`      | `GraduationCap`            | cap silhouette | Iskolákat érintő problémák       |
| `hospital`    | `Cross` (medical)          | + sign       | Kórház / orvosi problémák          |
| `pool`        | `Waves`                    | wave lines   | Uszoda / strand                    |
| `library`     | `BookOpen`                 | book         | Könyvtári bejelentések             |
| `government`  | `Landmark`                 | column       | Önkormányzati problémák            |
| `other`       | `MapPin` (outlined)        | circle       | Minden más                         |

Each type has a color cue. Pins are NOT monochromatic — the type is encoded in color so the map reads at a glance:

| Type          | Pin fill    | Icon color | Border      |
|---------------|-------------|------------|-------------|
| `default`     | `muted-700` | `muted-50` | `muted-900` |
| `school`      | `accent`    | `accent-fg`| `accent-700`|
| `hospital`    | `destructive` | `destructive-fg` | `destructive-700` |
| `pool`        | `secondary-400` | `secondary-fg` | `secondary-700` |
| `library`     | `accent-700` | `accent-50` | `accent-900` |
| `government`  | `secondary` | `secondary-fg` | `secondary-700` |
| `other`       | `muted-500` | `muted-100` | `muted-700` |

## States

| State         | Visual                                              | Trigger                       |
|---------------|-----------------------------------------------------|-------------------------------|
| `default`     | as type                                             | rendered normally              |
| `hover`       | scale 1.15, shadow-lg, ring 2px `ring`              | mouse over (web) / press (mobile) |
| `voted`       | ring 3px `primary`, badge "+1" / "-1" top-right    | user has voted                 |
| `own`         | ring 3px `success`, "saját" badge top-right         | user submitted this pin        |
| `moderated`   | ring 3px `warning`, pulse-ring animation 1200ms loop | pending moderation             |
| `anonymous`   | ring 3px `muted`, eye-off icon overlay             | submitted anonymously           |
| `selected`    | scale 1.25, ring 4px `ring`, shadow-xl              | currently focused (popup open) |
| `disabled`    | opacity-50                                          | outside viewport zoom          |

## Sizing

- Standard pin: 32px wide × 40px tall (12px tail). Tail anchors to lat/lng.
- Cluster bubble: replaces individual pins at high zoom-out; shows count and color encodes aggregate score.
- Mobile: same SVG scaled to 28×36 on small screens to reduce occlusion.

## Props (web — Leaflet wrapper)

```ts
interface MapMarkerProps {
  position: [lat: number, lng: number];
  type: PinType;
  state: PinState;
  score: number;                        // shown as tooltip on hover
  onClick?: () => void;
  zIndexOffset?: number;
}
```

## Props (mobile — react-native-maps `Marker`)

```ts
interface MapMarkerProps {
  coordinate: { latitude: number; longitude: number };
  type: PinType;
  state: PinState;
  score: number;
  onPress?: () => void;
  anchor?: { x: number; y: number };   // default { 0.5, 1.0 }
}
```

## Clustering

When zoom < 14, individual pins cluster into a single circle. Bubble shows count, color encodes:
- `< 5` pins: `muted-500`
- `5-20`: `secondary`
- `> 20`: `primary`
- `> 100`: `destructive` + tooltip "100+ probléma ebben a körzetben"

## Accessibility (mobile especially)

- **`Marker.accessibilityLabel`**: `"Probléma a közelben, ${score} szavazat, ${typeLabel}"`.
- **`accessibilityHint`**: `"Koppints a részletekért"`.
- **Map region announcements**: when the visible region changes (user pans/zooms), announce the new center district (`"Most a Belvárost látod, 12 probléma"`).
- **Reduced motion**: pulse-ring animation respects `prefers-reduced-motion` — show static ring instead.

## Tooltip

On hover (web) or long-press (mobile), show a small floating tooltip:
```
┌──────────────────────────────┐
│ Kátyú a Kossuth utcában      │
│ 42 szavazat • Útépítés       │
│ 2 napja                       │
└──────────────────────────────┘
```

Max 1 line title (truncated), 1 line metadata. Tap → opens detail page.

## Examples

```tsx
// Map page (web)
{pins.map(pin => (
  <MapMarker
    key={pin.id}
    position={[pin.lat, pin.lng]}
    type={pin.institution?.type ?? "default"}
    state={
      pin.submittedByMe ? "own"
      : pin.myVote ? "voted"
      : pin.pendingModeration ? "moderated"
      : pin.isAnonymous ? "anonymous"
      : "default"
    }
    score={pin.score}
    onClick={() => openProblemDetail(pin.id)}
  />
))}
```

## Don'ts

- Don't put text inside the pin head — the SVG gets tiny and unreadable. Use the tooltip.
- Don't animate pins on initial render — only state transitions.
- Don't show score inside the pin — only the type icon. Score goes in the tooltip.

## Changelog

- 2026-09-01 — v1 spec; SVGs in design/map/.
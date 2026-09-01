# VoteButtons

> Status: v1 spec — used by web + mobile. The signature interactive element of the app: lets users upvote/downvote problems.

## Purpose

Surface the score (net upvotes) of a problem and let the user change their vote. Most-used component after buttons.

## Anatomy (web, expanded)

```
┌───────┐
│  ▲    │   up button (40×40 icon button, rounded-full)
│  42   │   score (semibold, text-lg)
│  ▼    │   down button (40×40 icon button, rounded-full)
└───────┘
```

When the user has already upvred:
- ▲ filled in `primary`, score color `primary`
- ▼ outline, `muted-foreground`

When downvoted:
- ▲ outline
- score color `destructive`
- ▼ filled in `destructive`

When neutral (no vote):
- both outline, score `muted-foreground`

## Variants

| Variant   | Shape           | Use case                                    |
|-----------|-----------------|---------------------------------------------|
| `expanded`| ▲ score ▼ stacked vertically, 40px wide | Problem detail page, full rows               |
| `compact` | [▲ 42 ▼] inline, 32px tall              | List rows in tables, sidebar widgets        |
| `icon`    | single ▲ with score as overlay on map    | Map pins (rare — pin color encodes score)   |
| `inline`  | [+1] button only, score appears on hover | Comment thread — light upvote, no downvote  |

## Sizes

`sm` 32px height, `md` 40px (default), `lg` 48px.

## States

| State          | Visual                                        | Animation                              |
|----------------|-----------------------------------------------|----------------------------------------|
| neutral        | outlined ▲▼, score `muted-foreground`         | —                                      |
| upvoted        | filled ▲ in `primary`, score `primary`         | bump on click: `vote-bump` 250ms       |
| downvoted      | filled ▼ in `destructive`, score `destructive`| bump on click: `vote-bump` 250ms       |
| hover (button) | shade -100                                    | 150ms ease-out                         |
| disabled       | opacity-50, no pointer                        | — (e.g. anonymous user, prompt login)  |
| loading        | spinner replaces icon, score stays            | shimmer 1500ms                         |

## Props (web)

```ts
interface VoteButtonsProps {
  score: number;
  state: "neutral" | "upvoted" | "downvoted";
  onUpvote: () => void | Promise<void>;
  onDownvote: () => void | Promise<void>;
  variant?: "expanded" | "compact" | "icon" | "inline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";  // default vertical
  showScore?: boolean;                       // default true
  labels?: {
    upvote?: string;
    downvote?: string;
  };
}
```

## Props (mobile)

```ts
interface VoteButtonsProps {
  score: number;
  state: VoteState;
  onUpvote: () => void;
  onDownvote: () => void;
  variant?: VoteVariant;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  orientation?: "vertical" | "horizontal";
  accessibilityLabel?: string;        // e.g. "Upvote — 42 szavazat"
  testID?: string;
}
```

## Animation specs

The `vote-bump` animation is in `motion.json` → `keyframes.vote-bump` and in `tailwind.config.ts` → `animation.vote-bump` (250ms, ease-out-back).

```
0%, 100%: scale(1)
50%:      scale(1.18)
```

The score number tweens between values when it changes (250ms, ease-out). Use `useSpring` on mobile (Reanimated), CSS transition on web.

## Accessibility

- **Buttons**: each arrow is a separate `<button>` (or `Pressable`), not a single button with two actions.
- **Aria labels**: `aria-label="Upvote"` and `aria-label="Downvote"`. On mobile: `accessibilityLabel` plus `accessibilityHint` describing the score.
- **Pressed state**: `aria-pressed="true"` on the active arrow, `false` on the other.
- **Score**: announced as part of the button's label, e.g. `aria-label="Upvote, jelenlegi pontszám 42"`. Don't put a separate live region for the score.
- **Keyboard**: Space/Enter activates. Tab moves between ▲ and ▼.
- **Disabled**: never disable silently — if anonymous, show a tooltip "Jelentkezz be a szavazáshoz".
- **Touch target**: 44×44 minimum; `hitSlop: { top: 8, bottom: 8, left: 8, right: 8 }` on mobile.

## Network behavior

- Optimistic update: change visual state immediately, fire API call in background, rollback on error.
- On 401 (anonymous): show login dialog, do NOT rollback the visual — wait until login completes then re-fire the vote.
- On 429 (rate-limited): rollback + show inline error, debounce re-attempts.

## Examples

```tsx
// Problem detail
<VoteButtons
  score={problem.score}
  state={userVoteState(problem.id)}
  onUpvote={() => castVote(problem.id, +1)}
  onDownvote={() => castVote(problem.id, -1)}
  variant="expanded"
  size="lg"
/>

// List row
<Card variant="default" padding="md">
  <div className="flex gap-4 items-center">
    <VoteButtons
      score={problem.score}
      state={userVoteState(problem.id)}
      onUpvote={() => castVote(problem.id, +1)}
      onDownvote={() => castVote(problem.id, -1)}
      variant="compact"
    />
    <div>
      <h3>{problem.title}</h3>
      <p>{problem.institution.name}</p>
    </div>
  </div>
</Card>
```

## Don'ts

- Don't use a single button with toggle behavior — separate buttons are keyboard-friendly and screen-reader-clear.
- Don't disable both buttons at once — let the user at least see their state.
- Don't change the score color to red on a downvote in `compact` variant — too noisy in a list.

## Changelog

- 2026-09-01 — v1 spec.
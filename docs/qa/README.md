# QA — Eger Város Probléma Térkép

This is the QA team's home in the repo. We own:

- **Playwright E2E tests** for the Next.js web app (`apps/web/e2e/`)
- **Detox E2E setup** for the Expo mobile app (`apps/mobile/e2e/`)
- **axe-core accessibility audits** for every screen (Hungarian-first copy)
- **The dogfood checklist** that runs before each release

The QA infrastructure is laid down in commit `qa: Playwright E2E suite +
Detox mobile setup + a11y audit (Task Q1)`.

## Running the web E2E suite locally

```bash
# From the repo root.
pnpm install
pnpm --filter @eger/web exec playwright install --with-deps chromium firefox webkit
pnpm --filter @eger/web test:e2e
```

The dev server picks up env from `apps/web/.env.local` (gitignored). A
template file documenting the expected keys lives at
`apps/web/.env.example` — copy it and fill in placeholder values for QA
runs so the configured UI renders:

```bash
cp apps/web/.env.example apps/web/.env.local
sed -i 's|NEXT_PUBLIC_SUPABASE_URL=$|NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co|' apps/web/.env.local
sed -i 's|NEXT_PUBLIC_SUPABASE_ANON_KEY=$|NEXT_PUBLIC_SUPABASE_ANON_KEY=qa-placeholder|' apps/web/.env.local
```

The `NEXT_PUBLIC_API_BASE_URL` line stays empty so React Query hooks
fall through to `MOCK_PROBLEMS` in `lib/mock-problems.ts`. The QA suite
never needs the NestJS backend running.

### Granular runs

| Script                          | What it does                                                  |
|---------------------------------|---------------------------------------------------------------|
| `pnpm --filter @eger/web test:e2e`            | Full multi-browser suite (chromium + firefox + webkit + Pixel 5 + iPhone 13) |
| `pnpm --filter @eger/web test:e2e:a11y`        | Just `a11y.spec.ts` — the axe-core + design-audit assertions |
| `pnpm --filter @eger/web test:e2e:visual`      | Just `visual-regression.spec.ts` — captures golden shots     |
| `pnpm --filter @eger/web test:e2e:headed`      | Same as default but with a browser UI                        |
| `pnpm --filter @eger/web test:e2e:debug`       | Playwright Inspector; iterate on a single spec               |

### How the suite is shaped

- Five Playwright `projects`: chromium / firefox / webkit / Pixel 5 / iPhone 13.
  Each spec runs in all five — that's why a 7-spec file produces ~35
  test instances.
- Trace + screenshot + video artifacts land in `apps/web/test-results/`.
- HTML report at `apps/web/playwright-report/`. CI uploads both.

## Writing a new E2E test (POM pattern)

Every screen gets a Page Object in `apps/web/e2e/pages/<Name>Page.ts`.
The POM owns:

- The Playwright `Locator`s built from `data-testid` hooks in the
  implementation.
- A `goto()` method that navigates and waits for a reliable anchor to
  appear.
- A handful of action verbs (e.g. `signInWithCredentials(email, pw)`,
  `upvote()`).

Specs go in `apps/web/e2e/<feature>.spec.ts` and read like a script:

```ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';

test('login flow surfaces an error on bad credentials', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.signInWithCredentials('nope@example.com', 'wrong');
  await expect(page.getByRole('status')).toBeVisible();
});
```

### Rules

1. **No raw selectors in spec bodies.** Reach for `page.getByTestId`,
   `page.getByRole`, or a method on the POM. The POM owns the testid
   strings so a rename in the implementation only touches one file.
2. **Self-contained.** Each spec assumes the app is in the "mock"
   state — no Supabase session, no real API calls. Tests that need a
   real Supabase test project land in Task Q2.
3. **Hook IDs over text.** Where the copy is Hungarian and could
   change, prefer `data-testid` or `aria-label`. Reserve body-text
   matches for surface checks (e.g. "the heading says Bejelentkezés").
4. **No flaky tests in main.** If a test is intermittent, mark it
   `test.fixme()` and file an issue. Don't `expect.toPass(...)` it
   silently.

### Adding the testid to a component

If you're shipping the component AND its test, add the `data-testid`
inline:

```tsx
<button data-testid="submit-cta" type="submit" onClick={...}>…</button>
```

If a designer / another engineer ships the component, file a PR asking
for the testid to be added in the same change. Never rely on CSS class
names — they're regenerable by Tailwind.

## Detox setup (mobile)

The Detox configuration lives at `apps/mobile/e2e/`. From a developer
machine:

```bash
# macOS — iOS sim
xcrun simctl boot 'iPhone 13' || true
pnpm --filter @eger/mobile e2e:build:ios
pnpm --filter @eger/mobile e2e:ios

# Linux + KVM / macOS — Android emulator
emulator -avd Pixel_5_API_34 &
adb wait-for-device
pnpm --filter @eger/mobile e2e:build:android
pnpm --filter @eger/mobile e2e:android
```

> The CI sandbox cannot drive Detox today. Task Q2 wires a macOS
> self-hosted runner for iOS and a Linux KVM runner for Android. The
> `qa.yml` workflow is ready to consume these runners when they come
> online — see the "Detox CI jobs" comment block.

## Accessibility checklist (release gating)

Run once before tagging a release. Each item is also a Playwright
assertion in `apps/web/e2e/a11y.spec.ts` — green CI is the surrogate
for "ran the checklist", but a manual review is still required when
the design tokens change.

**Token-level (designer audit — `design/accessibility-audit.md`):**

- [ ] `success` is never used as body-text background — always
      `success-700` on white.
- [ ] `warning` is never used as body-text background — always
      `warning-700` on `warning-50`.
- [ ] `primary-400` background only ships on dark-mode primary buttons
      where the label is ≥14pt bold.
- [ ] `accent-fg` on `accent` is documented as AA (not AAA) in
      component specs.

**Screen-level (run axe-core via `pnpm --filter @eger/web test:e2e:a11y`):**

- [ ] Zero **blocker** / **critical** axe violations on `/map`,
      `/problems`, `/problems/[id]`, `/login`, `/register`, `/submit`.
- [ ] Every interactive control has a visible focus ring (don't strip
      `outline` without a `box-shadow` replacement).
- [ ] Form errors carry a `role="alert"` (or `aria-describedby`)
      relationship back to their input.
- [ ] Vote buttons stay distinguishable without colour — the icon
      arrows + the `aria-label` carry the meaning.
- [ ] Linked text (Regisztráció / Bejelentkezés) is distinguishable
      from surrounding text without relying on colour (underline OR
      weight difference).

**Manual keyboard nav (still required):**

- [ ] Tab through `/map` → reach every pin / button in a logical order.
- [ ] Tab through `/problems/[id]` → the comment form (V2) is
      reachable, vote buttons are reachable in their own group.
- [ ] On `/login`, the OAuth group takes exactly one Tab stop per
      provider (not three) — verify the focus order is Google →
      Apple → Meta.

**Output of the audit run ends up in `apps/web/test-results/` (CI) or
`apps/web/playwright-report/` (local). The report HTML is human-
friendly: open it in a browser to walk through any failures.**

## Bug report template

Use this when filing a bug from dogfood, manual testing, or a failed
spec. File it as a GitHub issue with the `bug` label.

```markdown
### Steps to reproduce
1. …
2. …

### Expected
…

### Actual
…

### Console log / network panel
\`\`\`
<paste from DevTools>
\`\`\`

### Screenshot / video / trace
<paste link to apps/web/test-results/<spec>/test-failed-1.png or the
Playwright trace zip>

### Environment
- Browser: chromium 123.4 / firefox 124.0 / webkit 17.4 / Pixel 5 /
  iPhone 13
- OS: …
- Build: commit <SHA>, branch <branch>
- App mode: mock / real-Supabase / real-API
```

The "Environment" block is the easiest to fill in if your test failure
artefact already includes the Playwright report — that's why we upload
the HTML report to CI as an artifact on every run.

## CI workflow

QA runs on every PR via `.github/workflows/qa.yml`. Two jobs today:

- `playwright-e2e` — full multi-browser suite.
- `playwright-a11y` — just the a11y spec; depends on `playwright-e2e`
  so we get a fast PR-status signal first.

Detox jobs (iOS sim + Android emu) are added in Task Q2 when the runner
infra is in place; the workflows block has a placeholder comment
explaining the dependency.

## Dogfood — release checklist

Run by hand before tagging a release:

- [ ] Register with email → confirmation email → confirm
- [ ] Login with Google → land on /map → see existing problems
- [ ] Submit a problem → see it appear on the map in real time
- [ ] Upvote → score increments → reload → persists
- [ ] Anon submit on an institution → backend has user_id = null
- [ ] Visit a problem with wiki entry → sources are real, clickable URLs
- [ ] Map cluster test: submit 10 in one place → clusters show
- [ ] Mobile: take photo → submit → see it appear
- [ ] Mobile: kill app → reopen → still logged in (token refresh)
- [ ] Throttle test: submit 200 problems in 1 minute → 429 after limit
- [ ] Accessibility: navigate the whole app with keyboard only → all
      interactive elements reachable

If anything fails, file a `bug` issue, do not fix it yourself — the
responsible engineer picks it up.

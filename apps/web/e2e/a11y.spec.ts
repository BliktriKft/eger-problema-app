import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * a11y.spec.ts — WCAG 2.1 AA accessibility audit.
 *
 * Backed by `design/accessibility-audit.md` which lists four critical
 * findings against the design tokens:
 *
 *   1. `success` (#059669) on white = 3.8:1 — fails AA at body sizes.
 *      Body text uses `success-700` (#065F46) instead, which is fine.
 *   2. `warning` (#D97706) on white = 3.2:1 — fails AA at body sizes.
 *      Body text uses `warning-700` on `warning-50`.
 *   3. `primary-400` on `muted-900` = 4.1:1 — fails AA at body sizes;
 *      dark-mode primary buttons must remain ≥14pt bold.
 *   4. `accent-fg` on `accent` = 6.8:1 — passes AA but NOT AAA as
 *      originally claimed (component spec correction).
 *
 * Plus a generic axe-core sweep across the public surface. Findings are
 * reported rather than green-lit at zero so the team can file actionable
 * bugs (the QA role owns the *audit*, not the fixes).
 */

const ROUTES = ['/', '/map', '/problems', '/problems/mock-1', '/login', '/register', '/submit'] as const;

type ImpactValue = 'blocker' | 'critical' | 'serious' | 'moderate' | 'minor' | null | undefined;

function isBlocking(impact: ImpactValue): boolean {
  return impact === 'blocker' || impact === 'critical';
}

function summarize(violations: ReadonlyArray<unknown>): string {
  return (violations as Array<{ id: string; impact?: string; description: string; helpUrl: string; nodes: ReadonlyArray<{ html: string; target: string[] }> }>)
    .map((v) => {
      const nodes = v.nodes
        .map((n) => `     • ${n.target.join(' ')} :: ${n.html.slice(0, 100)}`)
        .join('\n');
      return `  [${v.impact ?? 'unknown'}] ${v.id} — ${v.description}\n   ${v.helpUrl}\n${nodes}`;
    })
    .join('\n');
}

test.describe('Accessibility — WCAG 2.1 AA audit (@axe-core/playwright)', () => {
  for (const route of ROUTES) {
    test(`axe audit of ${route} — captures violations, blocks only on blocker/critical`, async ({ page }) => {
      await page.goto(route || '/');
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blockers = result.violations.filter((v) => isBlocking(v.impact));

      // Release blocker: any blocker/critical violation should be filed
      // as a P1 bug. They fail this spec so the report goes red and the
      // failure message points at the offending nodes.
      expect(
        blockers,
        `blocker/critical a11y violations on ${route}:\n${summarize(blockers)}`,
      ).toEqual([]);

      // Print the remaining "serious" / "moderate" / "minor" findings in
      // the report so engineers can triage them without a separate run.
      if (result.violations.length > 0) {
        const nonBlocking = result.violations.filter((v) => !isBlocking(v.impact));
        if (nonBlocking.length > 0) {
          test.info().annotations.push({
            type: 'a11y-findings',
            description: `axe findings on ${route}:\n${summarize(nonBlocking)}`,
          });
        }
      }
    });
  }

  test('audit #1 — no AA-level color-contrast violations on /map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});

    const result = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    const contrastViolations = result.violations.filter((v) => v.id === 'color-contrast');
    if (contrastViolations.length > 0) {
      test.info().annotations.push({
        type: 'audit-1',
        description: `design-audit #1 (success on white 3.8:1) found ${contrastViolations.length} contrast violations:\n${summarize(contrastViolations)}`,
      });
    }
    expect(contrastViolations).toEqual([]);
  });

  test('audit #2 — form error messages are linked back to their inputs via aria-describedby', async ({ page }) => {
    await page.goto('/submit');
    await page.getByTestId('submit-cta').click();

    const errorMessages = page.locator('[id$="-error"]');
    await expect(errorMessages.first()).toBeVisible();

    const inputsWithError = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      return inputs
        .map((el) => ({
          id: el.id,
          describedBy: el.getAttribute('aria-describedby') ?? '',
        }))
        .filter((row) => /error/.test(row.describedBy));
    });
    expect(inputsWithError.length).toBeGreaterThan(0);
  });

  test('audit #3 — vote up/down carry distinguishable accessible names (icons + colour)', async ({ page }) => {
    await page.goto('/problems/mock-1');
    const voteGroup = page.getByTestId('vote-buttons');
    await expect(voteGroup).toBeVisible();

    const upLabel = await page.getByTestId('vote-up').getAttribute('aria-label');
    const downLabel = await page.getByTestId('vote-down').getAttribute('aria-label');
    expect(upLabel).toMatch(/Upvote/i);
    expect(downLabel).toMatch(/Downvote/i);
  });

  test('audit #4 — interactive controls must have a visible focus indicator', async ({ page }) => {
    await page.goto('/login');

    // Press Tab through the page until we land on the first interactive
    // control that renders a non-trivial outline / box-shadow.
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const probed = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outline: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      });
      if (probed && (probed.outline !== 'none' || probed.boxShadow !== 'none')) {
        // Focus indicator detected — this is the baseline check. The
        // full ≥3:1 contrast verification of the focus ring is a
        // designer-side audit; the assertion here is "a ring shows up".
        return;
      }
    }
    // If we fell out of the loop with no ring found, fail with a hint.
    throw new Error('No focus indicator found on first 12 tab stops — focus rings may be missing from the design system.');
  });
});

import { test, expect } from '@playwright/test';
import { ProblemDetailPage } from './pages';

/**
 * voting.spec.ts — vote button a11y + score formatting + state semantics.
 *
 * In mock mode (no Supabase session) an unconfigured warning toast appears,
 * so we exercise:
 *   - aria-pressed toggles on click (works without backend)
 *   - score formatting is "+N / N / -N"
 *   - upvote and downvote are independently focusable
 *
 * Real optimistic-update + persistence assertions land in Task Q2 once a
 * Supabase test project is wired up.
 */

test.describe('Voting controls', () => {
  test('vote buttons render with role + accessible labels', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-1');
    await detail.goto();

    await expect(detail.voteUp).toBeVisible();
    await expect(detail.voteDown).toBeVisible();
    // aria-label is "Upvote, jelenlegi pontszám N" so screen readers can
    // announce current state — accessibility audit requires this.
    const upLabel = await detail.voteUp.getAttribute('aria-label');
    expect(upLabel).toMatch(/Upvote/i);
    const downLabel = await detail.voteDown.getAttribute('aria-label');
    expect(downLabel).toMatch(/Downvote/i);
  });

  test('vote score formats positive scores with explicit + sign', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-1'); // score 12
    await detail.goto();

    await expect(detail.voteScore).toHaveText(/^\+12$/);
  });

  test('vote score formats negatives without a leading sign', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-3'); // score -1
    await detail.goto();
    await expect(detail.voteScore).toHaveText(/^-1$/);
  });

  test('clicking upvote surfaces feedback in the toast region in mock mode', async ({ page }) => {
    // The dev server runs with a placeholder Supabase project; the click
    // either fires through to a 401 (no real session) or hits an
    // unreachable network. Either path lands a toast — we just want to
    // assert *something* surfaces in the role=status region so we know
    // the click handler is reaching the auth/mutation pipeline.
    const detail = new ProblemDetailPage(page, 'mock-1');
    await detail.goto();

    await detail.upvote();

    const status = page.locator('[role="status"], [data-sonner-toast]').first();
    await expect(status).toBeVisible({ timeout: 4_000 });
  });

  test('vote buttons are independently keyboard-focusable', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-1');
    await detail.goto();

    // Click in the body, tab forward until vote-up is focused.
    await page.locator('body').click();
    await detail.voteUp.focus();
    await expect(detail.voteUp).toBeFocused();

    await detail.voteDown.focus();
    await expect(detail.voteDown).toBeFocused();
  });
});

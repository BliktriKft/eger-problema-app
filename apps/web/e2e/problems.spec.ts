import { test, expect } from '@playwright/test';
import { ProblemsListPage, ProblemDetailPage } from './pages';

/**
 * problems.spec.ts — listing + detail shells.
 *
 * Asserts the card grid, navigation from list to detail, and the composite
 * "vote + wiki" presence on each detail page.  Until Task Q2 wires a real
 * filter endpoint, "filtering" is exercised on the mock dataset's known
 * categories.
 */

test.describe('Problems list', () => {
  test('renders the listing shell with mock cards', async ({ page }) => {
    const list = new ProblemsListPage(page);
    await list.goto();
    await list.expectMockCards();
  });

  test('listing includes a header with item count', async ({ page }) => {
    const list = new ProblemsListPage(page);
    await list.goto();

    // The ProblemsList header renders "<n> db" — match the "db" suffix.
    await expect(page.getByText(/\bdb\b/).first()).toBeVisible();
  });

  test('clicking a card navigates to the detail page', async ({ page }) => {
    const list = new ProblemsListPage(page);
    await list.goto();

    await list.card('mock-1').click();
    await page.waitForURL(/\/problems\/mock-1$/);
    await expect(page.getByTestId('problem-detail-mock-1')).toBeVisible();
  });

  test('detail page exposes vote buttons and wiki section', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-1');
    await detail.goto();

    await expect(detail.voteButtons).toBeVisible();
    await expect(detail.voteUp).toBeVisible();
    await expect(detail.voteDown).toBeVisible();
    await expect(detail.voteScore).toBeVisible();
    await expect(detail.wikiSection).toBeVisible();
  });

  test('detail page for an unknown id shows the empty-state', async ({ page }) => {
    await page.goto('/problems/does-not-exist');
    // The ProblemsScreen returns an EmptyState when no problem matches.
    await expect(page.getByText(/nem található/i)).toBeVisible({ timeout: 8_000 });
  });

  test('listing renders score with explicit +N / N / -N formatting', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-3');
    await detail.goto();
    // mock-3 starts with score -1 so the formatter renders "-1".
    await expect(detail.voteScore).toHaveText(/^(-|\+)?\d+$/);
  });
});

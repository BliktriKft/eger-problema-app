import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /problems — the listing. Cards are rendered with a per-card test-id so
 * spec bodies can assert on the demo pins individually. We accept either
 * "cards rendered", "skeleton shimmer", or "empty state" depending on
 * which path the UI took.
 */
export class ProblemsListPage extends BasePage {
  readonly shell: Locator;

  constructor(page: Page) {
    super(page);
    this.shell = this.byTestId('problems-list');
  }

  async goto(): Promise<void> {
    await this.page.goto('/problems');
    await expect(this.shell).toBeVisible();
  }

  /** Card for a specific problem id (the mock dataset uses mock-1..mock-7). */
  card(id: string): Locator {
    return this.byTestId(`problem-card-${id}`);
  }

  async expectMockCards(): Promise<void> {
    // All seven MOCK_PROBLEMS should be rendered as cards in mock mode.
    await expect(this.card('mock-1')).toBeVisible();
    await expect(this.card('mock-2')).toBeVisible();
    await expect(this.card('mock-7')).toBeVisible();
  }
}

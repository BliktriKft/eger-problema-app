import type { Page, Locator } from '@playwright/test';

/**
 * Shared behaviour every screen Page exposes.
 *
 * Sub-classes wrap a Page and define goto() so callers do not need to
 * know the absolute URL — they just write await mapPage.goto().
 *
 * Selectors are tied to the data-testid hooks in
 * apps/web/components and apps/web/app. If a component gets renamed or
 * its test-id changed, the failure should point at the SPEC, not at the
 * implementation, so we co-locate the test-id constants on each page
 * class.
 */
export abstract class BasePage {
  /** Subclass must pass the Playwright page it wraps. */
  constructor(protected readonly page: Page) {}

  abstract goto(): Promise<void>;

  /**
   * Wait until the network has been quiet for ~250ms. Useful before
   * taking visual-regression shots so Leaflet tile fetches settle.
   */
  async waitForIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  }

  /** Build a locator for a data-testid — never reach for raw selectors
   *  inside spec bodies; go through this helper. */
  byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** True when the body text contains the regex (case-insensitive). */
  async bodyContains(pattern: RegExp): Promise<boolean> {
    const txt = await this.page.locator('body').textContent();
    return Boolean(txt && pattern.test(txt));
  }
}

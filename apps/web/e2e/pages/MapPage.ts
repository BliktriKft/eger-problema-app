import { expect, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the public map at /map.
 *
 * Exposes the markers that the Leaflet shell renders (class `eger-pin`)
 * alongside the test-id-anchored shell/container/screen. Demo pins come
 * from MOCK_PROBLEMS (always 7 entries) until the NestJS /api/problems/nearby
 * endpoint replaces them in Task Q2.
 */
export class MapPage extends BasePage {
  readonly shell: Locator;
  readonly screen: Locator;
  readonly loading: Locator;
  readonly signInButton: Locator;
  readonly submitFab: Locator;

  constructor(page: import('@playwright/test').Page) {
    super(page);
    this.shell = this.byTestId('map-shell');
    this.screen = this.byTestId('map-screen');
    this.loading = this.byTestId('map-loading');
    this.signInButton = this.byTestId('sign-in');
    this.submitFab = this.byTestId('submit-fab');
  }

  /** Navigate to /map and wait until the Leaflet shell is mounted. */
  async goto(): Promise<void> {
    await this.page.goto('/map');
    await expect(this.shell).toBeVisible();
  }

  /** The number of `eger-pin` Leaflet markers currently on the map. */
  async markerCount(): Promise<number> {
    return this.page.locator('.eger-pin').count();
  }

  async expectMockMarkerCount(): Promise<void> {
    // MOCK_PROBLEMS ships exactly 7 pins — this is the contract we lean on
    // until Task Q2 supplies a real /api/problems/nearby.
    await expect(this.page.locator('.eger-pin')).toHaveCount(7, { timeout: 15_000 });
  }

  async expectSignInPromptVisible(): Promise<void> {
    await expect(this.signInButton).toBeVisible();
  }
}

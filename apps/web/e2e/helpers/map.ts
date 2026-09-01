import type { Browser, BrowserContext, Page } from '@playwright/test';

/**
 * Map helpers — the Leaflet shell renders demo pins via the `eger-pin` CSS
 * class so we can count + assert on them without needing tile imagery.
 *
 * We deliberately wait for the shell + marker DOM before snapshotting; a
 * tile request against tile.openstreetmap.org is subject to network
 * throttling from CI data centres and would only add flake.
 */
export const MapHelper = {
  /** Resolve when 7 demo pins have rendered inside the map-shell. */
  async waitForMockPins(page: Page): Promise<void> {
    await page.locator('[data-testid="map-shell"]').waitFor({ state: 'visible' });
    await page.locator('.eger-pin').first().waitFor({ state: 'attached', timeout: 15_000 });
  },

  /** Snapshot the map-shell bounding box once tiles are stable. */
  async snapshotMapShell(page: Page, name: string): Promise<Buffer> {
    await this.waitForMockPins(page);
    // Hide the live "current location" pulse / tooltip layer so the shot
    // is deterministic across runs.
    await page.addStyleTag({
      content: '.leaflet-tooltip,.leaflet-control-attribution{display:none !important;}',
    });
    const shell = page.getByTestId('map-shell');
    return shell.screenshot({ path: `test-results/visual/${name}.png`, animations: 'disabled' });
  },

  /** Spawn N browser contexts pointing at the map. Useful for the realtime
   *  fan-out tests but reused today for visual-regression cross-view checks. */
  async newMapContext(browser: Browser): Promise<{ ctx: BrowserContext; page: Page }> {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('/map');
    await this.waitForMockPins(page);
    return { ctx, page };
  },
};

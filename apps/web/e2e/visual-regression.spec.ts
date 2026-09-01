import { test, expect } from '@playwright/test';
import { MapPage, ProblemsListPage, ProblemDetailPage, LoginPage } from './pages';

/**
 * visual-regression.spec.ts — golden-shot scaffolding.
 *
 * We snapshot the static, deterministic parts of each surface (map shell,
 * problem list, problem detail, login card) and store them under
 * `test-results/visual/`. The PNGs ship as artifacts on CI; a future
 * `qa:visual-regression` script will compare against a baseline tracked
 * in the repo. Right now this spec just asserts the snapshot was captured
 * and is non-empty — a full pixel-diff workflow is V2 work (Task Q2.5).
 *
 * The reason we don't run pixel matching today:
 *   - tile.openstreetmap.org imagery changes over time
 *   - Hungarian fonts inside Linux CI runners differ from macOS dev
 *   - the design tokens are still being iterated through D2
 * Treat this spec as "we *can* capture, and the capture pipeline works
 * end-to-end" — pixel-level assertions arrive once the design freezes.
 */

test.describe('Visual regression — golden-shot scaffolding', () => {
  test('map shell renders and snapshot is captured', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();
    await page.locator('.eger-pin').first().waitFor({ state: 'attached', timeout: 15_000 });

    // Hide the OSM attribution + any live tooltips for a stable shot.
    await page.addStyleTag({
      content: '.leaflet-control-attribution,.leaflet-tooltip{display:none !important;}',
    });

    const shell = page.getByTestId('map-shell');
    const png = await shell.screenshot({ animations: 'disabled', path: 'test-results/visual/map-shell.png' });
    expect(png.length).toBeGreaterThan(0);
  });

  test('problem list renders cards and snapshot is captured', async ({ page }) => {
    const list = new ProblemsListPage(page);
    await list.goto();
    await list.expectMockCards();

    const png = await list.shell.screenshot({ animations: 'disabled', path: 'test-results/visual/problems-list.png' });
    expect(png.length).toBeGreaterThan(0);
  });

  test('problem detail renders and snapshot is captured', async ({ page }) => {
    const detail = new ProblemDetailPage(page, 'mock-1');
    await detail.goto();

    const shell = page.getByTestId('problem-detail-mock-1');
    const png = await shell.screenshot({ animations: 'disabled', path: 'test-results/visual/problem-detail.png' });
    expect(png.length).toBeGreaterThan(0);
  });

  test('login page renders and snapshot is captured', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    // We screenshot the form region rather than the whole page so the
    // background gradient under the card stays consistent.
    const card = page.locator('.mx-auto.flex.max-w-md').first();
    const png = await card.screenshot({ animations: 'disabled', path: 'test-results/visual/login-card.png' });
    expect(png.length).toBeGreaterThan(0);
  });
});

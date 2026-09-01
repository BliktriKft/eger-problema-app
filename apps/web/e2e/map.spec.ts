import { test, expect } from '@playwright/test';
import { MapPage } from './pages';
import { MapHelper } from './helpers';

/**
 * map.spec.ts — Leaflet shell + OpenStreetMap tile layer + demo pins.
 *
 * We pin the demo dataset contract (7 markers from MOCK_PROBLEMS) so the
 * spec doubles as a regression guard against accidental dataset shrink.
 *
 * NOTE: real tile loading against tile.openstreetmap.org is intentionally
 * NOT awaited here — CI data centres can throttle and we already have a
 * deterministic DOM anchor (`.eger-pin`) for what we want to test.
 */

test.describe('Map shell', () => {
  test('/map renders the Leaflet shell with all 7 demo pins', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();
    await map.waitForIdle();
    await map.expectMockMarkerCount();
  });

  test('map shell anchors to a sized container — no collapsed layout', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();

    const shell = map.shell;
    await expect(shell).toBeVisible();
    const bbox = await shell.boundingBox();
    expect(bbox?.width ?? 0).toBeGreaterThan(200);
    expect(bbox?.height ?? 0).toBeGreaterThan(200);
  });

  test('top-nav submit CTA is visible on the map surface', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();
    await expect(map.submitFab).toBeVisible();
  });

  test('signed-out visitors see the Bejelentkezés CTA on the map', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();
    await map.expectSignInPromptVisible();
  });

  test('Marker count surfaced in the dataset is reflected in DOM', async ({ page }) => {
    const map = new MapPage(page);
    await map.goto();
    await MapHelper.waitForMockPins(page);

    const count = await map.markerCount();
    expect(count).toBe(7);
  });
});

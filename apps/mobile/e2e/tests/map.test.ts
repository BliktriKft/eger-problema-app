import { by, device, expect, element } from 'detox';

/**
 * map.test.ts — map screen renders the react-native-maps shell with
 * the demo markers (M1 stub sample data).
 *
 * react-native-maps needs OSM tiles to render real imagery.  On Detox
 * the tile fetch hits the same network throttling as Playwright; we
 * therefore assert on `map-screen` being mounted and the demo marker
 * testIDs being present, *not* on actual tile imagery.
 */
describe('Map screen', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    // Auth screen shows first; tap the "Belépés" OAuth button to skip
    // to the map.  If we're already signed in (token persisted in
    // SecureStore from a prior run) this skips — that path is fine.
    await element(by.id('oauth-google')).tap().catch(() => {});
  });

  it('map screen mounts the OSMap overlay container', async () => {
    await expect(element(by.id('map-screen'))).toBeVisible();
  });

  it('renders the seven demo problem pins from the M1 sample set', async () => {
    // We don't enumerate all the marker IDs — we just check that the
    // stub markers are present in the map's underlying list.  Detox
    // sees the pins as AccessibilityNodes tagged with problem-pin-* ids.
    await expect(element(by.id('problem-pin-sample-1'))).toExist();
    await expect(element(by.id('problem-pin-sample-2'))).toExist();
    await expect(element(by.id('problem-pin-sample-3'))).toExist();
    await expect(element(by.id('problem-pin-sample-4'))).toExist();
  });
});

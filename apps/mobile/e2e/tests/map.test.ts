import { by, device, expect, element } from 'detox';

/**
 * map.test.ts — map screen renders the react-native-maps shell with
 * markers sourced from `useNearbyProblems`.  We assert on the
 * `map-screen` being mounted and on the first few mock-mode markers
 * existing in the accessibility tree (Detox can't introspect actual
 * tile imagery on the simulator).
 *
 * Real-API runs would render whatever the backend returns; the testIDs
 * we assert on are still stable because the `MapScreen` component
 * composes `<Marker testID={\`problem-pin-\${p.id}\`}>` for every
 * ProblemMarker it receives.
 */
describe('Map screen', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await element(by.id('oauth-google')).tap().catch(() => {});
  });

  it('map screen mounts the OSMap overlay container', async () => {
    await expect(element(by.id('map-screen'))).toBeVisible();
  });

  it('renders the mock-fallback problem pins when USE_MOCK is on', async () => {
    // The first three mock entries should always be present in mock mode.
    await expect(element(by.id('problem-pin-mock-1'))).toExist();
    await expect(element(by.id('problem-pin-mock-2'))).toExist();
    await expect(element(by.id('problem-pin-mock-3'))).toExist();
  });

  it('tapping a marker navigates to the problem detail page', async () => {
    await element(by.id('problem-pin-mock-3')).tap();
    await expect(element(by.id('problem-title'))).toBeVisible();
    await device.pressBack();
  });
});

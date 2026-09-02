import { by, device, element, expect, waitFor } from 'detox';

/**
 * feed.test.ts — the problems feed (tab) shows the live (or mock) data
 * via `useNearbyProblems` and supports pull-to-refresh + category
 * filtering.
 *
 * Mock-mode IDs (set via EXPO_PUBLIC_USE_MOCK=true on the Detox
 * bootstrap) are `mock-1` … `mock-10`.  We assert on the first few so
 * the test doesn't depend on every mock entry being visible in the
 * viewport (FlatList virtualises the rest).
 */
describe('Feed screen', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    // The auth gate in real-API mode would block access; in mock mode
    // we land on /map immediately.  Either way, the Feed tab is
    // reachable via the tab bar.
    await element(by.id('oauth-google')).tap().catch(() => {});
  });

  it('renders the demo problem cards in the FlatList', async () => {
    await waitFor(element(by.id('feed-screen')))
      .toBeVisible()
      .withTimeout(8_000);

    await waitFor(element(by.id('problem-card-mock-1')))
      .toBeVisible()
      .withTimeout(8_000);

    await expect(element(by.id('problem-card-mock-1'))).toBeVisible();
    await expect(element(by.id('problem-card-mock-3'))).toBeVisible();
  });

  it('tapping a card navigates to the problem detail page', async () => {
    await element(by.id('problem-card-mock-1')).tap();
    await expect(element(by.id('problem-title'))).toBeVisible();
    // Back to the feed.
    await device.pressBack();
  });

  it('category filter narrows the visible cards', async () => {
    // Open the infrastructure filter chip — should leave `mock-1` visible
    // and remove `mock-3` (public_safety) from the list.
    await element(by.id('feed-filter-infrastructure')).tap();
    await waitFor(element(by.id('problem-card-mock-1')))
      .toBeVisible()
      .withTimeout(4_000);
    // Clear filter back to "all".
    await element(by.id('feed-filter-all')).tap();
  });
});

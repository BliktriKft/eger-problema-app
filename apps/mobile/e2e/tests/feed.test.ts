import { by, device, expect, element } from 'detox';

/**
 * feed.test.ts — the problems feed (tab) shows the demo list.
 */
describe('Feed screen', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    // Skip auth if visible.
    await element(by.id('oauth-google')).tap().catch(() => {});
  });

  it('renders the demo problem cards in the FlatList', async () => {
    // FlatLists in Detox are usually visible after the underlying
    // ScrollView has settled. We wait on the first card.
    await waitFor(element(by.id('problem-card-sample-1')))
      .toBeVisible()
      .withTimeout(8_000);
    await expect(element(by.id('problem-card-sample-1'))).toBeVisible();
    await expect(element(by.id('problem-card-sample-2'))).toBeVisible();
  });

  it('tapping a card navigates to the problem detail page', async () => {
    await element(by.id('problem-card-sample-1')).tap();
    await expect(element(by.id('problem-title'))).toBeVisible();
  });
});

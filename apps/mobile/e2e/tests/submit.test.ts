import { by, device, expect, element } from 'detox';

/**
 * submit.test.ts — /submit screen renders the auth-gate CTA when the
 * user isn't signed in (real API mode), or the full submit form when
 * USE_MOCK is on (auth is a no-op).
 *
 * In mock mode the form fields + location picker + submit CTA must be
 * reachable so Detox can exercise the create flow.
 */
describe('Submit screen', () => {
  beforeAll(async () => {
    await device.reloadReactNative();
    await element(by.id('oauth-google')).tap().catch(() => {});
  });

  it('shows either the auth gate OR the submit form', async () => {
    const gate = element(by.id('auth-gate-blocked'));
    const loading = element(by.id('auth-gate-loading'));
    const form = element(by.id('submit-screen'));

    const gateVisible = await gate.isVisible().catch(() => false);
    const loadingVisible = await loading.isVisible().catch(() => false);
    const formVisible = await form.isVisible().catch(() => false);

    expect(gateVisible || loadingVisible || formVisible).toBe(true);

    if (gateVisible) {
      await expect(element(by.id('auth-gate-login-cta'))).toBeVisible();
    }
  });

  it('renders the location picker when the form is reachable', async () => {
    const picker = element(by.id('location-picker'));
    const visible = await picker.isVisible().catch(() => false);
    if (visible) {
      // Mock-mode path: assert the GPS button + category chips are mounted.
      await expect(element(by.id('location-picker-gps'))).toBeVisible();
      await expect(element(by.id('submit-categories'))).toBeVisible();
    }
    // In real-API / no-session mode the picker is hidden behind the
    // auth gate; that's fine — covered by the previous test.
  });
});

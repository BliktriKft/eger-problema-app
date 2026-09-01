import { test, expect } from '@playwright/test';

/**
 * Smoke test — the auth-independent paths through the app render without
 * 5xx errors and contain the right landing copy.  We deliberately skip
 * any flow that needs a real Supabase project; the OAuth + vote paths
 * get full coverage once CI provisions the test project.
 */

test.describe('Public surface', () => {
  test('GET / redirects to /map', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    // App router issues a 307; check final URL rather than status.
    await expect(page).toHaveURL(/\/map$/);
  });

  test('/map renders the map shell with the demo pins', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByTestId('map-shell')).toBeVisible({ timeout: 10_000 });
    // Until Leaflet tiles load on the screenshot the markers still exist.
    await expect(page.locator('.eger-pin')).toHaveCount(7, { timeout: 15_000 });
  });

  test('/problems renders the problems listing (skeleton / cards / empty)', async ({ page }) => {
    await page.goto('/problems');
    await expect(page.getByTestId('problems-list')).toBeVisible();
    // We don't query a live backend from this CI test.  Acceptance:
    // either mock data, skeletons, or an empty/error state must render.
    // Their DOM presence is what we care about — not the data source.
    await expect(
      page
        .locator('[data-testid^="problem-card-"], [class*="animate-shimmer"], [role="status"]')
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('/problems/[id] renders the detail shell + vote + wiki', async ({ page }) => {
    await page.goto('/problems/mock-1');
    await expect(page.getByTestId('problem-detail-mock-1')).toBeVisible();
    await expect(page.getByTestId('vote-buttons')).toBeVisible();
    await expect(page.getByTestId('wiki-section-mock-1')).toBeVisible();
  });

  test('/login shows the OAuth buttons + email sign-in', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('email-signin')).toBeVisible();
    await expect(page.getByTestId('oauth-buttons')).toBeVisible();
    await expect(page.getByTestId('oauth-google')).toBeVisible();
  });

  test('/register shows the registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('form')).toBeVisible();
  });

  test('/submit validates required fields', async ({ page }) => {
    await page.goto('/submit');
    await expect(page.getByTestId('submit-form')).toBeVisible();
    // Hitting submit with empty fields renders Zod error messages.
    await page.getByTestId('submit-cta').click();
    await expect(page.getByText(/legalább 3 karakter/i)).toBeVisible();
  });

  test('top nav toggles to "Bejelentkezés" when signed out', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByTestId('sign-in')).toBeVisible();
  });
});

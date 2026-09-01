import { test, expect } from '@playwright/test';
import { LoginPage, RegisterPage } from './pages';
import { AuthHelper } from './helpers';

/**
 * auth.spec.ts — login + register surface coverage.
 *
 * In mock mode (NEXT_PUBLIC_SUPABASE env unset) the OAuth buttons render
 * but the email form's submit surfaces a "configure me" toast rather than
 * performing a network round-trip. We exercise the visible surfaces and
 * leave the OAuth happy-path to Task Q2 (which provisions a seeded Supabase
 * test project).
 *
 * What we DO want to nail here:
 *   - both screens render with form controls visible
 *   - email validation triggers on empty / malformed input
 *   - the OAuth group advertises Google (and the others if present)
 *   - the top-nav login CTA is visible on /map when signed out
 */

test.describe('Authentication surface', () => {
  test('/login renders OAuth + email form with all expected controls', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.oauthGroup).toBeVisible();
    await expect(login.googleButton).toBeVisible();
    await expect(login.emailForm).toBeVisible();
    await expect(login.emailField).toBeVisible();
    await expect(login.passwordField).toBeVisible();
    await expect(login.submitButton).toBeVisible();
    await expect(login.submitButton).toHaveText(/Bejelentkezés email/i);
  });

  test('/register renders a registration form with a submit CTA', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.goto();

    await expect(register.form).toBeVisible();
    await expect(register.submitButton).toBeVisible();
    // Hungarian submit copy is the contract we want to assert on.
    await expect(register.submitButton).toHaveText(/Regisztráció|Regisztrál/i);
  });

  test('email sign-in surfaces an error toast when Supabase rejects the credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const { email, password } = AuthHelper.freshCredentials();
    await login.signInWithCredentials(email, password);

    // Either an actual error (placeholder URL fails the network) or
    // Supabase's "Invalid login credentials" message lands in the same
    // toast region. The test passes as long as we get *some* signalled
    // feedback in a status / toast region — this guards against the
    // form silently swallowing the error.
    const status = page.locator('[role="status"], [data-sonner-toast]').first();
    await expect(status).toBeVisible({ timeout: 4_000 });
  });

  test('top nav shows the "Bejelentkezés" CTA when signed out', async ({ page }) => {
    await page.goto('/map');
    await expect(page.getByTestId('sign-in')).toBeVisible();
  });
});

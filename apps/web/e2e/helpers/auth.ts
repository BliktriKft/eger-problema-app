import type { Page } from '@playwright/test';

/**
 * Auth helpers — keep the OAuth flow out of the test path entirely.
 *
 * The dev build with Supabase env vars unset shows a "configure me" toast
 * rather than crashing; that's the behaviour the QA suite leans on. When
 * real OAuth enters CI (Task Q2) we'll replace these stubs with calls
 * into a Supabase-authenticated test page.
 */
export const AuthHelper = {
  /** Land on /login and assert the OAuth + email widgets are visible. */
  async openLogin(page: Page): Promise<void> {
    await page.goto('/login');
    await page.getByTestId('oauth-buttons').waitFor({ state: 'visible' });
    await page.getByTestId('oauth-google').waitFor({ state: 'visible' });
    await page.getByTestId('email-signin').waitFor({ state: 'visible' });
  },

  /** Return a memorable Hungarian test email + password pair. */
  freshCredentials(): { email: string; password: string } {
    const stamp = Date.now();
    return {
      email: `e2e+${stamp}@eger-test.hu`,
      password: 'E2E-Test-2026!',
    };
  },
};

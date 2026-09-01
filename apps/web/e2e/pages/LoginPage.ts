import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login at /login — wraps the OAuth button group + email form.
 *
 * In mock mode (the default for QA) the form's submit handler surfaces a
 * toast: "A Supabase nincs bekötve…" — we test the toast appears without
 * actually performing a network round-trip.
 */
export class LoginPage extends BasePage {
  readonly oauthGroup: Locator;
  readonly googleButton: Locator;
  readonly emailForm: Locator;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.oauthGroup = this.byTestId('oauth-buttons');
    this.googleButton = this.byTestId('oauth-google');
    this.emailForm = this.byTestId('email-signin');
    this.emailField = this.byTestId('login-email');
    this.passwordField = this.byTestId('login-password');
    this.submitButton = this.byTestId('login-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await expect(this.oauthGroup).toBeVisible();
  }

  /** Fill email + password and submit. In mock mode this triggers a toast
   *  warning — we return without asserting on the toast here. */
  async signInWithCredentials(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.submitButton.click();
  }
}

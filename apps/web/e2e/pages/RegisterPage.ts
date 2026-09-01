import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Register at /register. Email + password field plus submit button. */
export class RegisterPage extends BasePage {
  readonly form: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.form = this.page.locator('form');
    this.submitButton = this.byTestId('register-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
    await expect(this.form).toBeVisible();
  }
}

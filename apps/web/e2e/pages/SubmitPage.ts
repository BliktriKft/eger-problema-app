import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * /submit — wraps the new-pin form (react-hook-form + Zod under the hood).
 *
 * We drive the form with raw values; in mock mode the submit call is
 * blocked at the auth layer (no Supabase session) and we get a 401 toast
 * — that's actually what we want to assert on.
 */
export class SubmitPage extends BasePage {
  readonly form: Locator;
  readonly titleField: Locator;
  readonly descriptionField: Locator;
  readonly categoryTrigger: Locator;
  readonly institutionField: Locator;
  readonly coordsLine: Locator;
  readonly submitCta: Locator;

  constructor(page: Page) {
    super(page);
    this.form = this.byTestId('submit-form');
    this.titleField = this.byTestId('submit-title');
    this.descriptionField = this.byTestId('submit-description');
    this.categoryTrigger = this.byTestId('submit-category-trigger');
    this.institutionField = this.byTestId('submit-institution');
    this.coordsLine = this.byTestId('submit-coords');
    this.submitCta = this.byTestId('submit-cta');
  }

  async goto(): Promise<void> {
    await this.page.goto('/submit');
    await expect(this.form).toBeVisible();
  }

  async fillAndSubmit(title: string, description: string): Promise<void> {
    await this.titleField.fill(title);
    await this.descriptionField.fill(description);
    await this.submitCta.click();
  }
}

import { test, expect } from '@playwright/test';
import { SubmitPage } from './pages';
import { LocationHelper } from './helpers';

/**
 * submit.spec.ts — the new-pin form, validation paths, and an end-to-end
 * draft flow driven by URL-supplied coordinates.
 *
 * The submit mutation is gated by an authenticated Supabase session; in
 * mock mode we expect the submit CTA to surface a warning toast rather
 * than firing the POST. Task Q2 will add a Task fixme with a real test
 * project.
 */

test.describe('Submit form', () => {
  test('renders all required form controls', async ({ page }) => {
    const submit = new SubmitPage(page);
    await submit.goto();

    await expect(submit.form).toBeVisible();
    await expect(submit.titleField).toBeVisible();
    await expect(submit.descriptionField).toBeVisible();
    await expect(submit.categoryTrigger).toBeVisible();
    await expect(submit.institutionField).toBeVisible();
    await expect(submit.coordsLine).toBeVisible();
    await expect(submit.submitCta).toBeVisible();
  });

  test('title < 3 chars triggers Zod validation on submit', async ({ page }) => {
    const submit = new SubmitPage(page);
    await submit.goto();

    await submit.titleField.fill('ab');
    await submit.descriptionField.fill('Ez egy elegendően hosszú leírás a teszthez.');
    await submit.submitCta.click();

    await expect(page.getByText(/legalább 3 karakter/i)).toBeVisible();
  });

  test('description < 10 chars triggers Zod validation on submit', async ({ page }) => {
    const submit = new SubmitPage(page);
    await submit.goto();

    await submit.titleField.fill('Szemetes a főtéren');
    await submit.descriptionField.fill('rövid');
    await submit.submitCta.click();

    await expect(page.getByText(/legalább 10 karakter/i)).toBeVisible();
  });

  test('coords seeded from URL ?lat&lng override the Eger-centre default', async ({ page }) => {
    const { latitude, longitude } = LocationHelper.egerCentre();
    const lat = latitude + 0.00123;
    const lng = longitude + 0.00234;
    await LocationHelper.setLocationViaUrl(page, lat, lng);

    const submit = new SubmitPage(page);
    await expect(submit.form).toBeVisible();

    const text = await submit.coordsLine.textContent();
    expect(text).toContain(lat.toFixed(5));
    expect(text).toContain(lng.toFixed(5));
  });

  test('demo-mode banner is NOT visible when Supabase env vars are populated', async ({ page }) => {
    // The QA webServer config supplies a placeholder Supabase URL +
    // anon key, so SUPABASE_CONFIGURED is true and the "Demo mód" banner
    // should stay hidden. If the banner re-appears it means the auth
    // context lost its env bootstrap and we silently dropped into mock.
    const submit = new SubmitPage(page);
    await submit.goto();

    const banner = page.getByText(/Demo mód/i);
    await expect(banner).toHaveCount(0);
  });

  test('fully valid form surfaces feedback in the toast region', async ({ page }) => {
    const submit = new SubmitPage(page);
    await submit.goto();

    await submit.fillAndSubmit(
      'Kátyú a Széchenyi utcán',
      'Az utca jobb oldalán, a tűzcsap előtt nagy kátyú keletkezett.',
    );

    // Submit goes through to the (placeholder) Supabase project → some
    // kind of error or warning must surface in the toast / role=status
    // region. We don't pin the message because the Supabase network
    // errors vary; we just want to make sure the form does not fail
    // silently.
    const status = page.locator('[role="status"], [data-sonner-toast]').first();
    await expect(status).toBeVisible({ timeout: 4_000 });
  });
});

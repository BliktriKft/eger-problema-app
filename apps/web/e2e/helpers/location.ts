import type { Page } from '@playwright/test';

/**
 * Location helpers — we cannot drive the real browser geolocation API on
 * headless Chromium reliably, so QA-side locates use the URL ?lat=&lng=
 * contract that /submit accepts (already documented in ProblemForm.tsx).
 */
export const LocationHelper = {
  async setLocationViaUrl(page: Page, lat: number, lng: number): Promise<void> {
    await page.goto(`/submit?lat=${lat}&lng=${lng}`);
  },

  /** Eger city centre fallback used by ProblemForm.tsx — kept here so
   *  visual-regression shots stay reproducible. */
  egerCentre(): { latitude: number; longitude: number } {
    return { latitude: 47.9025, longitude: 20.3772 };
  },
};

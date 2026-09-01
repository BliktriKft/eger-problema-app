import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — boots `next dev` if no server is already running on
 * :3000 and runs the E2E suite against it.
 *
 * Layer-up of the Q1 (qa/0001-e2e-detox-a11y-foundation) work:
 *   - three browsers: chromium, firefox, webkit
 *   - two mobile viewports: Pixel 5 (Android Chrome), iPhone 13 (Safari)
 *   - retry & trace on CI, screenshot + video always on failure
 *   - reporter: list + html locally (CI adds github annotations)
 *   - the dev server is expected to read apps/web/.env.local for env
 *     bootstrap (placeholder Supabase URL + empty API base so the UI
 *     reads from MOCK_PROBLEMS). If you forget to write .env.local the
 *     OAuth button group falls back to a "configure me" banner and the
 *     auth tests will flag a missing-env regression.
 *
 * Refs:
 *   https://playwright.dev/docs/test-configuration
 *   https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/node_modules/**'],

  // 45s covers a fresh `next dev` first-paint; visual-regression needs
  // a little more headroom on first run while Leaflet tiles stream in.
  timeout: 45_000,
  expect: { timeout: 8_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // Two retries on CI smooths out first-paint flake (Leaflet, OSM tiles,
  // Supabase getSession round-trip). Locally we want a single pass to keep
  // the feedback loop tight.
  retries: process.env.CI ? 2 : 0,

  // On CI we serialise to keep the dev server's font-and-tile budget
  // predictable; locally we let Playwright fan out.
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],

  outputDir: 'test-results',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'hu-HU',
    timezoneId: 'Europe/Budapest',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: '..',
  },
});

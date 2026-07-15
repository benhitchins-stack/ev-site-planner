// Playwright configuration for the EV Site Planner suite.
// Tests run against the repository's own static server (serve.mjs) on a
// dedicated port so a separately running dev server is never disturbed.
//
//   npm test                 all projects
//   npm test -- --project=desktop-chromium
//   npm run test:headed      watch the browser
//   npm run test:report      open the last HTML report
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PW_PORT || 8010);

// The full suite runs on desktop Chromium. Reduced viewport / device projects
// re-run the layout-sensitive specs so responsive and touch regressions fail fast
// without tripling total runtime.
const LAYOUT_SPECS = /planner-(smoke|responsive)\.spec\.js/;
const MOBILE_SPECS = /planner-(smoke|responsive|accessibility)\.spec\.js/;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    // Chromium everywhere, including the phone and tablet projects: those use
    // the device metrics (viewport, touch, user agent) for layout coverage.
    // WebKit is not installed in CI; adding it is a Phase 2 decision.
    browserName: 'chromium',
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'node serve.mjs',
    port: PORT,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
    timeout: 20_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'laptop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
      testMatch: LAYOUT_SPECS,
    },
    {
      name: 'tablet-ipad-portrait',
      use: { ...devices['iPad (gen 11)'] },
      testMatch: LAYOUT_SPECS,
    },
    {
      name: 'tablet-ipad-landscape',
      use: { ...devices['iPad (gen 11) landscape'] },
      testMatch: LAYOUT_SPECS,
    },
    {
      name: 'mobile-iphone',
      use: { ...devices['iPhone 13'] },
      testMatch: MOBILE_SPECS,
    },
    {
      name: 'mobile-small',
      use: { ...devices['iPhone SE (3rd gen)'] },
      testMatch: /planner-responsive\.spec\.js/,
    },
  ],
});

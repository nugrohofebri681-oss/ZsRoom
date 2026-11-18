import { defineConfig, devices } from '@playwright/test';

// In the Claude Code cloud container Chromium is pre-installed at /opt/pw-browsers.
// In GitHub Actions, `npx playwright install --with-deps chromium` provides it instead.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    // Budget-Android-class viewport (Galaxy A05: 720x1600 physical, ~360x800 CSS @2x). Emulation only — not a device test.
    { name: 'mobile-android', use: { ...devices['Galaxy S9+'], viewport: { width: 800, height: 360 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
});

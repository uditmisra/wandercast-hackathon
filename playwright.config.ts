import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Wander E2E smoke tests.
 *
 * By default, tests run against the local Vite dev server on port 5173.
 * Set BASE_URL to override (e.g., staging environment).
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // Generous timeouts — tour generation involves real API calls in live mode
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the Vite dev server before running tests.
  // In CI, set SKIP_SERVER=true if the server is already running.
  webServer: process.env.SKIP_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        timeout: 60_000,
      },

  timeout: 60_000,
});

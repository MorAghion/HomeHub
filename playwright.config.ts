import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration.
 *
 * Auth setup (auth.setup.ts) runs once, saves storage state to
 * e2e/.auth/user.json, and all other tests reuse that state.
 *
 * Credentials are read from env vars:
 *   E2E_TEST_EMAIL    (required for non-smoke tests)
 *   E2E_TEST_PASSWORD (required for non-smoke tests)
 *
 * Run: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // auth state is shared — serial safer
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // ── Auth setup (runs once, saves storage state) ────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },

    // ── Desktop Chrome ─────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },

    // ── Mobile Chrome (iPhone 14 viewport) ────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'], // 393×851 — close to iPhone 14
        userAgent: devices['iPhone 14'].userAgent,
        viewport: { width: 390, height: 844 }, // iPhone 14
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})

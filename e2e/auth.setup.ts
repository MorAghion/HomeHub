import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import { testCredentials } from './fixtures/test-data'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Auth setup — runs once before all test projects.
 *
 * Signs in via the UI and saves localStorage (Supabase JWT) to
 * e2e/.auth/user.json so all test files can reuse the auth session
 * without re-authenticating.
 *
 * Requires env vars:
 *   E2E_TEST_EMAIL
 *   E2E_TEST_PASSWORD
 *
 * If not set, storage state is written as empty so smoke tests
 * still run against the auth screen.
 */

const authFile = path.join(__dirname, '.auth/user.json')

setup('authenticate', async ({ page }) => {
  if (!testCredentials.isConfigured) {
    console.warn(
      '[auth.setup] E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set. ' +
      'Writing empty auth state — hub tests will be skipped.'
    )
    // Write empty storage state so dependencies resolve
    await page.context().storageState({ path: authFile })
    return
  }

  await page.goto('/')

  // Wait for the auth screen to load
  await expect(page.getByText('HomeHub')).toBeVisible({ timeout: 10_000 })

  // Fill in sign-in form
  await page.getByPlaceholder('your@email.com').fill(testCredentials.email)
  await page.getByPlaceholder('••••••••').fill(testCredentials.password)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Wait for the dashboard to load (HomeHub title in app header)
  await expect(page.getByRole('heading', { name: 'HomeHub' })).toBeVisible({
    timeout: 15_000,
  })

  // Save storage state (includes Supabase session in localStorage)
  await page.context().storageState({ path: authFile })
})

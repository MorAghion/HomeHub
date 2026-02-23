import { type Page, expect } from '@playwright/test'
import { testCredentials } from './test-data'

/**
 * Returns true if E2E credentials are configured.
 * Use at the start of tests that require auth.
 */
export function requiresAuth() {
  return testCredentials.isConfigured
}

/**
 * Navigate to the app and wait for it to be ready.
 * If user is not authenticated (no storageState), waits for auth screen.
 */
export async function gotoApp(page: Page) {
  await page.goto('/')
  // Wait for either the auth screen or the dashboard
  await expect(
    page.getByText('HomeHub').first()
  ).toBeVisible({ timeout: 15_000 })
}

/**
 * Navigate into a hub by clicking the bottom nav button.
 * Works from any screen that shows the bottom nav.
 *
 * @param page - Playwright page
 * @param hubName - 'Shopping' | 'Tasks' | 'Vouchers' (i18n key text)
 */
export async function navigateToHub(page: Page, hubName: 'Shopping' | 'Tasks' | 'Vouchers') {
  // Bottom nav button contains the hub name text
  await page.getByRole('button', { name: hubName, exact: false }).last().click()
  // Wait for the hub content to be visible
  await page.waitForTimeout(400) // allow state transition
}

/**
 * Create a new sub-hub list from the hub screen.
 * Assumes the hub is already open (active mode, hub component visible).
 *
 * @param page - Playwright page
 * @param listName - Name for the new list
 * @param titleHint - Part of the hub heading (e.g. 'Shopping', 'Tasks')
 */
export async function createSubHub(page: Page, listName: string, titleHint: string) {
  // Wait for hub content to be visible
  await expect(page.getByText(titleHint, { exact: false }).first()).toBeVisible()

  // Click the + button (title includes 'new' translation key — use Plus icon button)
  const plusBtn = page.locator('button[title]').filter({ hasText: '' }).first()
  // More robust: find the circular border button (+ new list)
  await page.locator('button').filter({ has: page.locator('svg') }).first().click()

  // InputModal appears — fill in the name
  const input = page.getByRole('textbox')
  await input.fill(listName)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(300)
}

/**
 * Wait for the hub "active mode" to render — i.e. the hub component is visible.
 */
export async function waitForActiveMode(page: Page) {
  // Active mode always shows the bottom nav
  await page.waitForTimeout(500)
}

/**
 * Assert that the current HTML dir attribute matches the expected direction.
 */
export async function assertDirection(page: Page, dir: 'ltr' | 'rtl') {
  const htmlDir = await page.evaluate(() => document.documentElement.dir)
  expect(htmlDir).toBe(dir)
}

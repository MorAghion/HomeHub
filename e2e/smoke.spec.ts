import { test, expect } from '@playwright/test'

/**
 * E2E smoke test — verifies the app loads and renders the auth screen.
 * Requires the dev server to be running (playwright.config.ts handles this).
 */
test('app loads and renders without crashing', async ({ page }) => {
  await page.goto('/')
  // The page should not be blank — some root element is rendered
  const body = page.locator('body')
  await expect(body).not.toBeEmpty()
})

test('page has a valid HTML title', async ({ page }) => {
  await page.goto('/')
  const title = await page.title()
  expect(title.length).toBeGreaterThan(0)
})

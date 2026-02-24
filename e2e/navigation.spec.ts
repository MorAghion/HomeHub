import { test, expect } from '@playwright/test'
import { requiresAuth, gotoApp, navigateToHub } from './fixtures/helpers'

/**
 * Navigation E2E — cross-hub navigation, back button, dashboard card stack
 */

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresAuth()) test.skip()
    await gotoApp(page)
  })

  test('can navigate between all three hubs sequentially', async ({ page }) => {
    // Shopping
    await navigateToHub(page, 'Shopping')
    await expect(page.getByText('Shopping Lists')).toBeVisible()

    // Tasks
    await navigateToHub(page, 'Tasks')
    await expect(page.getByText('Home Tasks')).toBeVisible()

    // Vouchers
    await navigateToHub(page, 'Vouchers')
    await expect(page.getByText('Vouchers & Cards')).toBeVisible()
  })

  test('back arrow returns to the hub from a sub-hub list', async ({ page }) => {
    // Navigate into shopping hub, create a list, open it, go back
    await navigateToHub(page, 'Shopping')
    await expect(page.getByText('Shopping Lists')).toBeVisible()

    const suffix = Date.now().toString().slice(-6)
    const listName = `[E2E] Nav ${suffix}`

    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    // Open list
    await page.getByText(listName).click()
    await page.waitForTimeout(400)

    // Click back (← arrow button)
    await page.getByRole('button', { name: '←' }).first().click()
    await page.waitForTimeout(400)

    // Should be back at the Shopping hub
    await expect(page.getByText('Shopping Lists')).toBeVisible()
  })

  test('switching hubs via bottom nav persists existing hub state', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const listName = `[E2E] Persist ${suffix}`

    // Create a shopping list
    await navigateToHub(page, 'Shopping')
    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    // Navigate to Tasks hub
    await navigateToHub(page, 'Tasks')
    await expect(page.getByText('Home Tasks')).toBeVisible()

    // Return to Shopping hub — list should still be there
    await navigateToHub(page, 'Shopping')
    await expect(page.getByText(listName)).toBeVisible()
  })

  test('app loads at dashboard (landing) screen initially', async ({ page }) => {
    await gotoApp(page)
    // The dashboard shows HomeHub title
    await expect(page.getByText('HomeHub').first()).toBeVisible()
  })

  test('bottom nav is always visible when a hub is active', async ({ page }) => {
    await navigateToHub(page, 'Shopping')

    // Bottom nav should contain all three hub labels
    await expect(page.getByRole('button', { name: /Shopping/i }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: /Tasks/i }).last()).toBeVisible()
    await expect(page.getByRole('button', { name: /Vouchers/i }).last()).toBeVisible()
  })

  test('mobile: swipe between hubs via bottom nav', async ({ page }) => {
    // Uses the same bottom nav — no swipe gesture needed, just tap
    await navigateToHub(page, 'Shopping')
    await expect(page.getByText('Shopping Lists')).toBeVisible()

    await navigateToHub(page, 'Vouchers')
    await expect(page.getByText('Vouchers & Cards')).toBeVisible()
  })
})

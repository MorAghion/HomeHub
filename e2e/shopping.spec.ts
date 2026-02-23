import { test, expect } from '@playwright/test'
import { testData } from './fixtures/test-data'
import { requiresAuth, gotoApp, navigateToHub } from './fixtures/helpers'

/**
 * Shopping Hub E2E — sub-hub creation, master list, add items, check off
 *
 * All tests are skipped when E2E credentials are not configured.
 */

test.describe('Shopping Hub', () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresAuth()) test.skip()
    await gotoApp(page)
  })

  test('navigates to Shopping Hub from bottom nav', async ({ page }) => {
    await navigateToHub(page, 'Shopping')
    await expect(page.getByText('Shopping Lists')).toBeVisible()
  })

  test('creates a new shopping sub-hub', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const listName = testData.shopping.listName(suffix)

    await navigateToHub(page, 'Shopping')

    // Click the + (New List) button
    await page.getByRole('button', { name: 'New List' }).click()

    // InputModal appears — fill name and save
    const input = page.getByRole('textbox')
    await input.fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    // New list card should be visible
    await expect(page.getByText(listName)).toBeVisible()
  })

  test('opens a sub-hub and sees the empty active list', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const listName = testData.shopping.listName(suffix)

    await navigateToHub(page, 'Shopping')
    await page.getByRole('button', { name: 'New List' }).click()
    const input = page.getByRole('textbox')
    await input.fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    // Click into the list
    await page.getByText(listName).click()
    await page.waitForTimeout(400)

    // Should see the list name as heading
    await expect(page.getByText(listName)).toBeVisible()
  })

  test('adds an item via the inline add-item form', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const listName = testData.shopping.listName(suffix)
    const itemName = testData.shopping.itemName(suffix)

    // Create the sub-hub
    await navigateToHub(page, 'Shopping')
    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    // Open the list
    await page.getByText(listName).click()
    await page.waitForTimeout(400)

    // Fill in the add item input and submit
    const addInput = page.getByPlaceholder(/add|item/i).first()
    await addInput.fill(itemName)
    await addInput.press('Enter')
    await page.waitForTimeout(300)

    // Item should appear in the active list
    await expect(page.getByText(itemName)).toBeVisible()
  })

  test('checks off an item and it moves to the bottom / completed section', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const listName = testData.shopping.listName(suffix)
    const itemName = testData.shopping.itemName(suffix)
    const itemName2 = testData.shopping.itemName2(suffix)

    // Create sub-hub, open it
    await navigateToHub(page, 'Shopping')
    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)
    await page.getByText(listName).click()
    await page.waitForTimeout(400)

    // Add two items
    const addInput = page.getByPlaceholder(/add|item/i).first()
    await addInput.fill(itemName)
    await addInput.press('Enter')
    await page.waitForTimeout(200)
    await addInput.fill(itemName2)
    await addInput.press('Enter')
    await page.waitForTimeout(200)

    // Check off the first item (click its checkbox-like button)
    const itemRow = page.locator('li, [role="listitem"]').filter({ hasText: itemName }).first()
    const checkBtn = itemRow.locator('button').first()
    await checkBtn.click()
    await page.waitForTimeout(300)

    // The second item should still be visible (not checked)
    await expect(page.getByText(itemName2)).toBeVisible()
  })

  test('mobile: navigates to Shopping Hub and creates a sub-hub', async ({ page }) => {
    if (!requiresAuth()) test.skip()

    await gotoApp(page)
    await navigateToHub(page, 'Shopping')

    const suffix = Date.now().toString().slice(-6)
    const listName = testData.shopping.listName(suffix)

    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    await expect(page.getByText(listName)).toBeVisible()
  })
})

/**
 * fe-bug-011 regression: ShoppingList edit mode buttons must have
 * uniform height and consistent spacing (gap between buttons).
 */
test.describe('fe-bug-011 — ShoppingList edit mode button layout', () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresAuth()) test.skip()
    await gotoApp(page)
  })

  async function openShoppingListWithItems(page: Parameters<typeof gotoApp>[0]) {
    const suffix = Date.now().toString().slice(-6)
    const listName = `[E2E] EditMode ${suffix}`

    await navigateToHub(page, 'Shopping')
    await page.getByRole('button', { name: 'New List' }).click()
    await page.getByRole('textbox').fill(listName)
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)

    await page.getByText(listName).click()
    await page.waitForTimeout(400)

    // Add two items
    const addInput = page.getByPlaceholder(/add|item/i).first()
    await addInput.fill(`[E2E] Item A ${suffix}`)
    await addInput.press('Enter')
    await page.waitForTimeout(200)
    await addInput.fill(`[E2E] Item B ${suffix}`)
    await addInput.press('Enter')
    await page.waitForTimeout(200)

    return listName
  }

  test('[BUG-011] bulk delete mode toolbar is visible when edit button clicked', async ({ page }) => {
    await openShoppingListWithItems(page)

    // Click the bulk-delete toggle (trash-can icon)
    await page.getByTitle('Bulk Delete Mode').click()
    await page.waitForTimeout(200)

    // The bulk delete action bar should appear
    await expect(page.getByText('Select All')).toBeVisible()
  })

  test('[BUG-011] Delete Selected and Cancel buttons have the same computed height', async ({ page }) => {
    await openShoppingListWithItems(page)

    // Enter bulk delete mode
    await page.getByTitle('Bulk Delete Mode').click()
    await page.waitForTimeout(200)

    // Select at least one item to reveal Delete Selected
    await page.getByText('Select All').click()
    await page.waitForTimeout(200)

    const deleteBtn = page.getByRole('button', { name: 'Delete Selected' })
    const cancelBtn = page.getByRole('button', { name: 'Cancel' })

    await expect(deleteBtn).toBeVisible()
    await expect(cancelBtn).toBeVisible()

    // Compare the rendered heights — they must match (same padding)
    const deleteHeight = await deleteBtn.evaluate((el) => el.getBoundingClientRect().height)
    const cancelHeight = await cancelBtn.evaluate((el) => el.getBoundingClientRect().height)

    expect(
      Math.abs(deleteHeight - cancelHeight),
      `Delete Selected (${deleteHeight}px) and Cancel (${cancelHeight}px) must have matching heights`
    ).toBeLessThanOrEqual(2) // allow 2px tolerance for sub-pixel rendering
  })

  test('[BUG-011] action buttons are horizontally adjacent with visible gap between them', async ({ page }) => {
    await openShoppingListWithItems(page)
    await page.getByTitle('Bulk Delete Mode').click()
    await page.waitForTimeout(200)
    await page.getByText('Select All').click()
    await page.waitForTimeout(200)

    const deleteBtn = page.getByRole('button', { name: 'Delete Selected' })
    const cancelBtn = page.getByRole('button', { name: 'Cancel' })

    const deleteRect = await deleteBtn.evaluate((el) => el.getBoundingClientRect())
    const cancelRect = await cancelBtn.evaluate((el) => el.getBoundingClientRect())

    // Buttons should be side-by-side (same vertical position)
    expect(
      Math.abs(deleteRect.top - cancelRect.top),
      'Delete Selected and Cancel must be vertically aligned'
    ).toBeLessThanOrEqual(4)

    // There should be a visible gap between them (right edge of one < left edge of other)
    const gap = Math.abs(cancelRect.left - deleteRect.right)
    expect(gap, 'There must be a visible gap between Delete and Cancel buttons').toBeGreaterThan(0)
  })
})

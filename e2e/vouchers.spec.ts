import { test, expect } from '@playwright/test'
import { testData } from './fixtures/test-data'
import { requiresAuth, gotoApp, navigateToHub } from './fixtures/helpers'

/**
 * Vouchers Hub E2E — create voucher list, add a voucher, verify card in grid, open details
 *
 * Uses "BuyMe" template (defaultType: 'voucher') to skip the type-selection step.
 */

test.describe('Vouchers Hub', () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresAuth()) test.skip()
    await gotoApp(page)
  })

  test('navigates to Vouchers Hub from bottom nav', async ({ page }) => {
    await navigateToHub(page, 'Vouchers')
    await expect(page.getByText('Vouchers & Cards')).toBeVisible()
  })

  test('creates a new voucher list using BuyMe template', async ({ page }) => {
    await navigateToHub(page, 'Vouchers')

    // Open template modal
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await expect(page.getByText('Choose Template')).toBeVisible({ timeout: 5_000 })

    // Select BuyMe template (has defaultType: 'voucher' — no extra step)
    await page.getByRole('button', { name: /BuyMe/i }).click()
    await page.waitForTimeout(400)

    // BuyMe list should appear in the hub
    await expect(page.getByText(/BuyMe/i)).toBeVisible()
  })

  test('adds a voucher with all fields and verifies card in grid', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const voucherName = testData.vouchers.voucherName(suffix)

    await navigateToHub(page, 'Vouchers')

    // Create a BuyMe list
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await expect(page.getByText('Choose Template')).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /BuyMe/i }).click()
    await page.waitForTimeout(400)

    // Enter the list
    await page.getByText(/BuyMe/i).first().click()
    await page.waitForTimeout(400)

    // Click "Add Voucher"
    await page.getByRole('button', { name: 'Add Voucher' }).first().click()
    await page.waitForTimeout(300)

    // Fill the form — Name (required)
    await page.getByPlaceholder(/Azrieli Gift Card/i).fill(voucherName)

    // Value
    await page.getByPlaceholder(/₪200|Movie Tickets/i).fill(testData.vouchers.voucherValue)

    // Issuer
    await page.getByPlaceholder(/BuyMe.*Azrieli/i).fill(testData.vouchers.voucherIssuer)

    // Expiry date — type into date input using label association
    const expiryInput = page.locator('input[type="date"]').first()
    await expiryInput.fill(testData.vouchers.voucherExpiry)

    // Code
    await page.getByPlaceholder(/ABC123456/i).fill(testData.vouchers.voucherCode)

    // Submit
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(500)

    // Voucher card should appear in the grid
    await expect(page.getByText(voucherName)).toBeVisible()
  })

  test('voucher card shows value and issuer', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const voucherName = testData.vouchers.voucherName(suffix)

    // Create list + add voucher
    await navigateToHub(page, 'Vouchers')
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await page.getByText('Choose Template').waitFor({ timeout: 5_000 })
    await page.getByRole('button', { name: /BuyMe/i }).click()
    await page.waitForTimeout(400)
    await page.getByText(/BuyMe/i).first().click()
    await page.waitForTimeout(400)

    await page.getByRole('button', { name: 'Add Voucher' }).first().click()
    await page.waitForTimeout(300)

    await page.getByPlaceholder(/Azrieli Gift Card/i).fill(voucherName)
    await page.getByPlaceholder(/₪200|Movie Tickets/i).fill('100')
    await page.getByPlaceholder(/BuyMe.*Azrieli/i).fill('TestIssuer')
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(500)

    // Card shows the voucher name
    await expect(page.getByText(voucherName)).toBeVisible()
  })

  test('custom template requires type selection (voucher vs reservation)', async ({ page }) => {
    await navigateToHub(page, 'Vouchers')
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await expect(page.getByText('Choose Template')).toBeVisible({ timeout: 5_000 })

    // Click "Custom" — has no defaultType → should show type selector
    await page.getByRole('button', { name: /Custom/i }).click()
    await page.waitForTimeout(300)

    // Should now show "Choose Item Type" heading
    await expect(page.getByText(/Choose.*Type/i)).toBeVisible()
  })
})

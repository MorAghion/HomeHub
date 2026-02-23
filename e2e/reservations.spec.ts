import { test, expect } from '@playwright/test'
import { testData } from './fixtures/test-data'
import { requiresAuth, gotoApp, navigateToHub } from './fixtures/helpers'

/**
 * Reservations E2E — create reservation list, add a reservation, verify card, verify date label
 *
 * Uses "Ontopo" template (defaultType: 'reservation') to skip the type-selection step.
 */

test.describe('Reservations', () => {
  test.beforeEach(async ({ page }) => {
    if (!requiresAuth()) test.skip()
    await gotoApp(page)
  })

  test('creates a reservation list using Ontopo template', async ({ page }) => {
    await navigateToHub(page, 'Vouchers')

    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await expect(page.getByText('Choose Template')).toBeVisible({ timeout: 5_000 })

    // Ontopo has defaultType: 'reservation' — direct creation
    await page.getByRole('button', { name: /Ontopo/i }).click()
    await page.waitForTimeout(400)

    await expect(page.getByText(/Ontopo/i)).toBeVisible()
  })

  test('adds a reservation with date, time, and address', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const reservationName = testData.reservations.reservationName(suffix)

    await navigateToHub(page, 'Vouchers')

    // Create Ontopo list
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await page.getByText('Choose Template').waitFor({ timeout: 5_000 })
    await page.getByRole('button', { name: /Ontopo/i }).click()
    await page.waitForTimeout(400)

    // Enter the list
    await page.getByText(/Ontopo/i).first().click()
    await page.waitForTimeout(400)

    // Open Add Voucher modal (labelled "Add Voucher" even for reservations)
    await page.getByRole('button', { name: 'Add Voucher' }).first().click()
    await page.waitForTimeout(300)

    // The form should show reservation-type fields (Event Date, Time, Address)
    await expect(page.getByText('Event Date')).toBeVisible()

    // Fill Name
    await page.getByPlaceholder(/Azrieli Gift Card/i).fill(reservationName)

    // Event Date
    const eventDateInput = page.locator('input[type="date"]').first()
    await eventDateInput.fill(testData.reservations.reservationDate)

    // Time
    const timeInput = page.locator('input[type="time"]').first()
    await timeInput.fill(testData.reservations.reservationTime)

    // Address
    await page.getByPlaceholder(/123 Main St/i).fill(testData.reservations.reservationAddress)

    // Submit
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(500)

    // Reservation card should appear
    await expect(page.getByText(reservationName)).toBeVisible()
  })

  test('reservation card is visible in the grid after creation', async ({ page }) => {
    const suffix = Date.now().toString().slice(-6)
    const reservationName = testData.reservations.reservationName(suffix)

    await navigateToHub(page, 'Vouchers')
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await page.getByText('Choose Template').waitFor({ timeout: 5_000 })
    await page.getByRole('button', { name: /Ontopo/i }).click()
    await page.waitForTimeout(400)

    await page.getByText(/Ontopo/i).first().click()
    await page.waitForTimeout(400)

    await page.getByRole('button', { name: 'Add Voucher' }).first().click()
    await page.waitForTimeout(300)

    await page.getByPlaceholder(/Azrieli Gift Card/i).fill(reservationName)
    const eventDateInput = page.locator('input[type="date"]').first()
    await eventDateInput.fill(testData.reservations.reservationDate)
    await page.getByRole('button', { name: 'Add' }).click()
    await page.waitForTimeout(500)

    // Card with reservation name visible in grid
    await expect(page.getByText(reservationName)).toBeVisible()
  })

  test('Movies & Shows template creates a reservation-type list', async ({ page }) => {
    await navigateToHub(page, 'Vouchers')
    await page.getByRole('button', { name: 'New Voucher List' }).click()
    await expect(page.getByText('Choose Template')).toBeVisible({ timeout: 5_000 })

    // Movies & Shows has defaultType: 'reservation'
    await page.getByRole('button', { name: /Movies/i }).click()
    await page.waitForTimeout(400)

    // List created directly (no type selector)
    await expect(page.getByText(/Movies/i)).toBeVisible()
  })
})

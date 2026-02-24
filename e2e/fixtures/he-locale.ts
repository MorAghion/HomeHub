/**
 * Hebrew locale fixture for RTL E2E tests.
 *
 * Provides helpers to activate and deactivate Hebrew/RTL mode
 * by writing to localStorage (same mechanism the Settings modal uses).
 */

import { type Page } from '@playwright/test'

export const HE_LOCALE_KEY = 'homehub-lang'

/**
 * Activate Hebrew locale by setting localStorage before page load.
 * Call this before navigating to ensure the app boots in Hebrew.
 */
export async function setHebrewLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('homehub-lang', 'he')
  })
}

/**
 * Activate English locale by setting localStorage before page load.
 * Useful for restoring state after a Hebrew test.
 */
export async function setEnglishLocale(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('homehub-lang', 'en')
  })
}

/**
 * Restore locale to English after a test that changed it.
 * Safe to call even if the locale was not changed.
 */
export async function restoreEnglishLocale(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('homehub-lang', 'en')
  })
}

/**
 * Read the current locale from the running page.
 */
export async function getCurrentLocale(page: Page): Promise<string> {
  return page.evaluate(() => localStorage.getItem('homehub-lang') ?? 'en')
}

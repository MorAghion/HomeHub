/**
 * renderWithI18n — shared test helper for i18n component tests.
 *
 * Creates a fresh i18next instance per call (no singleton) loaded with the
 * actual EN and HE JSON resources from src/i18n/. Wraps the rendered
 * component in I18nextProvider so that useTranslation() picks up the
 * correct language.
 *
 * Usage:
 *   renderWithI18n(<MyComponent />, { language: 'he' })
 */
import React from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'

// EN resources
import enCommon from '@/i18n/en/common.json'
import enShopping from '@/i18n/en/shopping.json'
import enTasks from '@/i18n/en/tasks.json'
import enVouchers from '@/i18n/en/vouchers.json'
import enReservations from '@/i18n/en/reservations.json'
import enSettings from '@/i18n/en/settings.json'
import enAuth from '@/i18n/en/auth.json'

// HE resources
import heCommon from '@/i18n/he/common.json'
import heShopping from '@/i18n/he/shopping.json'
import heTasks from '@/i18n/he/tasks.json'
import heVouchers from '@/i18n/he/vouchers.json'
import heReservations from '@/i18n/he/reservations.json'
import heSettings from '@/i18n/he/settings.json'
import heAuth from '@/i18n/he/auth.json'

function createTestI18n(language: 'en' | 'he'): i18n {
  const instance = i18next.createInstance()
  instance.use(initReactI18next).init({
    lng: language,
    fallbackLng: 'en',
    // Synchronous init — no Suspense needed in tests
    initImmediate: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    resources: {
      en: {
        common: enCommon,
        shopping: enShopping,
        tasks: enTasks,
        vouchers: enVouchers,
        reservations: enReservations,
        settings: enSettings,
        auth: enAuth,
      },
      he: {
        common: heCommon,
        shopping: heShopping,
        tasks: heTasks,
        vouchers: heVouchers,
        reservations: heReservations,
        settings: heSettings,
        auth: heAuth,
      },
    },
    defaultNS: 'common',
    returnNull: false,
    returnEmptyString: false,
  })
  return instance
}

interface RenderWithI18nOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: 'en' | 'he'
}

export function renderWithI18n(
  ui: React.ReactElement,
  { language = 'en', ...options }: RenderWithI18nOptions = {}
) {
  const i18n = createTestI18n(language)
  return {
    ...render(
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>,
      options
    ),
    i18n,
  }
}

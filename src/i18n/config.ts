import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './en/common.json';
import enShopping from './en/shopping.json';
import enTasks from './en/tasks.json';
import enVouchers from './en/vouchers.json';
import enReservations from './en/reservations.json';
import enSettings from './en/settings.json';
import enAuth from './en/auth.json';

import heCommon from './he/common.json';
import heShopping from './he/shopping.json';
import heTasks from './he/tasks.json';
import heVouchers from './he/vouchers.json';
import heReservations from './he/reservations.json';
import heSettings from './he/settings.json';
import heAuth from './he/auth.json';

const savedLang = localStorage.getItem('homehub-lang') ?? 'en';

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: 'en',
  // With bundled resources (no async backend), force synchronous init so
  // useTranslation() is safe to call on first render without Suspense.
  initImmediate: false,
  interpolation: {
    escapeValue: false, // React handles XSS
  },
  // Disable Suspense mode: prevents useTranslation() from throwing a Promise
  // when called before init resolves, which would crash the app without a
  // <Suspense> boundary.
  react: {
    useSuspense: false,
  },
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
});

export default i18n;

/**
 * E2E test data fixtures.
 *
 * Uses timestamps so parallel/sequential test runs don't clash.
 * All items created by E2E tests are prefixed with '[E2E]' for easy cleanup.
 */

export const E2E_PREFIX = '[E2E]'

/** Unique name for a single test run (timestamp-based) */
export const ts = () => Date.now().toString().slice(-6)

export const testData = {
  shopping: {
    listName: (suffix = ts()) => `${E2E_PREFIX} Groceries ${suffix}`,
    itemName: (suffix = ts()) => `${E2E_PREFIX} Milk ${suffix}`,
    itemName2: (suffix = ts()) => `${E2E_PREFIX} Bread ${suffix}`,
  },
  tasks: {
    listName: (suffix = ts()) => `${E2E_PREFIX} Chores ${suffix}`,
    taskName: (suffix = ts()) => `${E2E_PREFIX} Fix sink ${suffix}`,
    taskName2: (suffix = ts()) => `${E2E_PREFIX} Sweep floor ${suffix}`,
  },
  vouchers: {
    listName: (suffix = ts()) => `${E2E_PREFIX} Gift Cards ${suffix}`,
    voucherName: (suffix = ts()) => `${E2E_PREFIX} Amazon ${suffix}`,
    voucherValue: '50',
    voucherIssuer: 'Amazon',
    voucherCode: 'AMZN-TEST-1234',
    voucherExpiry: '2099-12-31',
  },
  reservations: {
    listName: (suffix = ts()) => `${E2E_PREFIX} Events ${suffix}`,
    reservationName: (suffix = ts()) => `${E2E_PREFIX} Dinner ${suffix}`,
    reservationAddress: '123 Main St, Tel Aviv',
    reservationDate: '2099-06-15',
    reservationTime: '19:30',
  },
}

/** Test user credentials — read from env vars */
export const testCredentials = {
  email: process.env.E2E_TEST_EMAIL ?? '',
  password: process.env.E2E_TEST_PASSWORD ?? '',
  get isConfigured() {
    return Boolean(this.email && this.password)
  },
}

import { vi } from 'vitest'

/**
 * In-memory localStorage mock for tests.
 * Automatically wired up via tests/setup.ts.
 *
 * Usage (manual override):
 *   const mock = createMockLocalStorage()
 *   Object.defineProperty(window, 'localStorage', { value: mock })
 */
export function createMockLocalStorage() {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _store: store,
  }
}

/**
 * Install localStorage mock globally on window.
 * Returns the mock so you can inspect calls.
 */
export function installMockLocalStorage() {
  const mock = createMockLocalStorage()
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  })
  return mock
}

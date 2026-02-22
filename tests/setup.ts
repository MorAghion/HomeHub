import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Suppress console.error for expected React errors in tests
const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const message = String(args[0])
  if (
    message.includes('Warning: ReactDOM.render') ||
    message.includes('Warning: An update to') ||
    message.includes('act(')
  ) {
    return
  }
  originalConsoleError(...args)
}

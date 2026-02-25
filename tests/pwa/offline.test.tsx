/**
 * qa-013: Offline page component tests
 *
 * TDD phase — these tests WILL FAIL until be-002 is merged.
 * Once be-002 lands on master and src/pages/Offline.tsx exists, all should pass.
 */

import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { render, screen } from '@testing-library/react'

const ROOT = path.resolve(process.cwd())
const OFFLINE_PAGE_PATH = path.join(ROOT, 'src', 'pages', 'Offline.tsx')

// ---------------------------------------------------------------------------
// File existence
// ---------------------------------------------------------------------------
describe('src/pages/Offline.tsx', () => {
  it('exists', () => {
    expect(
      fs.existsSync(OFFLINE_PAGE_PATH),
      `Offline.tsx not found at ${OFFLINE_PAGE_PATH}`,
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Component behaviour (only runs if file exists, otherwise it would throw)
// ---------------------------------------------------------------------------
describe('Offline component', () => {
  // Dynamic import: if the file doesn't exist these tests will fail at import
  // time, which is the expected TDD red state.
  let Offline: React.ComponentType

  beforeAll(async () => {
    const mod = await import('../../src/pages/Offline')
    Offline = mod.default ?? (mod as unknown as { Offline: React.ComponentType }).Offline
  })

  it('renders without crashing', () => {
    expect(() => render(<Offline />)).not.toThrow()
  })

  it('displays a user-friendly offline message', () => {
    render(<Offline />)
    // Accept any element containing words like "offline", "no internet",
    // "connection", or "connect" (case-insensitive) — be-002 picks exact wording.
    const body = document.body.textContent ?? ''
    const hasOfflineText = /offline|no internet|connection|connect/i.test(body)
    expect(hasOfflineText, `Offline page body text "${body}" contains no offline message`).toBe(true)
  })
})

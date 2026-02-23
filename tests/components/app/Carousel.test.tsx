/**
 * Regression tests for fe-bug-008:
 * Carousel doesn't light up after login (regression of fe-bug-004).
 *
 * Expected behavior: On initial render with a logged-in user, the Shopping hub
 * card is "lit" (opacity: 1, scale: 1). All other cards are dimmed
 * (opacity: 0.4, scale: 0.9).
 *
 * Root cause of fe-bug-008: After auth resolves and `user` changes, the
 * IntersectionObserver effect re-runs. If the observer callback fires with all
 * entries having intersectionRatio: 0 (no card detected as "center"), the
 * activeHub state may be incorrectly reset — causing all cards to appear dim.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '@/App'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: (_ns?: string | string[]) => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-001', email: 'test@example.com' },
    profile: {
      id: 'user-001',
      household_id: 'hh-001',
      display_name: 'Test User',
      household_owner_id: 'user-001',
    },
    session: { access_token: 'tok', user: { id: 'user-001' } },
    loading: false,
    isOwner: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    createInvite: vi.fn(),
    joinHousehold: vi.fn(),
    removeMember: vi.fn(),
    deleteHousehold: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}))

vi.mock('@/utils/supabaseShoppingService', () => ({
  ShoppingService: {
    fetchLists: vi.fn().mockResolvedValue([]),
    subscribeToListItems: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  },
}))

vi.mock('@/utils/supabaseMasterListService', () => ({
  MasterListService: {
    fetchItems: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/utils/supabaseTaskService', () => ({
  TaskService: {
    fetchAllLists: vi.fn().mockResolvedValue([]),
    subscribeToTasks: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    fetchMasterItems: vi.fn().mockResolvedValue([]),
  },
  getUrgentTasks: vi.fn().mockReturnValue([]),
}))

vi.mock('@/utils/supabaseVoucherService', () => ({
  VoucherService: {
    fetchAllLists: vi.fn().mockResolvedValue([]),
    subscribeToItems: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  },
}))

// Mock lazy-loaded components so Suspense resolves immediately
vi.mock('@/components/ShoppingList', () => ({
  default: () => <div data-testid="shopping-list" />,
}))
vi.mock('@/components/TaskList', () => ({
  default: () => <div data-testid="task-list" />,
}))
vi.mock('@/components/VoucherList', () => ({
  default: () => <div data-testid="voucher-list" />,
}))

vi.mock('@/hooks/useKeyboardHeight', () => ({
  useKeyboardHeight: () => 0,
}))

// ── IntersectionObserver mock ─────────────────────────────────────────────────

/**
 * Simulates the worst-case post-login scenario:
 * The observer fires immediately with intersectionRatio: 0 for all cards.
 * A correct implementation MUST NOT reset activeHub to an unknown value
 * when no card reports a positive intersectionRatio.
 */
function setupIntersectionObserverWithZeroRatio() {
  const observedElements: Element[] = []
  const MockIntersectionObserver = vi.fn().mockImplementation(
    (callback: IntersectionObserverCallback) => ({
      observe: (el: Element) => {
        observedElements.push(el)
        // Fire immediately with ratio 0 — no card is "winning"
        callback(
          [{ target: el, isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry],
          {} as IntersectionObserver
        )
      },
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })
  )
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  return observedElements
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fe-bug-008 — Carousel active state after login', () => {
  beforeEach(() => {
    setupIntersectionObserverWithZeroRatio()
    // Suppress Supabase channel subscription console noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the landing mode carousel when user is logged in', async () => {
    const { container } = render(<App />)

    // The landing carousel container should be present (data-hub cards)
    await waitFor(() => {
      const shoppingCard = container.querySelector('[data-hub="shopping"]')
      expect(shoppingCard).toBeInTheDocument()
    })
  })

  it('shopping hub card (first card) is "lit" on initial render — opacity:1', async () => {
    const { container } = render(<App />)

    await waitFor(() => {
      const shoppingCard = container.querySelector(
        '[data-hub="shopping"]'
      ) as HTMLElement | null
      expect(shoppingCard).toBeInTheDocument()
      // The lit card has opacity: 1 (active) — not 0.4 (dimmed)
      expect(shoppingCard?.style.opacity).toBe('1')
    })
  })

  it('tasks, vouchers, reservations cards are dimmed on initial render — opacity:0.4', async () => {
    const { container } = render(<App />)

    await waitFor(() => {
      const shoppingCard = container.querySelector('[data-hub="shopping"]')
      expect(shoppingCard).toBeInTheDocument()
    })

    const dimmedHubs = ['tasks', 'vouchers', 'reservations']
    // In the landing mode carousel, dimmed cards appear BEFORE the active-mode
    // cards. Both exist in DOM (landing vs active sections) — we check landing ones.
    const carousel = container.querySelector('.hide-scrollbar') as HTMLElement
    expect(carousel).toBeInTheDocument()

    for (const hub of dimmedHubs) {
      // querySelectorAll: first match is in the landing carousel
      const cards = carousel.querySelectorAll(`[data-hub="${hub}"]`)
      const landingCard = cards[0] as HTMLElement | undefined
      expect(landingCard, `hub card "${hub}" should be in carousel`).toBeTruthy()
      expect(
        landingCard?.style.opacity,
        `hub card "${hub}" should be dimmed (0.4) when shopping is active`
      ).toBe('0.4')
    }
  })

  it('shopping card is NOT dimmed (opacity !== 0.4) even when IntersectionObserver reports all ratio=0', async () => {
    /**
     * This is the core regression guard:
     * If the bug is present, the IntersectionObserver callback with all-zero
     * ratios causes activeHub to reset, making the shopping card lose its
     * lit state. After the fix, shopping should stay lit regardless.
     */
    const { container } = render(<App />)

    await waitFor(() => {
      const carousel = container.querySelector('.hide-scrollbar')
      const shoppingCard = carousel?.querySelector('[data-hub="shopping"]') as HTMLElement | null
      expect(shoppingCard).toBeInTheDocument()
      expect(shoppingCard?.style.opacity).not.toBe('0.4')
    })
  })

  it('shopping card has scale(1) transform (active state) on initial render', async () => {
    const { container } = render(<App />)

    await waitFor(() => {
      const carousel = container.querySelector('.hide-scrollbar')
      const shoppingCard = carousel?.querySelector('[data-hub="shopping"]') as HTMLElement | null
      expect(shoppingCard).toBeInTheDocument()
      expect(shoppingCard?.style.transform).toBe('scale(1)')
    })
  })
})

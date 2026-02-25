/**
 * qa-010 — i18n tests for AuthScreen (paired with fe-bug-017)
 *
 * TDD phase: These tests document the EXPECTED i18n behaviour.
 * AuthScreen already uses useTranslation('auth'), so most of these pass
 * immediately. They serve as regression guards ensuring the component
 * continues to render translated strings after fe-bug-017 completes.
 *
 * PHASE 1 expected: EN tests PASS. HE tests PASS (AuthScreen already wired).
 * PHASE 2 (after FE merge): all tests continue to pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import AuthScreen from '@/components/AuthScreen'
import { renderWithI18n } from '../../helpers/renderWithI18n'

// ── Mock dependencies ──────────────────────────────────────────────────────

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    user: null,
    profile: null,
    household: null,
    loading: false,
  }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

function renderEN() {
  return renderWithI18n(<AuthScreen />, { language: 'en' })
}

function renderHE() {
  return renderWithI18n(<AuthScreen />, { language: 'he' })
}

// ── English tests ──────────────────────────────────────────────────────────

describe('AuthScreen — English (en)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders tagline "Organize your home, together." in English', () => {
    renderEN()
    expect(screen.getByText('Organize your home, together.')).toBeInTheDocument()
  })

  it('renders "Sign In" tab in English', () => {
    renderEN()
    // There may be multiple "Sign In" texts (tab + button), so use getAllByText
    const elements = screen.getAllByText('Sign In')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('renders "Sign Up" tab in English', () => {
    renderEN()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('renders "Join" tab in English', () => {
    renderEN()
    expect(screen.getByText('Join')).toBeInTheDocument()
  })

  it('renders "Sign In" button inside sign-in form in English', () => {
    renderEN()
    // The submit button inside the sign-in form shows "Sign In"
    const signInButtons = screen.getAllByText('Sign In')
    expect(signInButtons.length).toBeGreaterThan(0)
  })

  it('renders "Create Account" button when Sign Up tab is active', () => {
    renderEN()
    fireEvent.click(screen.getByText('Sign Up'))
    expect(screen.getByText('Create Account')).toBeInTheDocument()
  })

  it('renders "Join Household" button when Join tab is active', () => {
    renderEN()
    fireEvent.click(screen.getByText('Join'))
    expect(screen.getByText('Join Household')).toBeInTheDocument()
  })
})

// ── Hebrew tests ──────────────────────────────────────────────────────────

describe('AuthScreen — Hebrew (he)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders Hebrew tagline "נהלו את הבית, יחד." when language is Hebrew', () => {
    renderHE()
    expect(screen.getByText('נהלו את הבית, יחד.')).toBeInTheDocument()
  })

  it('renders "כניסה" tab when language is Hebrew', () => {
    renderHE()
    const elements = screen.getAllByText('כניסה')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('renders "הרשמה" (Sign Up) tab when language is Hebrew', () => {
    renderHE()
    expect(screen.getByText('הרשמה')).toBeInTheDocument()
  })

  it('renders "הצטרף" (Join) tab when language is Hebrew', () => {
    renderHE()
    expect(screen.getByText('הצטרף')).toBeInTheDocument()
  })

  it('renders "צור חשבון" (Create Account) button in Hebrew', () => {
    renderHE()
    fireEvent.click(screen.getByText('הרשמה'))
    expect(screen.getByText('צור חשבון')).toBeInTheDocument()
  })

  it('renders "הצטרף למשק בית" (Join Household) button in Hebrew', () => {
    renderHE()
    fireEvent.click(screen.getByText('הצטרף'))
    expect(screen.getByText('הצטרף למשק בית')).toBeInTheDocument()
  })

  it('does NOT show English tagline when language is Hebrew', () => {
    renderHE()
    expect(screen.queryByText('Organize your home, together.')).not.toBeInTheDocument()
  })
})

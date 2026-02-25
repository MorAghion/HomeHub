/**
 * qa-010 — i18n tests for AddReservationModal (paired with fe-bug-017)
 *
 * TDD phase: These tests document the EXPECTED i18n behaviour.
 * AddReservationModal currently has NO useTranslation — all strings are hardcoded.
 *
 * PHASE 1 expected results:
 *   - English tests: PASS (hardcoded English matches expected EN output)
 *   - Hebrew tests:  FAIL (component ignores i18n, always shows English)
 *
 * PHASE 2 (after fe-bug-017 merges):
 *   - FE wires useTranslation('vouchers') into AddReservationModal
 *   - All tests PASS
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import AddReservationModal from '@/components/AddReservationModal'
import { createMockReservation } from '../../fixtures/vouchers'
import { renderWithI18n } from '../../helpers/renderWithI18n'

// ── Module mocks ───────────────────────────────────────────────────────────

// Mock the form hook so we don't need Supabase/Auth in tests
vi.mock('@/hooks/useVoucherForm', () => ({
  useVoucherForm: () => ({
    formData: {
      name: '', value: '', issuer: '', expiryDate: '',
      code: '', imageUrl: '', notes: '',
      eventDate: '', time: '', address: '',
    },
    setFormData: vi.fn(),
    smartPaste: '',
    imageSize: '',
    setImageSize: vi.fn(),
    isScraping: false,
    isScanning: false,
    isUploading: false,
    showManualFillPrompt: false,
    setShowManualFillPrompt: vi.fn(),
    extractionResults: [],
    resetForm: vi.fn(),
    populateForEdit: vi.fn(),
    handleSmartPaste: vi.fn(),
    handleImageUpload: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    household: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  listName: 'My Reservations',
  listId: 'list-res-001',
  editingItem: null,
}

function renderEN(overrides = {}) {
  return renderWithI18n(
    <AddReservationModal {...defaultProps} {...overrides} />,
    { language: 'en' }
  )
}

function renderHE(overrides = {}) {
  return renderWithI18n(
    <AddReservationModal {...defaultProps} {...overrides} />,
    { language: 'he' }
  )
}

// ── English tests ──────────────────────────────────────────────────────────

describe('AddReservationModal — English i18n', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "Add Reservation" title in English when not editing', () => {
    renderEN()
    expect(screen.getByText('Add Reservation')).toBeInTheDocument()
  })

  it('renders "Edit Reservation" title in English when editing', () => {
    const editingItem = createMockReservation({ name: 'Taizu Dinner' })
    renderEN({ editingItem })
    expect(screen.getByText('Edit Reservation')).toBeInTheDocument()
  })

  it('renders "Event Date" label in English', () => {
    renderEN()
    expect(screen.getByText('Event Date')).toBeInTheDocument()
  })

  it('renders "Address / Location" label in English', () => {
    renderEN()
    expect(screen.getByText('Address / Location')).toBeInTheDocument()
  })

  it('renders "Cancel" button in English', () => {
    renderEN()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('renders "Add" submit button in English when not editing', () => {
    renderEN()
    expect(screen.getByText('Add')).toBeInTheDocument()
  })

  it('renders "Update" submit button in English when editing', () => {
    const editingItem = createMockReservation({ name: 'Taizu Dinner' })
    renderEN({ editingItem })
    expect(screen.getByText('Update')).toBeInTheDocument()
  })
})

// ── Hebrew tests ───────────────────────────────────────────────────────────
// These tests FAIL in PHASE 1 (component not wired to i18n).
// They PASS in PHASE 2 after fe-bug-017 merges.

describe('AddReservationModal — Hebrew i18n (TDD: fails until fe-bug-017 merges)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders "הוסף הזמנה" title in Hebrew when not editing', () => {
    renderHE()
    expect(screen.getByText('הוסף הזמנה')).toBeInTheDocument()
    expect(screen.queryByText('Add Reservation')).not.toBeInTheDocument()
  })

  it('renders "ערוך הזמנה" title in Hebrew when editing', () => {
    const editingItem = createMockReservation({ name: 'Taizu Dinner' })
    renderHE({ editingItem })
    expect(screen.getByText('ערוך הזמנה')).toBeInTheDocument()
    expect(screen.queryByText('Edit Reservation')).not.toBeInTheDocument()
  })

  it('renders "תאריך האירוע" (Event Date) label in Hebrew', () => {
    renderHE()
    expect(screen.getByText('תאריך האירוע')).toBeInTheDocument()
    expect(screen.queryByText('Event Date')).not.toBeInTheDocument()
  })

  it('renders "כתובת / מיקום" (Address / Location) label in Hebrew', () => {
    renderHE()
    expect(screen.getByText('כתובת / מיקום')).toBeInTheDocument()
    expect(screen.queryByText('Address / Location')).not.toBeInTheDocument()
  })

  it('renders "ביטול" (Cancel) button in Hebrew', () => {
    renderHE()
    expect(screen.getByText('ביטול')).toBeInTheDocument()
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
  })

  it('renders "הוסף" (Add) submit button in Hebrew when not editing', () => {
    renderHE()
    expect(screen.getByText('הוסף')).toBeInTheDocument()
    expect(screen.queryByText('Add')).not.toBeInTheDocument()
  })

  it('renders "עדכן" (Update) submit button in Hebrew when editing', () => {
    const editingItem = createMockReservation({ name: 'Taizu Dinner' })
    renderHE({ editingItem })
    expect(screen.getByText('עדכן')).toBeInTheDocument()
    expect(screen.queryByText('Update')).not.toBeInTheDocument()
  })
})

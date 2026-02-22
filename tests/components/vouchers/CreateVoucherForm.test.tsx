/**
 * VoucherList form tests — voucher item type
 * Tests: add form opens/submits/validates, edit pre-fills, cancel resets, delete confirmation
 *
 * The create/edit form lives inside VoucherList (not a separate component).
 * We render VoucherList with a voucher-type list to drive voucher form tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VoucherList from '@/components/VoucherList'
import { createMockVoucher } from '../../fixtures/vouchers'
import type { VoucherItem } from '@/types/base'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _opts?: Record<string, unknown>) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}))

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'mock/path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.url' } }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://mock.signed.url' }, error: null }),
      }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    removeChannel: vi.fn(),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: 'mock-user-id', household_id: 'mock-household-id' },
  }),
}))

vi.mock('@/utils/voucherMemory', () => ({
  VOUCHER_TEMPLATES: [
    { id: 'buyme', name: 'BuyMe', defaultType: 'voucher' },
    { id: 'ontopo', name: 'Ontopo', defaultType: 'reservation' },
  ],
}))

vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onClose }: {
    isOpen: boolean
    onConfirm: () => void
    onClose: () => void
  }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onClose}>Cancel Delete</button>
      </div>
    ) : null,
}))

// ── Default props ─────────────────────────────────────────────────────────────

const defaultProps = {
  listName: 'BuyMe Cards',
  listId: 'vouchers_buyme',   // buyme → defaultType: voucher
  vouchers: [] as VoucherItem[],
  onUpdateVouchers: vi.fn(),
  onBack: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Suppress console.log noise from VoucherList component
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

// ── Helper: open the Add modal ────────────────────────────────────────────────
const openAddModal = () => {
  // There may be multiple "addVoucher" buttons (header + empty state)
  const buttons = screen.getAllByText('addVoucher')
  fireEvent.click(buttons[0])
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateVoucherForm — voucher type', () => {
  it('renders the list name in the header', () => {
    render(<VoucherList {...defaultProps} />)
    expect(screen.getByText('BuyMe Cards')).toBeInTheDocument()
  })

  it('shows empty state when no vouchers', () => {
    render(<VoucherList {...defaultProps} />)
    expect(screen.getByText('noVouchersYet')).toBeInTheDocument()
  })

  it('opens the add modal when "Add Voucher" button is clicked', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    // Modal heading includes the i18n key "addVoucher"
    expect(screen.getAllByText('addVoucher').length).toBeGreaterThan(1)
    // Name input is visible
    expect(screen.getByPlaceholderText('e.g., Azrieli Gift Card')).toBeInTheDocument()
  })

  it('shows voucher-specific fields (value, issuer, expiry) for voucher lists', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    expect(screen.getByPlaceholderText('e.g., ₪200 or 2 Movie Tickets')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g., BuyMe, Azrieli')).toBeInTheDocument()
    // Expiry date input
    const dateInputs = screen.getAllByDisplayValue('')
    const dateInput = dateInputs.find((el) => (el as HTMLInputElement).type === 'date')
    expect(dateInput).toBeInTheDocument()
  })

  it('does NOT show reservation-specific fields for voucher lists', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    expect(screen.queryByPlaceholderText('e.g., 123 Main St, Tel Aviv')).not.toBeInTheDocument()
  })

  it('calls onUpdateVouchers with a new voucher when form is submitted', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()

    fireEvent.change(screen.getByPlaceholderText('e.g., Azrieli Gift Card'), {
      target: { value: 'Test Voucher' },
    })

    fireEvent.submit(screen.getByPlaceholderText('e.g., Azrieli Gift Card').closest('form')!)

    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledOnce()
    const [updatedVouchers] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(updatedVouchers).toHaveLength(1)
    expect(updatedVouchers[0].name).toBe('Test Voucher')
    expect(updatedVouchers[0].itemType).toBe('voucher')
  })

  it('does not submit if name is empty', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    // Name input left blank — form has `required` on the name input so
    // HTML5 validation prevents submit, but we can also test via handleAddVoucher guard
    const nameInput = screen.getByPlaceholderText('e.g., Azrieli Gift Card')
    expect((nameInput as HTMLInputElement).required).toBe(true)
  })

  it('includes value and issuer in the new voucher when filled', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()

    fireEvent.change(screen.getByPlaceholderText('e.g., Azrieli Gift Card'), {
      target: { value: 'Cinema Tickets' },
    })
    fireEvent.change(screen.getByPlaceholderText('e.g., ₪200 or 2 Movie Tickets'), {
      target: { value: '2 tickets' },
    })
    fireEvent.change(screen.getByPlaceholderText('e.g., BuyMe, Azrieli'), {
      target: { value: 'BuyMe' },
    })

    fireEvent.submit(screen.getByPlaceholderText('e.g., Azrieli Gift Card').closest('form')!)

    const [vouchers] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(vouchers[0].value).toBe('2 tickets')
    expect(vouchers[0].issuer).toBe('BuyMe')
  })

  it('closes the modal and does not submit when Cancel is clicked', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onUpdateVouchers).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('e.g., Azrieli Gift Card')).not.toBeInTheDocument()
  })

  it('closes the modal when the × button is clicked', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    fireEvent.click(screen.getByText('×'))
    expect(screen.queryByPlaceholderText('e.g., Azrieli Gift Card')).not.toBeInTheDocument()
  })

  // ── Edit existing voucher ─────────────────────────────────────────────────

  it('opens the edit modal pre-filled with the voucher data', () => {
    const voucher = createMockVoucher({ name: 'Existing Voucher', value: '₪100', issuer: 'Zara' })
    render(<VoucherList {...defaultProps} vouchers={[voucher]} />)

    // Click the edit button on the VoucherCard
    fireEvent.click(screen.getByTitle('Edit'))

    // Modal opens with pre-filled data
    expect((screen.getByPlaceholderText('e.g., Azrieli Gift Card') as HTMLInputElement).value).toBe('Existing Voucher')
    expect((screen.getByPlaceholderText('e.g., ₪200 or 2 Movie Tickets') as HTMLInputElement).value).toBe('₪100')
    expect((screen.getByPlaceholderText('e.g., BuyMe, Azrieli') as HTMLInputElement).value).toBe('Zara')
  })

  it('calls onUpdateVouchers with updated data when editing', () => {
    const voucher = createMockVoucher({ name: 'Old Name', value: '₪100' })
    render(<VoucherList {...defaultProps} vouchers={[voucher]} />)

    fireEvent.click(screen.getByTitle('Edit'))

    const nameInput = screen.getByPlaceholderText('e.g., Azrieli Gift Card')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    fireEvent.submit(nameInput.closest('form')!)

    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledOnce()
    const [result] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(result[0].name).toBe('Updated Name')
    expect(result[0].id).toBe(voucher.id)
  })

  // ── Delete confirmation ────────────────────────────────────────────────────

  it('shows confirmation modal when delete button is clicked', () => {
    const voucher = createMockVoucher()
    render(<VoucherList {...defaultProps} vouchers={[voucher]} />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('removes the voucher when deletion is confirmed', () => {
    const voucher = createMockVoucher({ name: 'To Delete' })
    render(<VoucherList {...defaultProps} vouchers={[voucher]} />)
    fireEvent.click(screen.getByTitle('Delete'))
    fireEvent.click(screen.getByText('Confirm Delete'))
    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledWith([])
  })

  it('does not remove the voucher when deletion is cancelled', () => {
    const voucher = createMockVoucher()
    render(<VoucherList {...defaultProps} vouchers={[voucher]} />)
    fireEvent.click(screen.getByTitle('Delete'))
    fireEvent.click(screen.getByText('Cancel Delete'))
    expect(defaultProps.onUpdateVouchers).not.toHaveBeenCalled()
  })

  // ── Voucher grid ───────────────────────────────────────────────────────────

  it('renders a VoucherCard for each voucher in the list', () => {
    const vouchers = [
      createMockVoucher({ name: 'Card A' }),
      createMockVoucher({ name: 'Card B' }),
      createMockVoucher({ name: 'Card C' }),
    ]
    render(<VoucherList {...defaultProps} vouchers={vouchers} />)
    expect(screen.getByText('Card A')).toBeInTheDocument()
    expect(screen.getByText('Card B')).toBeInTheDocument()
    expect(screen.getByText('Card C')).toBeInTheDocument()
  })

  it('calls onBack when the back button is clicked', () => {
    render(<VoucherList {...defaultProps} />)
    fireEvent.click(screen.getByText('←'))
    expect(defaultProps.onBack).toHaveBeenCalledOnce()
  })
})

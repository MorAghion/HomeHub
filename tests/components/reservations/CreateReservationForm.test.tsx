/**
 * VoucherList form tests — reservation item type
 * Tests: reservation-specific fields, submission, edit/cancel flows
 *
 * We render VoucherList with an ontopo list (defaultType: reservation).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VoucherList from '@/components/VoucherList'
import { createMockReservation } from '../../fixtures/vouchers'
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

// ── Default props — ontopo list forces reservation defaultType ────────────────

const defaultProps = {
  listName: 'Ontopo Reservations',
  listId: 'vouchers_ontopo',   // ontopo → defaultType: reservation
  listType: 'reservation' as const,
  vouchers: [] as VoucherItem[],
  onUpdateVouchers: vi.fn(),
  onBack: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

const openAddModal = () => {
  const buttons = screen.getAllByText('addVoucher')
  fireEvent.click(buttons[0])
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateReservationForm — reservation type', () => {
  it('shows reservation-specific fields for ontopo lists', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    // Address field is reservation-specific
    expect(screen.getByPlaceholderText('e.g., 123 Main St, Tel Aviv')).toBeInTheDocument()
    // Time input (type=time)
    const inputs = screen.getAllByDisplayValue('')
    const timeInput = inputs.find((el) => (el as HTMLInputElement).type === 'time')
    expect(timeInput).toBeInTheDocument()
    // Event date input (type=date)
    const dateInput = inputs.find((el) => (el as HTMLInputElement).type === 'date')
    expect(dateInput).toBeInTheDocument()
  })

  it('does NOT show voucher-specific fields for ontopo lists', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    // Voucher-only fields should not appear
    expect(screen.queryByPlaceholderText('e.g., ₪200 or 2 Movie Tickets')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('e.g., BuyMe, Azrieli')).not.toBeInTheDocument()
  })

  it('creates a reservation item when form is submitted', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()

    fireEvent.change(screen.getByPlaceholderText('e.g., Dinner at Taizu'), {
      target: { value: 'Restaurant Taizu' },
    })
    fireEvent.change(screen.getByPlaceholderText('e.g., 123 Main St, Tel Aviv'), {
      target: { value: '23 Menachem Begin St' },
    })

    fireEvent.submit(
      screen.getByPlaceholderText('e.g., Dinner at Taizu').closest('form')!
    )

    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledOnce()
    const [vouchers] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(vouchers).toHaveLength(1)
    expect(vouchers[0].itemType).toBe('reservation')
    expect(vouchers[0].name).toBe('Restaurant Taizu')
    expect(vouchers[0].address).toBe('23 Menachem Begin St')
  })

  it('includes eventDate and time when provided', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()

    fireEvent.change(screen.getByPlaceholderText('e.g., Dinner at Taizu'), {
      target: { value: 'Dinner' },
    })

    // Set event date
    const inputs = screen.getAllByDisplayValue('')
    const dateInput = inputs.find((el) => (el as HTMLInputElement).type === 'date')!
    fireEvent.change(dateInput, { target: { value: '2026-03-15' } })

    // Set time
    const timeInput = inputs.find((el) => (el as HTMLInputElement).type === 'time')!
    fireEvent.change(timeInput, { target: { value: '20:00' } })

    fireEvent.submit(
      screen.getByPlaceholderText('e.g., Dinner at Taizu').closest('form')!
    )

    const [vouchers] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(vouchers[0].eventDate).toBe('2026-03-15')
    expect(vouchers[0].time).toBe('20:00')
  })

  it('requires name — input has required attribute', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    const nameInput = screen.getByPlaceholderText('e.g., Dinner at Taizu')
    expect((nameInput as HTMLInputElement).required).toBe(true)
  })

  it('closes the modal without submitting when Cancel is clicked', () => {
    render(<VoucherList {...defaultProps} />)
    openAddModal()
    fireEvent.click(screen.getByText('Cancel'))
    expect(defaultProps.onUpdateVouchers).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText('e.g., Dinner at Taizu')).not.toBeInTheDocument()
  })

  // ── Edit existing reservation ─────────────────────────────────────────────

  it('pre-fills the edit modal with existing reservation data', () => {
    const res = createMockReservation({
      name: 'Existing Reservation',
      address: '5 Rothschild Blvd',
      time: '19:00',
    })
    render(<VoucherList {...defaultProps} vouchers={[res]} />)
    fireEvent.click(screen.getByTitle('Edit'))

    expect(
      (screen.getByPlaceholderText('e.g., Dinner at Taizu') as HTMLInputElement).value
    ).toBe('Existing Reservation')
    expect(
      (screen.getByPlaceholderText('e.g., 123 Main St, Tel Aviv') as HTMLInputElement).value
    ).toBe('5 Rothschild Blvd')
    // Time should be pre-filled
    const inputs = document.querySelectorAll('input[type="time"]')
    expect((inputs[0] as HTMLInputElement).value).toBe('19:00')
  })

  it('calls onUpdateVouchers with updated reservation data on edit submit', () => {
    const res = createMockReservation({ name: 'Old Reservation' })
    render(<VoucherList {...defaultProps} vouchers={[res]} />)

    fireEvent.click(screen.getByTitle('Edit'))
    fireEvent.change(screen.getByPlaceholderText('e.g., Dinner at Taizu'), {
      target: { value: 'New Reservation Name' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('e.g., Dinner at Taizu').closest('form')!
    )

    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledOnce()
    const [result] = defaultProps.onUpdateVouchers.mock.calls[0]
    expect(result[0].name).toBe('New Reservation Name')
    expect(result[0].id).toBe(res.id)
    expect(result[0].itemType).toBe('reservation')
  })

  // ── Delete confirmation ────────────────────────────────────────────────────

  it('shows confirmation modal when delete button is clicked', () => {
    const res = createMockReservation()
    render(<VoucherList {...defaultProps} vouchers={[res]} />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument()
  })

  it('removes the reservation when deletion is confirmed', () => {
    const res = createMockReservation()
    render(<VoucherList {...defaultProps} vouchers={[res]} />)
    fireEvent.click(screen.getByTitle('Delete'))
    fireEvent.click(screen.getByText('Confirm Delete'))
    expect(defaultProps.onUpdateVouchers).toHaveBeenCalledWith([])
  })

  // ── Multiple reservations ──────────────────────────────────────────────────

  it('renders all reservation cards in the grid', () => {
    const reservations = [
      createMockReservation({ name: 'Reservation A' }),
      createMockReservation({ name: 'Reservation B' }),
    ]
    render(<VoucherList {...defaultProps} vouchers={reservations} />)
    expect(screen.getByText('Reservation A')).toBeInTheDocument()
    expect(screen.getByText('Reservation B')).toBeInTheDocument()
  })
})

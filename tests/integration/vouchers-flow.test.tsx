/**
 * Integration test: full voucher CRUD flow
 * Create → appears in grid → edit → delete
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import VoucherList from '@/components/VoucherList'
import type { VoucherItem } from '@/types/base'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
    profile: { id: 'test-user', household_id: 'test-household' },
  }),
}))

vi.mock('@/utils/voucherMemory', () => ({
  VOUCHER_TEMPLATES: [
    { id: 'buyme', name: 'BuyMe', defaultType: 'voucher' },
    { id: 'ontopo', name: 'Ontopo', defaultType: 'reservation' },
  ],
}))

vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) =>
    isOpen ? <button onClick={onConfirm}>Confirm Delete</button> : null,
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

// ── Stateful wrapper — simulates real React state ─────────────────────────────

function VoucherListWrapper({
  initialVouchers = [] as VoucherItem[],
  listId = 'vouchers_buyme',
  listName = 'My Vouchers',
  listType = 'voucher' as 'voucher' | 'reservation',
}) {
  const [vouchers, setVouchers] = useState<VoucherItem[]>(initialVouchers)
  return (
    <VoucherList
      listName={listName}
      listId={listId}
      listType={listType}
      vouchers={vouchers}
      onUpdateVouchers={setVouchers}
      onBack={vi.fn()}
    />
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Vouchers integration — full CRUD flow', () => {
  it('create → voucher appears in grid, empty state disappears', () => {
    render(<VoucherListWrapper />)

    expect(screen.getByText('noVouchersYet')).toBeInTheDocument()

    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderVoucher'), {
      target: { value: 'BuyMe Gift Card' },
    })
    fireEvent.change(screen.getByPlaceholderText('voucherValuePlaceholder'), {
      target: { value: '₪150' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderVoucher').closest('form')!
    )

    expect(screen.getByText('BuyMe Gift Card')).toBeInTheDocument()
    expect(screen.getByText('₪150')).toBeInTheDocument()
    expect(screen.queryByText('noVouchersYet')).not.toBeInTheDocument()
  })

  it('create → edit → verify updated name', () => {
    render(<VoucherListWrapper />)

    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderVoucher'), {
      target: { value: 'Original Name' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderVoucher').closest('form')!
    )

    expect(screen.getByText('Original Name')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('edit'))
    const nameInput = screen.getByPlaceholderText('namePlaceholderVoucher')
    fireEvent.change(nameInput, { target: { value: 'Edited Name' } })
    fireEvent.submit(nameInput.closest('form')!)

    expect(screen.getByText('Edited Name')).toBeInTheDocument()
    expect(screen.queryByText('Original Name')).not.toBeInTheDocument()
  })

  it('create → delete → empty state returns', () => {
    render(<VoucherListWrapper />)

    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderVoucher'), {
      target: { value: 'Voucher To Delete' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderVoucher').closest('form')!
    )

    expect(screen.getByText('Voucher To Delete')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('delete'))
    fireEvent.click(screen.getByText('Confirm Delete'))

    expect(screen.queryByText('Voucher To Delete')).not.toBeInTheDocument()
    expect(screen.getByText('noVouchersYet')).toBeInTheDocument()
  })

  it('delete one voucher without affecting others', () => {
    render(<VoucherListWrapper />)

    // Create first
    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderVoucher'), {
      target: { value: 'Keep Me' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderVoucher').closest('form')!
    )

    // Create second
    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderVoucher'), {
      target: { value: 'Delete Me' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderVoucher').closest('form')!
    )

    expect(screen.getByText('Keep Me')).toBeInTheDocument()
    expect(screen.getByText('Delete Me')).toBeInTheDocument()

    // Delete only the second card
    const deleteButtons = screen.getAllByTitle('delete')
    fireEvent.click(deleteButtons[1])
    fireEvent.click(screen.getByText('Confirm Delete'))

    expect(screen.getByText('Keep Me')).toBeInTheDocument()
    expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
  })

  it('reservation flow — creates reservation in ontopo list', () => {
    render(<VoucherListWrapper listId="vouchers_ontopo" listName="Ontopo" listType="reservation" />)

    fireEvent.click(screen.getAllByText('addVoucher')[0])
    fireEvent.change(screen.getByPlaceholderText('namePlaceholderReservation'), {
      target: { value: 'Restaurant Test' },
    })
    fireEvent.change(screen.getByPlaceholderText('addressPlaceholder'), {
      target: { value: '5 HaYarkon St' },
    })
    fireEvent.submit(
      screen.getByPlaceholderText('namePlaceholderReservation').closest('form')!
    )

    expect(screen.getByText('Restaurant Test')).toBeInTheDocument()
    expect(screen.getByText('5 HaYarkon St')).toBeInTheDocument()
    expect(screen.getByText('reservationBadge')).toBeInTheDocument()
  })
})

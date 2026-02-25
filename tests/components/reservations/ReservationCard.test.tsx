/**
 * VoucherCard component tests — reservation type
 * Tests: render, event date, address display, callbacks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VoucherCard from '@/components/VoucherCard'
import { createMockReservation } from '../../fixtures/vouchers'

vi.mock('react-i18next', async () => {
  const { default: i18n } = await import('@/i18n/config')
  return {
    useTranslation: (ns?: string | string[]) => ({
      t: (key: string, opts?: Record<string, unknown>) => {
        const defaultNs = Array.isArray(ns) ? ns[0] : (ns ?? 'common')
        return i18n.t(key, { ns: defaultNs, ...(opts ?? {}) } as never) as string
      },
      i18n,
    }),
    initReactI18next: { type: '3rdParty', init: () => {} },
  }
})

const FIXED_DATE = new Date('2026-02-22T12:00:00.000Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('VoucherCard — reservation type', () => {
  it('renders the reservation name', () => {
    const res = createMockReservation({ name: 'Restaurant Taizu' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Restaurant Taizu')).toBeInTheDocument()
  })

  it('renders "📅 Reservation" type label', () => {
    const res = createMockReservation()
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('📅 Reservation')).toBeInTheDocument()
  })

  it('does NOT show issuer label for reservations', () => {
    const res = createMockReservation()
    render(<VoucherCard voucher={res} />)
    // Reservations don't have an issuer field shown
    expect(screen.queryByText('BUYME')).not.toBeInTheDocument()
  })

  it('does NOT render an expiry badge for reservations', () => {
    const res = createMockReservation({ eventDate: '2026-01-01' }) // past date
    render(<VoucherCard voucher={res} />)
    // No expiry badge (that's voucher-only)
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
  })

  // ── Event date display ──────────────────────────────────────────────────────

  it('shows "Today" for an event happening today', () => {
    const res = createMockReservation({ eventDate: '2026-02-22', time: '19:30' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Today at 19:30')).toBeInTheDocument()
  })

  it('shows "Tomorrow" for an event happening tomorrow', () => {
    const res = createMockReservation({ eventDate: '2026-02-23', time: '20:00' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Tomorrow at 20:00')).toBeInTheDocument()
  })

  it('shows formatted date for a future event', () => {
    const res = createMockReservation({ eventDate: '2026-03-15', time: '20:00' })
    render(<VoucherCard voucher={res} />)
    // Shows "Mar 15 at 20:00"
    expect(screen.getByText(/Mar 15/)).toBeInTheDocument()
    expect(screen.getByText(/20:00/)).toBeInTheDocument()
  })

  it('shows event date without time when time is not provided', () => {
    const res = createMockReservation({ eventDate: '2026-03-15', time: undefined })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText(/Mar 15/)).toBeInTheDocument()
    // No " at HH:MM" time suffix in the event date text
    expect(screen.queryByText(/Mar 15 at/)).not.toBeInTheDocument()
  })

  it('renders nothing for event date section when eventDate is not provided', () => {
    const res = createMockReservation({ eventDate: undefined })
    render(<VoucherCard voucher={res} />)
    // Should not crash, just no date shown
    expect(screen.getByText('Restaurant Taizu')).toBeInTheDocument()
  })

  // ── Address display ─────────────────────────────────────────────────────────

  it('renders address when provided', () => {
    const res = createMockReservation({ address: '23 Menachem Begin St, Tel Aviv' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('23 Menachem Begin St, Tel Aviv')).toBeInTheDocument()
  })

  it('does not render address section when address is undefined', () => {
    const res = createMockReservation({ address: undefined })
    render(<VoucherCard voucher={res} />)
    expect(screen.queryByText('Tel Aviv')).not.toBeInTheDocument()
  })

  // ── CRUD callbacks ──────────────────────────────────────────────────────────

  it('calls onEdit with the reservation when edit button is clicked', () => {
    const onEdit = vi.fn()
    const res = createMockReservation()
    render(<VoucherCard voucher={res} onEdit={onEdit} />)
    fireEvent.click(screen.getByTitle('Edit'))
    expect(onEdit).toHaveBeenCalledWith(res)
  })

  it('calls onDelete with reservation.id when delete button is clicked', () => {
    const onDelete = vi.fn()
    const res = createMockReservation()
    render(<VoucherCard voucher={res} onDelete={onDelete} />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(onDelete).toHaveBeenCalledWith(res.id)
  })

  // ── Code / image ────────────────────────────────────────────────────────────

  it('shows "Copy code" button for a non-URL confirmation code', () => {
    const res = createMockReservation({ code: 'RES-9876' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('shows "Open Original" for a URL reservation code', () => {
    const res = createMockReservation({ code: 'https://ontopo.com/ticket/abc123' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Open Original')).toBeInTheDocument()
  })

  it('shows "View Card" when imageUrl is provided', () => {
    const res = createMockReservation({ imageUrl: 'https://example.com/ticket.jpg' })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('View Card')).toBeInTheDocument()
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('renders correctly with only name and itemType', () => {
    const res = createMockReservation({
      name: 'Minimal Reservation',
      eventDate: undefined,
      time: undefined,
      address: undefined,
      code: undefined,
      imageUrl: undefined,
      notes: undefined,
    })
    render(<VoucherCard voucher={res} />)
    expect(screen.getByText('Minimal Reservation')).toBeInTheDocument()
    expect(screen.getByText('📅 Reservation')).toBeInTheDocument()
  })
})

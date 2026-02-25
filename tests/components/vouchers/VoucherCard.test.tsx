/**
 * VoucherCard component tests (voucher type)
 * Tests: render, CRUD callbacks, expiry display, code copy, image modal
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithI18n } from '../../helpers/renderWithI18n'
import VoucherCard from '@/components/VoucherCard'
import { createMockVoucher } from '../../fixtures/vouchers'

// Freeze time so expiry calculations are deterministic
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

describe('VoucherCard — voucher type', () => {
  it('renders the voucher name', () => {
    const voucher = createMockVoucher({ name: 'Amazon Gift Card' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Amazon Gift Card')).toBeInTheDocument()
  })

  it('renders issuer label when provided', () => {
    const voucher = createMockVoucher({ issuer: 'BuyMe' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('BuyMe')).toBeInTheDocument()
  })

  it('renders monetary value when provided', () => {
    const voucher = createMockVoucher({ value: '₪200' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('₪200')).toBeInTheDocument()
  })

  it('does not render value section when value is undefined', () => {
    const voucher = createMockVoucher({ value: undefined })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    // No bold value paragraph
    const valueEl = screen.queryByText(/₪/)
    expect(valueEl).not.toBeInTheDocument()
  })

  // ── Expiry states ───────────────────────────────────────────────────────────

  it('shows "Expired" for past expiry date', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-01-01' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('shows "Expires Today" for today\'s expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-22' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Expires Today')).toBeInTheDocument()
  })

  it('shows "X days left" for expiry within 7 days', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-25' }) // 3 days away
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('3 days left')).toBeInTheDocument()
  })

  it('shows "X days left" for expiry within 30 days', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-03-15' }) // 21 days away
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('21 days left')).toBeInTheDocument()
  })

  it('shows formatted future expiry date for expiry > 30 days', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-12-31' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText(/Expires/)).toBeInTheDocument()
    expect(screen.getByText(/Dec/)).toBeInTheDocument()
  })

  it('does not show expiry badge when expiryDate is undefined', () => {
    const voucher = createMockVoucher({ expiryDate: undefined })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
    expect(screen.queryByText('Expires Today')).not.toBeInTheDocument()
  })

  // ── CRUD callbacks ──────────────────────────────────────────────────────────

  it('calls onEdit with voucher when edit button is clicked', () => {
    const onEdit = vi.fn()
    const voucher = createMockVoucher()
    renderWithI18n(<VoucherCard voucher={voucher} onEdit={onEdit} />)
    fireEvent.click(screen.getByTitle('Edit'))
    expect(onEdit).toHaveBeenCalledOnce()
    expect(onEdit).toHaveBeenCalledWith(voucher)
  })

  it('calls onDelete with voucher.id when delete button is clicked', () => {
    const onDelete = vi.fn()
    const voucher = createMockVoucher()
    renderWithI18n(<VoucherCard voucher={voucher} onDelete={onDelete} />)
    fireEvent.click(screen.getByTitle('Delete'))
    expect(onDelete).toHaveBeenCalledOnce()
    expect(onDelete).toHaveBeenCalledWith(voucher.id)
  })

  it('does not throw when onEdit / onDelete are not provided', () => {
    const voucher = createMockVoucher()
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(() => {
      fireEvent.click(screen.getByTitle('Edit'))
      fireEvent.click(screen.getByTitle('Delete'))
    }).not.toThrow()
  })

  // ── Copy code ───────────────────────────────────────────────────────────────

  it('shows "Copy code" button for non-URL codes', () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('copies code to clipboard when "Copy code" is clicked', async () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    fireEvent.click(screen.getByText('Copy code'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GIFT-1234')
  })

  it('shows "Copied!" feedback after copying', async () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    fireEvent.click(screen.getByText('Copy code'))
    expect(screen.getByText('Copied!')).toBeInTheDocument()
    // After 2s the label reverts
    act(() => { vi.advanceTimersByTime(2100) })
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('shows "Copy Codes" label when code contains multiple codes', () => {
    const voucher = createMockVoucher({ code: '12345 / 67890' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Copy Codes')).toBeInTheDocument()
  })

  it('shows "Open Original" for URL codes instead of Copy code', () => {
    const voucher = createMockVoucher({ code: 'https://buyme.co.il/gift/12345' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Open Original')).toBeInTheDocument()
    expect(screen.queryByText('Copy code')).not.toBeInTheDocument()
  })

  it('does not show any code button when code is undefined', () => {
    const voucher = createMockVoucher({ code: undefined })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.queryByText('Copy code')).not.toBeInTheDocument()
    expect(screen.queryByText('Open Original')).not.toBeInTheDocument()
  })

  // ── Image support ───────────────────────────────────────────────────────────

  it('shows "View Card" button when imageUrl is provided', () => {
    const voucher = createMockVoucher({ imageUrl: 'https://example.com/card.jpg' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('View Card')).toBeInTheDocument()
  })

  it('does not show "View Card" button when imageUrl is undefined', () => {
    const voucher = createMockVoucher({ imageUrl: undefined })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.queryByText('View Card')).not.toBeInTheDocument()
  })

  it('opens image modal when "View Card" is clicked', () => {
    const voucher = createMockVoucher({ imageUrl: 'https://example.com/card.jpg' })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    fireEvent.click(screen.getByText('View Card'))
    // The image should be in the DOM
    const img = screen.getByRole('img', { name: voucher.name })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/card.jpg')
  })

  it('closes image modal when backdrop is clicked', () => {
    const voucher = createMockVoucher({ imageUrl: 'https://example.com/card.jpg' })
    const { container } = renderWithI18n(<VoucherCard voucher={voucher} />)
    fireEvent.click(screen.getByText('View Card'))
    // Modal is open — click the backdrop (fixed inset-0 bg-black/80)
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/80')
    expect(backdrop).toBeInTheDocument()
    fireEvent.click(backdrop!)
    expect(screen.queryByRole('img', { name: voucher.name })).not.toBeInTheDocument()
  })

  // ── Edge cases ──────────────────────────────────────────────────────────────

  it('renders with minimal props (only required fields)', () => {
    const voucher = createMockVoucher({
      name: 'Minimal Voucher',
      value: undefined,
      issuer: undefined,
      expiryDate: undefined,
      code: undefined,
      imageUrl: undefined,
      notes: undefined,
    })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText('Minimal Voucher')).toBeInTheDocument()
  })

  it('renders a very long voucher name without crashing', () => {
    const longName = 'A'.repeat(100)
    const voucher = createMockVoucher({ name: longName })
    renderWithI18n(<VoucherCard voucher={voucher} />)
    expect(screen.getByText(longName)).toBeInTheDocument()
  })
})

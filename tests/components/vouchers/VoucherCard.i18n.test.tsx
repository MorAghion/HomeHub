/**
 * qa-010 — i18n tests for VoucherCard (paired with fe-bug-017)
 *
 * TDD phase: These tests document the EXPECTED i18n behaviour.
 * VoucherCard currently has NO useTranslation — all strings are hardcoded.
 *
 * PHASE 1 expected results:
 *   - English tests: PASS (hardcoded English matches expected EN output)
 *   - Hebrew tests:  FAIL (component ignores i18n, always shows English)
 *
 * PHASE 2 (after fe-bug-017 merges):
 *   - FE wires useTranslation('vouchers') into VoucherCard
 *   - All tests PASS
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import VoucherCard from '@/components/VoucherCard'
import { createMockVoucher, createMockReservation } from '../../fixtures/vouchers'
import { renderWithI18n } from '../../helpers/renderWithI18n'

// Freeze time so expiry calculations are deterministic (matches VoucherCard.test.tsx)
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

// ── English tests ──────────────────────────────────────────────────────────

describe('VoucherCard — English i18n', () => {
  it('renders "Expired" badge in English for past expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-01-01' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('renders "Expires Today" badge in English for today\'s expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-22' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('Expires Today')).toBeInTheDocument()
  })

  it('renders "3 days left" badge in English for 3-day expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-25' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('3 days left')).toBeInTheDocument()
  })

  it('renders "Copy code" button in English for non-URL code', () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    // en/vouchers.json: "copyCode": "Copy code" (lowercase c)
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('renders "Copy Codes" button in English for multi-code voucher', () => {
    const voucher = createMockVoucher({ code: '12345 / 67890' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('Copy Codes')).toBeInTheDocument()
  })

  it('renders "Copied!" feedback in English after copying', () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    // en/vouchers.json: "copyCode": "Copy code"
    fireEvent.click(screen.getByText('Copy code'))
    // en/vouchers.json: "copiedSuccess": "Copied!"
    expect(screen.getByText('Copied!')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2100) })
    expect(screen.getByText('Copy code')).toBeInTheDocument()
  })

  it('renders "View Card" button in English when imageUrl is provided', () => {
    const voucher = createMockVoucher({ imageUrl: 'https://example.com/card.jpg' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('View Card')).toBeInTheDocument()
  })

  it('renders "Open Original" button in English for URL code', () => {
    const voucher = createMockVoucher({ code: 'https://buyme.co.il/gift/12345' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'en' })
    expect(screen.getByText('Open Original')).toBeInTheDocument()
  })
})

// ── Hebrew tests ───────────────────────────────────────────────────────────
// These tests FAIL in PHASE 1 (component not wired to i18n).
// They PASS in PHASE 2 after fe-bug-017 merges.

describe('VoucherCard — Hebrew i18n (TDD: fails until fe-bug-017 merges)', () => {
  it('renders "פג תוקף" badge in Hebrew for past expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-01-01' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('פג תוקף')).toBeInTheDocument()
  })

  it('renders "פג תוקף היום" badge in Hebrew for today\'s expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-22' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('פג תוקף היום')).toBeInTheDocument()
  })

  it('renders "3 ימים נותרו" badge in Hebrew for 3-day expiry', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-02-25' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('3 ימים נותרו')).toBeInTheDocument()
  })

  it('renders Hebrew "העתק קוד" instead of "Copy Code"', () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('העתק קוד')).toBeInTheDocument()
    expect(screen.queryByText('Copy Code')).not.toBeInTheDocument()
  })

  it('renders Hebrew "העתק קודים" instead of "Copy Codes"', () => {
    const voucher = createMockVoucher({ code: '12345 / 67890' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('העתק קודים')).toBeInTheDocument()
    expect(screen.queryByText('Copy Codes')).not.toBeInTheDocument()
  })

  it('renders Hebrew "הועתק!" after copying', () => {
    const voucher = createMockVoucher({ code: 'GIFT-1234' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    fireEvent.click(screen.getByText('העתק קוד'))
    expect(screen.getByText('הועתק!')).toBeInTheDocument()
  })

  it('renders Hebrew "הצג כרטיס" instead of "View Card"', () => {
    const voucher = createMockVoucher({ imageUrl: 'https://example.com/card.jpg' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('הצג כרטיס')).toBeInTheDocument()
    expect(screen.queryByText('View Card')).not.toBeInTheDocument()
  })

  it('renders Hebrew "פתח מקור" instead of "Open Original"', () => {
    const voucher = createMockVoucher({ code: 'https://buyme.co.il/gift/12345' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.getByText('פתח מקור')).toBeInTheDocument()
    expect(screen.queryByText('Open Original')).not.toBeInTheDocument()
  })

  it('does NOT show "Expired" (English) when language is Hebrew', () => {
    const voucher = createMockVoucher({ expiryDate: '2026-01-01' })
    renderWithI18n(<VoucherCard voucher={voucher} />, { language: 'he' })
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
  })
})

// ── Reservation type badge ─────────────────────────────────────────────────

describe('VoucherCard — reservation badge i18n', () => {
  it('renders "📅 Reservation" badge text in English for reservation type', () => {
    const reservation = createMockReservation()
    renderWithI18n(<VoucherCard voucher={reservation} />, { language: 'en' })
    expect(screen.getByText('📅 Reservation')).toBeInTheDocument()
  })

  it('renders "📅 הזמנה" badge text in Hebrew for reservation type', () => {
    const reservation = createMockReservation()
    renderWithI18n(<VoucherCard voucher={reservation} />, { language: 'he' })
    expect(screen.getByText('📅 הזמנה')).toBeInTheDocument()
  })
})

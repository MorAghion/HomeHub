import type { Voucher, Reservation } from '@/types/base'

let counter = 0
const nextId = () => `mock-voucher-${++counter}`

export function createMockVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    id: nextId(),
    name: 'BuyMe Gift Card',
    itemType: 'voucher',
    value: '₪200',
    issuer: 'BuyMe',
    expiryDate: '2026-12-31',
    code: 'BUYME-1234',
    imageUrl: undefined,
    notes: undefined,
    ...overrides,
  }
}

export function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: nextId(),
    name: 'Restaurant Taizu',
    itemType: 'reservation',
    eventDate: '2026-03-15',
    time: '20:00',
    address: '23 Menachem Begin St, Tel Aviv',
    code: 'RES-9876',
    imageUrl: undefined,
    notes: 'Window table requested',
    ...overrides,
  }
}

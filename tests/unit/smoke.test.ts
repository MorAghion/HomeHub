import { describe, it, expect } from 'vitest'
import {
  createMockVoucher,
  createMockReservation,
  createMockTask,
  createMockShoppingItem,
  createMockBill,
  createMockUser,
  createMockHousehold,
} from '../fixtures'

describe('Vitest smoke test', () => {
  it('test runner is working', () => {
    expect(1 + 1).toBe(2)
  })

  it('createMockVoucher returns a valid Voucher', () => {
    const voucher = createMockVoucher()
    expect(voucher.itemType).toBe('voucher')
    expect(voucher.name).toBeDefined()
    expect(voucher.id).toMatch(/^mock-voucher-/)
  })

  it('createMockVoucher accepts partial overrides', () => {
    const voucher = createMockVoucher({ value: '₪500', issuer: 'Amazon' })
    expect(voucher.value).toBe('₪500')
    expect(voucher.issuer).toBe('Amazon')
    expect(voucher.itemType).toBe('voucher') // defaults preserved
  })

  it('createMockReservation returns a valid Reservation', () => {
    const res = createMockReservation()
    expect(res.itemType).toBe('reservation')
    expect(res.eventDate).toBeDefined()
  })

  it('createMockTask returns a valid Task', () => {
    const task = createMockTask({ name: 'Take out trash', urgency: 'High' })
    expect(task.name).toBe('Take out trash')
    expect(task.urgency).toBe('High')
    expect(task.status).toBe('todo') // default preserved
  })

  it('createMockShoppingItem returns a valid ShoppingItem', () => {
    const item = createMockShoppingItem({ text: 'Eggs', completed: true })
    expect(item.text).toBe('Eggs')
    expect(item.completed).toBe(true)
  })

  it('createMockBill returns a valid Bill', () => {
    const bill = createMockBill({ amount: 999, status: 'paid' })
    expect(bill.amount).toBe(999)
    expect(bill.status).toBe('paid')
    expect(bill.vendor_name).toBe('Electric Company') // default
  })

  it('createMockUser and createMockHousehold work', () => {
    const user = createMockUser({ email: 'alice@example.com' })
    const household = createMockHousehold({ name: 'Alice House' })
    expect(user.email).toBe('alice@example.com')
    expect(household.name).toBe('Alice House')
    expect(household.owner_id).toBe('mock-user-id')
  })
})

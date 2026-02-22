/** Bill fixture — mirrors the Bills data model from CLAUDE.md */
export interface Bill {
  id: string
  vendor_name: string
  amount: number
  due_date: string
  billing_period: string
  payment_link?: string
  pdf_url?: string
  status: 'unpaid' | 'paid' | 'overdue'
  household_id: string
}

let counter = 0
const nextId = () => `mock-bill-${++counter}`

export function createMockBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: nextId(),
    vendor_name: 'Electric Company',
    amount: 350,
    due_date: '2026-03-01',
    billing_period: '2026-02',
    payment_link: 'https://pay.example.com/bill/1',
    pdf_url: undefined,
    status: 'unpaid',
    household_id: 'mock-household-id',
    ...overrides,
  }
}

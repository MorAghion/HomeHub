import type { ShoppingItem, MasterListItem } from '@/types/base'

let counter = 0
const nextId = () => `mock-shopping-${++counter}`

export function createMockShoppingItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: nextId(),
    text: 'Milk',
    completed: false,
    category: 'Dairy',
    ...overrides,
  }
}

export function createMockMasterListItem(overrides: Partial<MasterListItem> = {}): MasterListItem {
  return {
    id: nextId(),
    text: 'Bread',
    category: 'Bakery',
    ...overrides,
  }
}

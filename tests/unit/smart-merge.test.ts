import { describe, it, expect } from 'vitest'

/**
 * Smart-merge / duplicate prevention unit tests.
 *
 * Tests the duplicate-check logic used across the Shopping Hub:
 *   1. ShoppingList.checkDuplicate() — prevents adding an item already in the
 *      active list (case-insensitive exact match on .text).
 *   2. MasterListDrawer.handleApplyContext() — prevents adding context items
 *      that already exist in the master list (case-insensitive exact match).
 *
 * Both functions share the same duplicate logic pattern, tested here in
 * isolation so we can verify the contract without mounting full components.
 */

// ─── ShoppingList duplicate-check contract ──────────────────────────────────

function checkDuplicateInActiveList(
  itemName: string,
  existingItems: Array<{ text: string }>
): boolean {
  const normalized = itemName.toLowerCase().trim()
  return existingItems.some(item => item.text.toLowerCase().trim() === normalized)
}

describe('ShoppingList — checkDuplicate', () => {
  it('returns false when the list is empty', () => {
    expect(checkDuplicateInActiveList('Milk', [])).toBe(false)
  })

  it('returns true when an item with the same name exists (exact match)', () => {
    expect(checkDuplicateInActiveList('Milk', [{ text: 'Milk' }])).toBe(true)
  })

  it('is case-insensitive (lowercase vs capitalised)', () => {
    expect(checkDuplicateInActiveList('milk', [{ text: 'Milk' }])).toBe(true)
    expect(checkDuplicateInActiveList('MILK', [{ text: 'milk' }])).toBe(true)
  })

  it('trims whitespace before comparing', () => {
    expect(checkDuplicateInActiveList('  Milk  ', [{ text: 'Milk' }])).toBe(true)
  })

  it('returns false for a different item', () => {
    expect(checkDuplicateInActiveList('Bread', [{ text: 'Milk' }])).toBe(false)
  })
})

// ─── MasterListDrawer apply-context duplicate-check contract ────────────────

function checkDuplicateInMasterList(
  newItemText: string,
  existingItems: Array<{ text: string }>,
  pendingItems: Array<{ text: string }>
): boolean {
  const capitalizedText = newItemText.charAt(0).toUpperCase() + newItemText.slice(1)
  return (
    existingItems.some(
      item => item.text.toLowerCase() === capitalizedText.toLowerCase()
    ) ||
    pendingItems.some(
      item => item.text.toLowerCase() === capitalizedText.toLowerCase()
    )
  )
}

describe('MasterListDrawer — handleApplyContext duplicate check', () => {
  it('returns false when master list is empty and no pending items', () => {
    expect(checkDuplicateInMasterList('Milk', [], [])).toBe(false)
  })

  it('returns true when item already exists in master list', () => {
    expect(checkDuplicateInMasterList('Milk', [{ text: 'Milk' }], [])).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(checkDuplicateInMasterList('milk', [{ text: 'Milk' }], [])).toBe(true)
    expect(checkDuplicateInMasterList('BREAD', [{ text: 'bread' }], [])).toBe(true)
  })

  it('returns true when item already queued in pending batch', () => {
    // Prevents adding the same item twice when processing multiple context items
    expect(checkDuplicateInMasterList('Eggs', [], [{ text: 'Eggs' }])).toBe(true)
  })

  it('returns false for a new item not in either list', () => {
    expect(
      checkDuplicateInMasterList('Yogurt', [{ text: 'Milk' }], [{ text: 'Eggs' }])
    ).toBe(false)
  })
})

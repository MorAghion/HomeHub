import { describe, it, expect } from 'vitest'
import {
  detectContext,
  getSuggestedContexts,
  getContextItems,
  getContextLabel,
} from '@/utils/contextMapping'

// ─── detectContext ──────────────────────────────────────────────────────────

describe('detectContext — all 12 contexts', () => {
  it('detects stock context', () => {
    expect(detectContext('Home Stock')).toBe('stock')
  })

  it('detects pharmacy context', () => {
    expect(detectContext('Pharmacy Run')).toBe('pharmacy')
  })

  it('detects camping context', () => {
    expect(detectContext('Camping Trip')).toBe('camping')
  })

  it('detects abroad context', () => {
    expect(detectContext('Trip Abroad')).toBe('abroad')
  })

  it('detects baby context', () => {
    // 'Baby Supplies' would trigger 'stock' first ('supplies' is a stock keyword).
    // Use a name that only contains baby-specific keywords.
    expect(detectContext('Baby Food')).toBe('baby')
  })

  it('detects home-renovation context', () => {
    expect(detectContext('Home Renovation Materials')).toBe('home-renovation')
  })

  it('detects baking context', () => {
    expect(detectContext('Baking Ingredients')).toBe('baking')
  })

  it('detects party context', () => {
    // 'Party Supplies' would trigger 'stock' first ('supplies' is a stock keyword).
    expect(detectContext('Birthday Party')).toBe('party')
  })

  it('detects pets context', () => {
    expect(detectContext('Pet Food Run')).toBe('pets')
  })

  it('detects gardening context', () => {
    // 'Garden Supplies' would trigger 'stock' first ('supplies' is a stock keyword).
    expect(detectContext('Gardening')).toBe('gardening')
  })

  it('detects home-decor context', () => {
    expect(detectContext('Home Decor Shopping')).toBe('home-decor')
  })

  it('detects grocery context', () => {
    expect(detectContext('Weekly Groceries')).toBe('grocery')
  })
})

describe('detectContext — edge cases', () => {
  it('returns null for unrecognized list name', () => {
    expect(detectContext('Random Stuff')).toBeNull()
  })

  it('is case-insensitive', () => {
    expect(detectContext('PHARMACY')).toBe('pharmacy')
    expect(detectContext('CAMPING')).toBe('camping')
  })

  it('stock takes priority over grocery (priority order)', () => {
    // 'stock' keyword appears before 'grocery' in the priority order
    // Both keywords are present — stock should win
    expect(detectContext('stock grocery')).toBe('stock')
  })

  it('uses word boundary matching — partial keyword does not match', () => {
    // 'stockings' should NOT match 'stock' keyword due to word boundary
    expect(detectContext('stockings list')).toBeNull()
  })

  it('handles empty string', () => {
    expect(detectContext('')).toBeNull()
  })
})

// ─── getSuggestedContexts ───────────────────────────────────────────────────

describe('getSuggestedContexts', () => {
  it('returns matching contexts for a recognized list name', () => {
    const results = getSuggestedContexts('Pharmacy Run')
    expect(results.length).toBeGreaterThan(0)
    const keys = results.map(r => r.contextKey)
    expect(keys).toContain('pharmacy')
  })

  it('returns empty array for unrecognized list name', () => {
    expect(getSuggestedContexts('Random Stuff')).toHaveLength(0)
  })

  it('each suggestion has contextKey, displayLabel, and positive itemCount', () => {
    const results = getSuggestedContexts('Camping Trip')
    expect(results.length).toBeGreaterThan(0)
    const [first] = results
    expect(first).toHaveProperty('contextKey', 'camping')
    expect(first).toHaveProperty('displayLabel')
    expect(first.itemCount).toBeGreaterThan(0)
  })

  it('returns multiple matches when list name matches several contexts', () => {
    // 'pet grocery' contains both 'pet' and 'grocery' keywords
    const results = getSuggestedContexts('pet grocery shopping')
    expect(results.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── getContextItems ────────────────────────────────────────────────────────

describe('getContextItems', () => {
  it('returns items for a valid context key', () => {
    const items = getContextItems('grocery')
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toHaveProperty('name')
    expect(items[0]).toHaveProperty('listCategory')
  })

  it('returns empty array for an invalid context key', () => {
    expect(getContextItems('nonexistent-context')).toHaveLength(0)
  })

  it('grocery items include Milk in Dairy category', () => {
    const items = getContextItems('grocery')
    const milk = items.find(i => i.name === 'Milk')
    expect(milk).toBeDefined()
    expect(milk!.listCategory).toBe('Dairy')
  })

  it('stock items include Toilet Paper in Cleaning category', () => {
    const items = getContextItems('stock')
    const tp = items.find(i => i.name === 'Toilet Paper')
    expect(tp).toBeDefined()
    expect(tp!.listCategory).toBe('Cleaning')
  })
})

// ─── getContextLabel ────────────────────────────────────────────────────────

describe('getContextLabel', () => {
  it('returns display label for a known context', () => {
    expect(getContextLabel('grocery')).toBe('Grocery List')
  })

  it('returns display label for stock context', () => {
    expect(getContextLabel('stock')).toBe('Stock Supplies')
  })

  it('returns empty string for unknown context', () => {
    expect(getContextLabel('nonexistent-context')).toBe('')
  })
})

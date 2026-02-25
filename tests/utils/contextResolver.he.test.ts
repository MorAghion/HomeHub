/**
 * qa-011 — Hebrew context suggestion keyword matching
 *
 * TDD: written before fe-bug-018 is merged.
 * Tests that FAIL now (missing keywords) are marked with a comment.
 * After fe-bug-018 merges, ALL tests must pass.
 *
 * Strategy:
 *   - Mock i18n language to 'he' so contextResolver treats Hebrew as primary.
 *   - Import getSuggestedContexts from contextResolver (the merged entrypoint).
 *   - Test that Hebrew list names trigger correct context suggestions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock i18n so contextResolver sees language = 'he'
vi.mock('@/i18n/config', () => ({
  default: { language: 'he' },
}))

import { getSuggestedContexts } from '@/utils/contextResolver'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the contextKeys present in a getSuggestedContexts result. */
function keys(name: string): string[] {
  return getSuggestedContexts(name).map(r => r.contextKey)
}

// Hebrew character range regex — used to assert display labels are Hebrew
const HEBREW_CHAR = /[\u05D0-\u05EA]/

// ─── grocery context ──────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — grocery context', () => {
  it("'קניות' returns grocery", () => {
    expect(keys('קניות')).toContain('grocery')
  })

  it("'סופרמרקט' returns grocery", () => {
    expect(keys('סופרמרקט')).toContain('grocery')
  })

  // TDD RED — 'מצרכים' is missing from CONTEXT_RECOGNITION_MAPPING_HE grocery keywords
  it("'מצרכים' returns grocery", () => {
    expect(keys('מצרכים')).toContain('grocery')
  })

  it("'קניות שבת' returns grocery (substring match on 'קניות')", () => {
    expect(keys('קניות שבת')).toContain('grocery')
  })

  it("'קניות שבועיות' returns grocery", () => {
    expect(keys('קניות שבועיות')).toContain('grocery')
  })
})

// ─── pharmacy context ─────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — pharmacy context', () => {
  it("'תרופות' returns pharmacy", () => {
    expect(keys('תרופות')).toContain('pharmacy')
  })

  it("'בית מרקחת' returns pharmacy", () => {
    expect(keys('בית מרקחת')).toContain('pharmacy')
  })
})

// ─── baby context ─────────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — baby context', () => {
  it("'תינוק' returns baby", () => {
    expect(keys('תינוק')).toContain('baby')
  })

  it("'ציוד לתינוק' returns baby", () => {
    expect(keys('ציוד לתינוק')).toContain('baby')
  })
})

// ─── camping context ──────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — camping context', () => {
  it("'קמפינג' returns camping", () => {
    expect(keys('קמפינג')).toContain('camping')
  })

  it("'טיול' returns camping", () => {
    expect(keys('טיול')).toContain('camping')
  })
})

// ─── cleaning/stock context ───────────────────────────────────────────────────

describe('getSuggestedContexts (he) — cleaning context (mapped to stock)', () => {
  // TDD RED — 'ניקיון' is missing from all Hebrew context keywords
  it("'ניקיון' returns stock (cleaning equivalent)", () => {
    expect(keys('ניקיון')).toContain('stock')
  })

  // TDD RED — 'ניקוי הבית' is missing from all Hebrew context keywords
  it("'ניקוי הבית' returns stock (cleaning equivalent)", () => {
    expect(keys('ניקוי הבית')).toContain('stock')
  })
})

// ─── pets context ─────────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — pets context', () => {
  it("'חיות מחמד' returns pets", () => {
    expect(keys('חיות מחמד')).toContain('pets')
  })

  it("'כלב' returns pets", () => {
    expect(keys('כלב')).toContain('pets')
  })
})

// ─── party context ────────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — party context', () => {
  it("'מסיבה' returns party", () => {
    expect(keys('מסיבה')).toContain('party')
  })

  it("'יום הולדת' returns party", () => {
    expect(keys('יום הולדת')).toContain('party')
  })
})

// ─── gardening context ────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — gardening context', () => {
  it("'גינה' returns gardening", () => {
    expect(keys('גינה')).toContain('gardening')
  })

  it("'גינון' returns gardening", () => {
    expect(keys('גינון')).toContain('gardening')
  })
})

// ─── no match ─────────────────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — no match', () => {
  it("'רשימה אקראית' returns empty array (no match in Hebrew or English)", () => {
    expect(getSuggestedContexts('רשימה אקראית')).toHaveLength(0)
  })
})

// ─── display labels are Hebrew ────────────────────────────────────────────────

describe('getSuggestedContexts (he) — display labels', () => {
  const testCases: [string, string][] = [
    ['קניות', 'grocery'],
    ['תרופות', 'pharmacy'],
    ['תינוק', 'baby'],
    ['קמפינג', 'camping'],
    ['חיות מחמד', 'pets'],
    ['מסיבה', 'party'],
    ['גינה', 'gardening'],
  ]

  it.each(testCases)(
    "displayLabel for '%s' (%s context) contains Hebrew characters",
    (name, _contextKey) => {
      const results = getSuggestedContexts(name)
      expect(results.length).toBeGreaterThan(0)
      const first = results[0]
      expect(HEBREW_CHAR.test(first.displayLabel)).toBe(true)
    }
  )
})

// ─── input normalization ──────────────────────────────────────────────────────

describe('getSuggestedContexts (he) — input normalization', () => {
  it("'  קניות  ' (surrounding whitespace) still returns grocery", () => {
    expect(keys('  קניות  ')).toContain('grocery')
  })

  it("'קניות שבת' (multi-word) matches grocery via 'קניות' substring", () => {
    expect(keys('קניות שבת')).toContain('grocery')
  })
})

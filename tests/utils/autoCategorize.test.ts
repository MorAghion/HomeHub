import { describe, it, expect } from 'vitest'

/**
 * qa-012: autoCategorize — Hebrew input + expanded English keywords (TDD)
 *
 * These tests are written BEFORE fe-bug-019 is merged.
 * Hebrew and expanded-English tests WILL FAIL until fe-bug-019 lands.
 *
 * Import path assumes FE extracts autoCategorize to src/utils/autoCategorize.ts.
 * If that file doesn't exist yet, ALL tests fail — this is expected TDD behaviour.
 */
import { autoCategorize } from '../../src/utils/autoCategorize'

// ---------------------------------------------------------------------------
// Hebrew — Dairy (חלב / גבינה / יוגורט / ביצים / חמאה)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Dairy', () => {
  it("'חלב' (milk) → Dairy", () => expect(autoCategorize('חלב')).toBe('Dairy'))
  it("'גבינה' (cheese) → Dairy", () => expect(autoCategorize('גבינה')).toBe('Dairy'))
  it("'יוגורט' (yogurt) → Dairy", () => expect(autoCategorize('יוגורט')).toBe('Dairy'))
  it("'ביצים' (eggs) → Dairy", () => expect(autoCategorize('ביצים')).toBe('Dairy'))
  it("'חמאה' (butter) → Dairy", () => expect(autoCategorize('חמאה')).toBe('Dairy'))
})

// ---------------------------------------------------------------------------
// Hebrew — Meat (עוף / בשר / שניצל / כבש)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Meat', () => {
  it("'עוף' (chicken) → Meat", () => expect(autoCategorize('עוף')).toBe('Meat'))
  it("'בשר' (meat) → Meat", () => expect(autoCategorize('בשר')).toBe('Meat'))
  it("'שניצל' (schnitzel) → Meat", () => expect(autoCategorize('שניצל')).toBe('Meat'))
  it("'כבש' (lamb) → Meat", () => expect(autoCategorize('כבש')).toBe('Meat'))
})

// ---------------------------------------------------------------------------
// Hebrew — Fish (סלמון / טונה / דג)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Fish', () => {
  it("'סלמון' (salmon) → Fish", () => expect(autoCategorize('סלמון')).toBe('Fish'))
  it("'טונה' (tuna) → Fish", () => expect(autoCategorize('טונה')).toBe('Fish'))
  it("'דג' (fish) → Fish", () => expect(autoCategorize('דג')).toBe('Fish'))
})

// ---------------------------------------------------------------------------
// Hebrew — Vegetables (עגבניות / גזר / בצל / פלפל)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Vegetables', () => {
  it("'עגבניות' (tomatoes) → Vegetables", () => expect(autoCategorize('עגבניות')).toBe('Vegetables'))
  it("'גזר' (carrot) → Vegetables", () => expect(autoCategorize('גזר')).toBe('Vegetables'))
  it("'בצל' (onion) → Vegetables", () => expect(autoCategorize('בצל')).toBe('Vegetables'))
  it("'פלפל' (pepper) → Vegetables", () => expect(autoCategorize('פלפל')).toBe('Vegetables'))
})

// ---------------------------------------------------------------------------
// Hebrew — Fruit (תפוח / בננה / תפוז / אבוקדו)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Fruit', () => {
  it("'תפוח' (apple) → Fruit", () => expect(autoCategorize('תפוח')).toBe('Fruit'))
  it("'בננה' (banana) → Fruit", () => expect(autoCategorize('בננה')).toBe('Fruit'))
  it("'תפוז' (orange) → Fruit", () => expect(autoCategorize('תפוז')).toBe('Fruit'))
  it("'אבוקדו' (avocado) → Fruit", () => expect(autoCategorize('אבוקדו')).toBe('Fruit'))
})

// ---------------------------------------------------------------------------
// Hebrew — Pantry (לחם / אורז / פסטה / קמח)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Pantry', () => {
  it("'לחם' (bread) → Pantry", () => expect(autoCategorize('לחם')).toBe('Pantry'))
  it("'אורז' (rice) → Pantry", () => expect(autoCategorize('אורז')).toBe('Pantry'))
  it("'פסטה' (pasta) → Pantry", () => expect(autoCategorize('פסטה')).toBe('Pantry'))
  it("'קמח' (flour) → Pantry", () => expect(autoCategorize('קמח')).toBe('Pantry'))
})

// ---------------------------------------------------------------------------
// Hebrew — Cleaning (אבקת כביסה / נייר טואלט / סבון כלים)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Cleaning', () => {
  it("'אבקת כביסה' (laundry powder) → Cleaning", () => expect(autoCategorize('אבקת כביסה')).toBe('Cleaning'))
  it("'נייר טואלט' (toilet paper) → Cleaning", () => expect(autoCategorize('נייר טואלט')).toBe('Cleaning'))
  it("'סבון כלים' (dish soap) → Cleaning", () => expect(autoCategorize('סבון כלים')).toBe('Cleaning'))
})

// ---------------------------------------------------------------------------
// Hebrew — Pharma & Hygiene (תרופה / שמפו / ויטמין)
// ---------------------------------------------------------------------------
describe('autoCategorize — Hebrew Pharma & Hygiene', () => {
  it("'תרופה' (medicine) → Pharma & Hygiene", () => expect(autoCategorize('תרופה')).toBe('Pharma & Hygiene'))
  it("'שמפו' (shampoo) → Pharma & Hygiene", () => expect(autoCategorize('שמפו')).toBe('Pharma & Hygiene'))
  it("'ויטמין' (vitamin) → Pharma & Hygiene", () => expect(autoCategorize('ויטמין')).toBe('Pharma & Hygiene'))
})

// ---------------------------------------------------------------------------
// English — previously missing keywords
// ---------------------------------------------------------------------------
describe('autoCategorize — English expanded keywords (previously missing)', () => {
  it("'almonds' → Pantry", () => expect(autoCategorize('almonds')).toBe('Pantry'))
  it("'tahini' → Pantry", () => expect(autoCategorize('tahini')).toBe('Pantry'))
  it("'oat milk' → Dairy", () => expect(autoCategorize('oat milk')).toBe('Dairy'))
  it("'almond milk' → Dairy", () => expect(autoCategorize('almond milk')).toBe('Dairy'))
  it("'granola' → Pantry", () => expect(autoCategorize('granola')).toBe('Pantry'))
  it("'shawarma' → Meat", () => expect(autoCategorize('shawarma')).toBe('Meat'))
  it("'sweet potato' → Vegetables", () => expect(autoCategorize('sweet potato')).toBe('Vegetables'))
})

// ---------------------------------------------------------------------------
// English — existing keywords must not regress
// ---------------------------------------------------------------------------
describe('autoCategorize — English existing keywords (regression)', () => {
  it("'milk' → Dairy", () => expect(autoCategorize('milk')).toBe('Dairy'))
  it("'chicken' → Meat", () => expect(autoCategorize('chicken')).toBe('Meat'))
  it("'salmon' → Fish", () => expect(autoCategorize('salmon')).toBe('Fish'))
  it("'tomato' → Vegetables", () => expect(autoCategorize('tomato')).toBe('Vegetables'))
  it("'apple' → Fruit", () => expect(autoCategorize('apple')).toBe('Fruit'))
  it("'bread' → Pantry", () => expect(autoCategorize('bread')).toBe('Pantry'))
  it("'detergent' → Cleaning", () => expect(autoCategorize('detergent')).toBe('Cleaning'))
  it("'shampoo' → Pharma & Hygiene", () => expect(autoCategorize('shampoo')).toBe('Pharma & Hygiene'))
})

// ---------------------------------------------------------------------------
// Default fallback
// ---------------------------------------------------------------------------
describe('autoCategorize — default fallback', () => {
  it("unknown input 'xyzabc123' → Other", () => expect(autoCategorize('xyzabc123')).toBe('Other'))
  it("empty string '' → Other", () => expect(autoCategorize('')).toBe('Other'))
})

// ---------------------------------------------------------------------------
// Case-insensitivity
// ---------------------------------------------------------------------------
describe('autoCategorize — case insensitivity', () => {
  it("'Milk' → Dairy", () => expect(autoCategorize('Milk')).toBe('Dairy'))
  it("'CHICKEN' → Meat", () => expect(autoCategorize('CHICKEN')).toBe('Meat'))
})

import { describe, it, expect } from 'vitest'

/**
 * Auto-categorize unit tests.
 *
 * The autoCategorize function is defined inside App.tsx and passed as a prop
 * to components. This file extracts and tests the same logic to verify the
 * item→category mapping contract. The implementation here must stay in sync
 * with App.tsx.
 *
 * Priority order: Pharma & Hygiene → Dairy → Meat → Fish → Vegetables →
 *   Fruit → Pantry → Cleaning → Other (first match wins)
 */

// Replicated from App.tsx autoCategorize — keep in sync
function autoCategorize(itemName: string): string {
  const name = itemName.toLowerCase().trim()
  const categoryMap: Record<string, string[]> = {
    'Pharma & Hygiene': [
      'toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'deodorant',
      'vitamin', 'aspirin', 'band-aid', 'sunscreen', 'razor', 'floss',
      'lotion', 'pads', 'tampons', 'soap', 'makeup', 'perfume', 'hair gel',
      'body wash', 'hand sanitizer', 'cotton swabs', 'tissues', 'baby shampoo',
      'baby wipes', 'baby lotion', 'diaper cream',
    ],
    'Dairy': [
      'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
      'cottage cheese', 'mozzarella', 'cheddar', 'ice cream', 'labneh',
      'tofu', 'ricotta', 'parmesan', 'feta', 'brie', 'gouda',
    ],
    'Meat': [
      'chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon',
      'ham', 'steak', 'ground beef', 'meatball', 'pastrami', 'salami',
      'pepperoni', 'duck', 'veal',
    ],
    'Fish': [
      'salmon', 'tuna', 'cod', 'shrimp', 'fish', 'tilapia', 'crab',
      'lobster', 'sardine', 'anchovy', 'trout', 'halibut', 'mussels',
      'clams', 'scallops', 'oyster',
    ],
    'Vegetables': [
      'tomato', 'lettuce', 'carrot', 'onion', 'potato', 'broccoli',
      'cucumber', 'pepper', 'spinach', 'celery', 'garlic', 'cabbage',
      'zucchini', 'eggplant', 'mushroom', 'kale', 'arugula', 'beet',
      'radish', 'asparagus', 'cauliflower', 'corn', 'peas', 'beans',
      'leek', 'squash',
    ],
    'Fruit': [
      'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
      'mango', 'pineapple', 'watermelon', 'pear', 'peach', 'lemon',
      'lime', 'cherry', 'kiwi', 'avocado', 'plum', 'grapefruit', 'melon',
      'cantaloupe', 'raspberry', 'blackberry', 'pomegranate', 'papaya',
      'dragon fruit',
    ],
    'Pantry': [
      'bread', 'pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil',
      'vinegar', 'cereal', 'oats', 'honey', 'jam', 'peanut butter',
      'crackers', 'chips', 'cookies', 'nuts', 'beans', 'lentils', 'quinoa',
      'couscous', 'noodles', 'sauce', 'spices', 'herbs', 'tea', 'coffee',
    ],
    'Cleaning': [
      'soap', 'detergent', 'bleach', 'sponge', 'cleaner', 'paper towel',
      'tissue', 'toilet paper', 'dish soap', 'laundry', 'wipes', 'mop',
      'broom', 'vacuum', 'duster', 'garbage bags', 'aluminum foil',
      'plastic wrap', 'napkins',
    ],
  }

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => name.includes(keyword))) return category
  }
  return 'Other'
}

describe('autoCategorize', () => {
  it('categorizes milk as Dairy', () => {
    expect(autoCategorize('Milk')).toBe('Dairy')
  })

  it('categorizes chicken as Meat', () => {
    expect(autoCategorize('Chicken')).toBe('Meat')
  })

  it('categorizes salmon as Fish', () => {
    expect(autoCategorize('Salmon')).toBe('Fish')
  })

  it('categorizes broccoli as Vegetables', () => {
    expect(autoCategorize('Broccoli')).toBe('Vegetables')
  })

  it('categorizes apples as Fruit', () => {
    expect(autoCategorize('Apples')).toBe('Fruit')
  })

  it('categorizes bread as Pantry', () => {
    expect(autoCategorize('Bread')).toBe('Pantry')
  })

  it('categorizes toothpaste as Pharma & Hygiene', () => {
    expect(autoCategorize('Toothpaste')).toBe('Pharma & Hygiene')
  })

  it('categorizes laundry detergent as Cleaning', () => {
    expect(autoCategorize('Laundry Detergent')).toBe('Cleaning')
  })

  it('categorizes soap as Pharma & Hygiene (Pharma checked before Cleaning)', () => {
    // 'soap' appears in both Pharma & Hygiene and Cleaning keyword lists.
    // Priority order: Pharma & Hygiene is first — it wins.
    expect(autoCategorize('Soap')).toBe('Pharma & Hygiene')
  })

  it('categorizes unknown items as Other', () => {
    expect(autoCategorize('Random Widget XYZ')).toBe('Other')
  })

  it('is case-insensitive', () => {
    expect(autoCategorize('MILK')).toBe('Dairy')
    expect(autoCategorize('chicken')).toBe('Meat')
  })

  it('trims whitespace before categorizing', () => {
    expect(autoCategorize('  Rice  ')).toBe('Pantry')
  })
})

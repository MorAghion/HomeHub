/**
 * Category Translation Utility
 *
 * Maps listCategory English keys (used as internal data values) to
 * their i18n translation keys under common:categories.
 *
 * Usage: tCategory('Pharma & Hygiene', t) → "תרופות והיגיינה" (in Hebrew)
 */
import type { TFunction } from 'i18next';

const CATEGORY_KEY_MAP: Record<string, string> = {
  'Cleaning': 'cleaning',
  'Dairy': 'dairy',
  'Pantry': 'pantry',
  'Meat': 'meat',
  'Fish': 'fish',
  'Vegetables': 'vegetables',
  'Fruit': 'fruit',
  'Pharma & Hygiene': 'pharmaHygiene',
  'Camping': 'camping',
  'Documents & Money': 'documentsMoney',
  'Baby': 'baby',
  'Home Renovation': 'homeRenovation',
  'Home Decor': 'homeDecor',
  'Party': 'party',
  'Pets': 'pets',
  'Gardening': 'gardening',
  'Other': 'other',
};

/**
 * Translates a listCategory English key to the current locale.
 * Falls back to the original value if no translation key exists.
 */
export function tCategory(category: string, t: TFunction): string {
  const key = CATEGORY_KEY_MAP[category];
  if (!key) return category;
  return t(`common:categories.${key}`);
}

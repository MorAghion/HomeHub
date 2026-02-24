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

export function tCategory(category: string, t: TFunction): string {
  const key = CATEGORY_KEY_MAP[category];
  if (!key) return category;
  return t(`common:categories.${key}`);
}

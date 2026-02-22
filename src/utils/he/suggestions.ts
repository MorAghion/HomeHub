/**
 * Hebrew Suggestion Templates
 *
 * Mirrors suggestions.ts with Hebrew keywords and Hebrew item names.
 * Category values remain in English — they are internal keys.
 */

import type { SuggestedItem, SuggestionTemplate } from '../suggestions';
import type { MasterListItem } from '../../types/base';

export const SUGGESTION_TEMPLATES_HE: Record<string, SuggestedItem[]> = {
  'stock': [
    { text: 'סוללות', category: 'Cleaning' },
    { text: 'נורות', category: 'Cleaning' },
    { text: 'נייר טואלט', category: 'Cleaning' },
    { text: 'סבון', category: 'Cleaning' },
    { text: 'ספוגיות', category: 'Cleaning' },
    { text: 'מגבות נייר', category: 'Cleaning' },
    { text: 'שקיות אשפה', category: 'Cleaning' },
    { text: 'נייר כסף', category: 'Cleaning' },
  ],
  'pharmacy': [
    { text: 'אדוויל', category: 'Pharma & Hygiene' },
    { text: 'פלסטרים', category: 'Pharma & Hygiene' },
    { text: 'ויטמינים', category: 'Pharma & Hygiene' },
    { text: 'משחת שיניים', category: 'Pharma & Hygiene' },
    { text: 'מברשת שיניים', category: 'Pharma & Hygiene' },
    { text: 'שמפו', category: 'Pharma & Hygiene' },
    { text: 'דאודורנט', category: 'Pharma & Hygiene' },
    { text: 'קרם הגנה', category: 'Pharma & Hygiene' },
  ],
  'groceries': [
    { text: 'חלב', category: 'Dairy' },
    { text: 'לחם', category: 'Pantry' },
    { text: 'ביצים', category: 'Dairy' },
    { text: 'עוף', category: 'Meat' },
    { text: 'עגבניות', category: 'Vegetables' },
    { text: 'תפוחים', category: 'Fruit' },
    { text: 'גבינה', category: 'Dairy' },
    { text: 'אורז', category: 'Pantry' },
  ],
  'home-essentials': [
    { text: 'מים', category: 'Pantry' },
    { text: 'חלב', category: 'Dairy' },
    { text: 'לחם', category: 'Pantry' },
    { text: 'ביצים', category: 'Dairy' },
    { text: 'נייר טואלט', category: 'Cleaning' },
    { text: 'סבון', category: 'Cleaning' },
  ],
};

// Hebrew keywords that map to suggestion template keys
const HE_KEYWORD_TO_TEMPLATE: Record<string, string> = {
  'מלאי': 'stock',
  'ציוד בית': 'stock',
  'אחסון': 'stock',
  'עתודות': 'stock',
  'תרופות': 'pharmacy',
  'בית מרקחת': 'pharmacy',
  'פארמ': 'pharmacy',
  'בריאות': 'pharmacy',
  'ויטמינים': 'pharmacy',
  'קניות': 'groceries',
  'סופרמרקט': 'groceries',
  'מכולת': 'groceries',
  'אוכל': 'groceries',
  'שוק': 'groceries',
  'מזון': 'groceries',
};

/**
 * Match a Hebrew list name to a suggestion template key
 */
export function matchListNameToTemplateHe(listName: string): string | null {
  const name = listName.trim();

  for (const [keyword, templateKey] of Object.entries(HE_KEYWORD_TO_TEMPLATE)) {
    if (name.includes(keyword)) {
      return templateKey;
    }
  }

  return null;
}

/**
 * Returns Hebrew suggestion templates for a list name
 */
export function getSuggestedTemplatesHe(listName: string): SuggestionTemplate[] {
  const templates: SuggestionTemplate[] = [];
  const matched = matchListNameToTemplateHe(listName);

  if (matched) {
    templates.push({
      key: matched,
      label: `מוצע עבור ${listName}`,
    });
  }

  // Always show home essentials as fallback
  templates.push({
    key: 'home-essentials',
    label: 'צרכים בסיסיים לבית',
  });

  return templates;
}

/**
 * Filters master list items using Hebrew context matching
 */
export function filterMasterItemsByContextHe(
  listName: string,
  masterItems: MasterListItem[]
): MasterListItem[] {
  const matched = matchListNameToTemplateHe(listName);

  if (!matched) {
    return masterItems;
  }

  const CATEGORY_FILTERS_HE: Record<string, string[]> = {
    'stock': ['Cleaning', 'Pantry'],
    'pharmacy': ['Pharma & Hygiene'],
    'groceries': ['Dairy', 'Meat', 'Fish', 'Pantry', 'Vegetables', 'Fruit'],
    'home-essentials': ['Dairy', 'Meat', 'Fish', 'Pantry', 'Vegetables', 'Fruit', 'Cleaning', 'Pharma & Hygiene'],
  };

  const relevantCategories = CATEGORY_FILTERS_HE[matched] || [];

  return masterItems.filter(item => {
    const itemCategory = item.category || 'Other';
    return relevantCategories.includes(itemCategory);
  });
}

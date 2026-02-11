import type { MasterListItem } from '../App';

export interface SuggestedItem {
  text: string;
  category: string;
}

export interface SuggestionTemplate {
  key: string;
  label: string;
}

export const SUGGESTION_TEMPLATES: Record<string, SuggestedItem[]> = {
  'stock': [
    { text: 'Batteries', category: 'Cleaning' },
    { text: 'Lightbulbs', category: 'Cleaning' },
    { text: 'Toilet Paper', category: 'Cleaning' },
    { text: 'Soap', category: 'Cleaning' },
    { text: 'Sponges', category: 'Cleaning' },
    { text: 'Paper Towels', category: 'Cleaning' },
    { text: 'Garbage Bags', category: 'Cleaning' },
    { text: 'Aluminum Foil', category: 'Cleaning' },
  ],
  'pharmacy': [
    { text: 'Advil', category: 'Pharma & Hygiene' },
    { text: 'Band-aids', category: 'Pharma & Hygiene' },
    { text: 'Vitamins', category: 'Pharma & Hygiene' },
    { text: 'Toothpaste', category: 'Pharma & Hygiene' },
    { text: 'Toothbrush', category: 'Pharma & Hygiene' },
    { text: 'Shampoo', category: 'Pharma & Hygiene' },
    { text: 'Deodorant', category: 'Pharma & Hygiene' },
    { text: 'Sunscreen', category: 'Pharma & Hygiene' },
  ],
  'groceries': [
    { text: 'Milk', category: 'Dairy' },
    { text: 'Bread', category: 'Pantry' },
    { text: 'Eggs', category: 'Dairy' },
    { text: 'Chicken', category: 'Meat' },
    { text: 'Tomatoes', category: 'Vegetables' },
    { text: 'Apples', category: 'Fruit' },
    { text: 'Cheese', category: 'Dairy' },
    { text: 'Rice', category: 'Pantry' },
  ],
  'home-essentials': [
    { text: 'Water', category: 'Pantry' },
    { text: 'Milk', category: 'Dairy' },
    { text: 'Bread', category: 'Pantry' },
    { text: 'Eggs', category: 'Dairy' },
    { text: 'Toilet Paper', category: 'Cleaning' },
    { text: 'Soap', category: 'Cleaning' },
  ],
};

export const CATEGORY_FILTERS: Record<string, string[]> = {
  'stock': ['Cleaning', 'Pantry'],
  'pharmacy': ['Pharma & Hygiene'],
  'groceries': ['Dairy', 'Meat', 'Fish', 'Pantry', 'Vegetables', 'Fruit'],
  'home-essentials': ['Dairy', 'Meat', 'Fish', 'Pantry', 'Vegetables', 'Fruit', 'Cleaning', 'Pharma & Hygiene'],
};

/**
 * Converts a list name to lowercase and checks if any template key is contained in it
 * Priority order: stock → pharmacy → groceries → home-essentials
 */
export function matchListNameToTemplate(listName: string): string | null {
  const lowerName = listName.toLowerCase();

  // Priority order for matching
  const priorityKeywords = ['stock', 'pharmacy', 'groceries'];

  for (const keyword of priorityKeywords) {
    if (lowerName.includes(keyword)) {
      return keyword;
    }
  }

  return null;
}

/**
 * Returns array of suggestion templates to show as options
 * Includes primary match (if found) + "Home Essentials" fallback
 */
export function getSuggestedTemplates(listName: string): SuggestionTemplate[] {
  const templates: SuggestionTemplate[] = [];
  const matched = matchListNameToTemplate(listName);

  if (matched) {
    templates.push({
      key: matched,
      label: `Suggested for ${listName}`,
    });
  }

  // Always show Home Essentials as fallback
  templates.push({
    key: 'home-essentials',
    label: 'Home Essentials',
  });

  return templates;
}

/**
 * Filters master list items to only include those relevant to the current list context
 * Determines which template the listName matches and filters by that template's categories
 */
export function filterMasterItemsByContext(
  listName: string,
  masterItems: MasterListItem[]
): MasterListItem[] {
  const matched = matchListNameToTemplate(listName);

  // If no match, return all items (no filtering)
  if (!matched) {
    return masterItems;
  }

  const relevantCategories = CATEGORY_FILTERS[matched] || [];

  return masterItems.filter(item => {
    const itemCategory = item.category || 'Other';
    return relevantCategories.includes(itemCategory);
  });
}

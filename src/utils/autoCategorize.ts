/**
 * autoCategorize — Two-pass item categorization
 *
 * Pass 1: Exact name lookup against contextMapping items (English + Hebrew)
 * Pass 2: Substring keyword match (English + Hebrew keywords)
 * Pass 3: 'Other' fallback
 */

import { CONTEXT_RECOGNITION_MAPPING } from './contextMapping';
import { CONTEXT_RECOGNITION_MAPPING_HE } from './he/contextMapping';

// Build flat item→category lookup from all context items (English + Hebrew)
function buildItemLookup(): Record<string, string> {
  const lookup: Record<string, string> = {};

  for (const definition of Object.values(CONTEXT_RECOGNITION_MAPPING)) {
    for (const item of definition.items) {
      lookup[item.name.toLowerCase()] = item.listCategory;
    }
  }

  for (const definition of Object.values(CONTEXT_RECOGNITION_MAPPING_HE)) {
    for (const item of definition.items) {
      lookup[item.name.toLowerCase()] = item.listCategory;
    }
  }

  return lookup;
}

const ITEM_LOOKUP = buildItemLookup();

// Order matters — more specific categories first to prevent substring conflicts
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Pharma & Hygiene': [
    'toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'deodorant',
    'vitamin', 'aspirin', 'band-aid', 'sunscreen', 'razor', 'floss',
    'lotion', 'pads', 'tampons', 'makeup', 'perfume', 'hair gel',
    'body wash', 'hand sanitizer', 'cotton swabs', 'tissues',
    'baby shampoo', 'baby wipes', 'baby lotion', 'diaper cream',
    'painkiller', 'ibuprofen', 'antibiotic', 'eye drops', 'nasal spray',
    'bandage', 'gauze', 'thermometer', 'pregnancy test', 'nail clipper',
    // Hebrew
    'אספירין', 'ויטמין', 'שמפו', 'מרכך', 'דאודורנט', 'קרם', 'תחבושת',
    'תרופה', 'תרופות', 'סבון ידיים',
  ],
  'Baby': [
    'diapers', 'diaper', 'pacifier', 'baby formula', 'infant formula',
    'baby food', 'baby bottle', 'baby monitor', 'nursing pads', 'sippy cup',
    // Hebrew
    'חיתולים', 'מוצץ', 'בקבוק', 'מזון לתינוק', 'קרם לתינוק',
    'מגבונים', 'חלב תינוק',
  ],
  'Pets': [
    'dog food', 'cat food', 'pet treats', 'cat litter', 'pet toys',
    'pet leash', 'bird seed', 'fish tank',
    // Hebrew
    'מזון לכלב', 'מזון לחתול', 'ציוד לחיות', 'חול לחתול', 'עצם', 'פינוק לכלב',
  ],
  'Dairy': [
    'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream',
    'cottage cheese', 'mozzarella', 'cheddar', 'ice cream', 'labneh',
    'tofu', 'ricotta', 'parmesan', 'feta', 'brie', 'gouda',
    'eggs', 'egg', 'almond milk', 'oat milk', 'plant milk',
    'whipped cream', 'cream cheese',
    // Hebrew
    'חלב', 'גבינה', 'יוגורט', 'חמאה', 'שמנת', 'לבן', 'קוטג', 'ביצים', 'ביצה',
  ],
  'Meat': [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon',
    'ham', 'steak', 'ground beef', 'meatball', 'pastrami', 'salami',
    'pepperoni', 'duck', 'veal',
    'shawarma', 'schnitzel', 'kebab', 'mince', 'minced', 'fillet',
    'ground chicken',
    // Hebrew
    'עוף', 'בשר', 'כבש', 'הודו', 'נקניק', 'שניצל', 'סטייק',
    'קציצות', 'כבד', 'בקר',
  ],
  'Fish': [
    'salmon', 'tuna', 'cod', 'shrimp', 'fish', 'tilapia', 'crab',
    'lobster', 'sardine', 'anchovy', 'trout', 'halibut', 'mussels',
    'clams', 'scallops', 'oyster',
    // Hebrew
    'סלמון', 'טונה', 'דג', 'דגים', 'שרימפס', 'קרפיון', 'מוסר',
  ],
  'Vegetables': [
    'tomato', 'lettuce', 'carrot', 'onion', 'potato', 'broccoli',
    'cucumber', 'pepper', 'spinach', 'celery', 'garlic', 'cabbage',
    'zucchini', 'eggplant', 'mushroom', 'kale', 'arugula', 'beet',
    'radish', 'asparagus', 'cauliflower', 'corn', 'peas', 'leek',
    'squash', 'fennel', 'kohlrabi', 'artichoke', 'sweet potato',
    'butternut', 'chard', 'endive', 'radicchio',
    // Hebrew
    'עגבניה', 'עגבניות', 'גזר', 'בצל', 'תפוח אדמה', 'ברוקולי',
    'מלפפון', 'פלפל', 'תרד', 'שום', 'כרוב', 'קישוא', 'חצילים',
    'פטריות', 'כרובית', 'תירס', 'אפונה', 'שעועית', 'תפוחי אדמה',
  ],
  'Fruit': [
    'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry',
    'mango', 'pineapple', 'watermelon', 'pear', 'peach', 'lemon',
    'lime', 'cherry', 'kiwi', 'avocado', 'plum', 'grapefruit', 'melon',
    'cantaloupe', 'raspberry', 'blackberry', 'pomegranate', 'papaya',
    'dragon fruit', 'fig', 'date', 'lychee', 'guava', 'passion fruit',
    'nectarine', 'apricot', 'rambutan',
    // Hebrew
    'תפוח', 'בננה', 'תפוז', 'ענבים', 'תות', 'מנגו', 'אבטיח',
    'אגס', 'אפרסק', 'לימון', 'דובדבן', 'קיווי', 'אבוקדו',
    'שזיף', 'אשכולית', 'מלון', 'תפוחים', 'בננות', 'תפוזים',
  ],
  'Pantry': [
    'bread', 'pasta', 'rice', 'flour', 'sugar', 'salt', 'oil',
    'vinegar', 'cereal', 'oats', 'honey', 'jam', 'peanut butter',
    'crackers', 'chips', 'cookies', 'nuts', 'lentils', 'quinoa',
    'couscous', 'noodles', 'sauce', 'spices', 'herbs', 'tea', 'coffee',
    'granola', 'tahini', 'hummus', 'pita', 'matzo', 'dried fruit',
    'trail mix', 'popcorn', 'protein bar', 'energy bar',
    'instant noodles', 'ramen', 'tortilla', 'wrap',
    // Hebrew
    'לחם', 'פסטה', 'אורז', 'קמח', 'סוכר', 'מלח', 'שמן', 'חומץ',
    'דבש', 'ריבה', 'ביסקוויטים', 'שיבולת שועל', 'אטריות', 'רוטב',
    'תבלינים', 'תה', 'קפה', 'חיטה', 'שעורה', 'דגני בוקר',
  ],
  'Cleaning': [
    'soap', 'detergent', 'bleach', 'sponge', 'cleaner', 'paper towel',
    'toilet paper', 'dish soap', 'laundry', 'wipes', 'mop', 'broom',
    'vacuum', 'duster', 'garbage bags', 'aluminum foil', 'plastic wrap',
    'napkins', 'disinfectant', 'sanitizer', 'floor cleaner',
    'window cleaner', 'scrubber', 'brush', 'toilet brush', 'shower gel',
    // Hebrew
    'סבון', 'אבקת כביסה', 'ספוג', 'נייר טואלט', 'מגבות נייר',
    'שקיות אשפה', 'חומר ניקוי', 'מסנן', 'אקונומיקה', 'מגבונים חיטוי',
  ],
};

export function autoCategorize(itemName: string): string {
  const name = itemName.trim();
  const nameLower = name.toLowerCase();

  // Pass 1: exact lookup in contextMapping items (English + Hebrew)
  if (ITEM_LOOKUP[nameLower]) return ITEM_LOOKUP[nameLower];

  // Pass 1b: partial match — check if item name contains a known item name
  for (const [knownItem, category] of Object.entries(ITEM_LOOKUP)) {
    if (nameLower.includes(knownItem) || knownItem.includes(nameLower)) {
      return category;
    }
  }

  // Pass 2: keyword substring match
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => nameLower.includes(keyword))) return category;
  }

  // Pass 3: default
  return 'Other';
}

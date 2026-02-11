/**
 * Context Recognition Mapping Engine
 *
 * Maps Sub-Hub names to Context categories, which provide "Starter Packs"
 * of pre-selected items for the Master List. Each item includes its
 * designated List-Category for proper organization and grouping.
 *
 * Flexible Memory: Similar names (e.g., "Stock" and "Home Stock") share
 * the same Master List context, ensuring updates reflect across all instances.
 */

export interface ContextItem {
  name: string;
  listCategory: string;
}

export interface ContextDefinition {
  keywords: string[];
  displayLabel: string;
  items: ContextItem[];
}

export const CONTEXT_RECOGNITION_MAPPING: Record<string, ContextDefinition> = {

  'grocery': {
    keywords: [
      'grocery', 'supermarket', 'groceries', 'food shopping', 'market',
      'shopping', 'store', 'whole foods', 'costco', 'trader joe'
    ],
    displayLabel: 'Grocery List',
    items: [
      { name: 'Milk', listCategory: 'Dairy' },
      { name: 'Cheese', listCategory: 'Dairy' },
      { name: 'Eggs', listCategory: 'Dairy' },
      { name: 'Yogurt', listCategory: 'Dairy' },
      { name: 'Bread', listCategory: 'Pantry' },
      { name: 'Rice', listCategory: 'Pantry' },
      { name: 'Pasta', listCategory: 'Pantry' },
      { name: 'Chicken', listCategory: 'Meat' },
      { name: 'Beef', listCategory: 'Meat' },
      { name: 'Salmon', listCategory: 'Fish' },
      { name: 'Tomatoes', listCategory: 'Vegetables' },
      { name: 'Broccoli', listCategory: 'Vegetables' },
      { name: 'Apples', listCategory: 'Fruit' },
      { name: 'Bananas', listCategory: 'Fruit' },
    ]
  },

  'pharmacy': {
    keywords: [
      'pharmacy', 'pharma', 'drugstore', 'medicine', 'medications',
      'health', 'wellness', 'supplement', 'vitamin'
    ],
    displayLabel: 'Pharmacy',
    items: [
      { name: 'Aspirin', listCategory: 'Pharma & Hygiene' },
      { name: 'Advil', listCategory: 'Pharma & Hygiene' },
      { name: 'Vitamins', listCategory: 'Pharma & Hygiene' },
      { name: 'Band-aids', listCategory: 'Pharma & Hygiene' },
      { name: 'Toothpaste', listCategory: 'Pharma & Hygiene' },
      { name: 'Toothbrush', listCategory: 'Pharma & Hygiene' },
      { name: 'Shampoo', listCategory: 'Pharma & Hygiene' },
      { name: 'Deodorant', listCategory: 'Pharma & Hygiene' },
      { name: 'Sunscreen', listCategory: 'Pharma & Hygiene' },
      { name: 'Hand Sanitizer', listCategory: 'Pharma & Hygiene' },
    ]
  },

  'camping': {
    keywords: [
      'camping', 'camp', 'outdoor', 'hike', 'trail', 'trek',
      'backpack', 'wilderness', 'adventure', 'nature'
    ],
    displayLabel: 'Camping Trip',
    items: [
      { name: 'Tent', listCategory: 'Camping' },
      { name: 'Sleeping Bag', listCategory: 'Camping' },
      { name: 'Backpack', listCategory: 'Camping' },
      { name: 'Lantern', listCategory: 'Camping' },
      { name: 'Rope', listCategory: 'Camping' },
      { name: 'Cooler', listCategory: 'Camping' },
      { name: 'Camping Stove', listCategory: 'Camping' },
      { name: 'Water Bottle', listCategory: 'Camping' },
      { name: 'Sleeping Pad', listCategory: 'Camping' },
      { name: 'Flashlight', listCategory: 'Camping' },
    ]
  },

  'abroad': {
    keywords: [
      'abroad', 'travel', 'vacation', 'trip', 'holiday', 'flight',
      'journey', 'international', 'overseas', 'getaway', 'adventure'
    ],
    displayLabel: 'Travel Abroad',
    items: [
      { name: 'Passport', listCategory: 'Documents & Money' },
      { name: 'Travel Insurance', listCategory: 'Documents & Money' },
      { name: 'Travel Visas', listCategory: 'Documents & Money' },
      { name: 'Travel Adapter', listCategory: 'Cleaning' },
      { name: 'Luggage', listCategory: 'Camping' },
      { name: 'Medications', listCategory: 'Pharma & Hygiene' },
      { name: 'Sunscreen', listCategory: 'Pharma & Hygiene' },
      { name: 'Travel Pillow', listCategory: 'Camping' },
      { name: 'Travel Documents Organizer', listCategory: 'Documents & Money' },
      { name: 'Money Converter', listCategory: 'Documents & Money' },
    ]
  },

  'baby': {
    keywords: [
      'baby', 'newborn', 'infant', 'nursery', 'pregnancy',
      'maternity', 'child', 'toddler', 'baby shower'
    ],
    displayLabel: 'Baby Items',
    items: [
      { name: 'Diapers', listCategory: 'Baby' },
      { name: 'Baby Wipes', listCategory: 'Baby' },
      { name: 'Infant Formula', listCategory: 'Dairy' },
      { name: 'Baby Food', listCategory: 'Pantry' },
      { name: 'Bottles', listCategory: 'Baby' },
      { name: 'Pacifiers', listCategory: 'Baby' },
      { name: 'Baby Shampoo', listCategory: 'Pharma & Hygiene' },
      { name: 'Diaper Cream', listCategory: 'Pharma & Hygiene' },
      { name: 'Baby Blanket', listCategory: 'Baby' },
      { name: 'Crib Sheets', listCategory: 'Baby' },
    ]
  },

  'home-renovation': {
    keywords: [
      'renovation', 'remodel', 'paint', 'drywall', 'construction',
      'build', 'fix', 'repair', 'home improvement', 'upgrade'
    ],
    displayLabel: 'Home Renovation',
    items: [
      { name: 'Paint', listCategory: 'Home Renovation' },
      { name: 'Paint Brushes', listCategory: 'Home Renovation' },
      { name: 'Nails', listCategory: 'Home Renovation' },
      { name: 'Screws', listCategory: 'Home Renovation' },
      { name: 'Drywall', listCategory: 'Home Renovation' },
      { name: 'Wood Stain', listCategory: 'Home Renovation' },
      { name: 'Sandpaper', listCategory: 'Home Renovation' },
      { name: 'Safety Goggles', listCategory: 'Home Renovation' },
      { name: 'Work Gloves', listCategory: 'Home Renovation' },
      { name: 'Caulk', listCategory: 'Home Renovation' },
    ]
  },

  'baking': {
    keywords: [
      'baking', 'baker', 'cake', 'bread', 'pastry', 'dessert',
      'recipe', 'cookies', 'cupcake', 'cookie decorating'
    ],
    displayLabel: 'Baking Supplies',
    items: [
      { name: 'Flour', listCategory: 'Pantry' },
      { name: 'Sugar', listCategory: 'Pantry' },
      { name: 'Butter', listCategory: 'Dairy' },
      { name: 'Eggs', listCategory: 'Dairy' },
      { name: 'Vanilla Extract', listCategory: 'Pantry' },
      { name: 'Baking Soda', listCategory: 'Pantry' },
      { name: 'Chocolate Chips', listCategory: 'Pantry' },
      { name: 'Honey', listCategory: 'Pantry' },
      { name: 'Baking Powder', listCategory: 'Pantry' },
      { name: 'Coconut Oil', listCategory: 'Pantry' },
    ]
  },

  'party': {
    keywords: [
      'party', 'celebration', 'event', 'gathering', 'birthday',
      'wedding', 'festive', 'celebration', 'get-together'
    ],
    displayLabel: 'Party Supplies',
    items: [
      { name: 'Party Decorations', listCategory: 'Party' },
      { name: 'Balloons', listCategory: 'Party' },
      { name: 'Party Plates', listCategory: 'Party' },
      { name: 'Party Cups', listCategory: 'Party' },
      { name: 'Napkins', listCategory: 'Cleaning' },
      { name: 'Streamers', listCategory: 'Party' },
      { name: 'Party Hats', listCategory: 'Party' },
      { name: 'Gift Bags', listCategory: 'Party' },
      { name: 'Confetti', listCategory: 'Party' },
      { name: 'Party Favors', listCategory: 'Party' },
    ]
  },

  'pets': {
    keywords: [
      'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal',
      'aquarium', 'bird', 'rabbit', 'guinea pig'
    ],
    displayLabel: 'Pet Supplies',
    items: [
      { name: 'Dog Food', listCategory: 'Pets' },
      { name: 'Cat Food', listCategory: 'Pets' },
      { name: 'Pet Treats', listCategory: 'Pets' },
      { name: 'Cat Litter', listCategory: 'Pets' },
      { name: 'Pet Toys', listCategory: 'Pets' },
      { name: 'Pet Brush', listCategory: 'Pets' },
      { name: 'Pet Collar', listCategory: 'Pets' },
      { name: 'Pet Bedding', listCategory: 'Pets' },
      { name: 'Pet Shampoo', listCategory: 'Pharma & Hygiene' },
      { name: 'Dog Poop Bags', listCategory: 'Pets' },
    ]
  },

  'gardening': {
    keywords: [
      'gardening', 'garden', 'plant', 'flower', 'vegetable', 'yard',
      'lawn', 'outdoor', 'landscaping', 'herbs'
    ],
    displayLabel: 'Gardening',
    items: [
      { name: 'Seeds', listCategory: 'Gardening' },
      { name: 'Soil', listCategory: 'Gardening' },
      { name: 'Fertilizer', listCategory: 'Gardening' },
      { name: 'Gardening Gloves', listCategory: 'Gardening' },
      { name: 'Shovel', listCategory: 'Gardening' },
      { name: 'Pruning Shears', listCategory: 'Gardening' },
      { name: 'Plant Pots', listCategory: 'Gardening' },
      { name: 'Mulch', listCategory: 'Gardening' },
      { name: 'Watering Can', listCategory: 'Gardening' },
      { name: 'Compost', listCategory: 'Gardening' },
    ]
  },

  'home-decor': {
    keywords: [
      'decor', 'decoration', 'home decor', 'interior', 'furnish',
      'design', 'furniture', 'aesthetic', 'style'
    ],
    displayLabel: 'Home Decor',
    items: [
      { name: 'Throw Pillows', listCategory: 'Home Decor' },
      { name: 'Curtains', listCategory: 'Home Decor' },
      { name: 'Area Rug', listCategory: 'Home Decor' },
      { name: 'Wall Art', listCategory: 'Home Decor' },
      { name: 'Picture Frames', listCategory: 'Home Decor' },
      { name: 'Table Lamp', listCategory: 'Home Decor' },
      { name: 'Throw Blanket', listCategory: 'Home Decor' },
      { name: 'Vase', listCategory: 'Home Decor' },
      { name: 'Mirror', listCategory: 'Home Decor' },
      { name: 'Plant Stand', listCategory: 'Home Decor' },
    ]
  }
};

/**
 * Detects the context of a Sub-Hub by matching keywords in its name
 * Returns the context key (e.g., 'camping', 'grocery') or null if no match
 *
 * Priority: Exact then partial matches across all contexts
 */
export function detectContext(subHubName: string): string | null {
  const lowerName = subHubName.toLowerCase().trim();

  // Try to find a matching context by keyword
  for (const [contextKey, definition] of Object.entries(CONTEXT_RECOGNITION_MAPPING)) {
    for (const keyword of definition.keywords) {
      if (lowerName.includes(keyword)) {
        return contextKey;
      }
    }
  }

  return null;
}

/**
 * Gets suggested contexts for a Sub-Hub name
 * Returns all matching contexts with their display labels and items
 *
 * Useful for showing multiple suggestion bubbles when applicable
 */
export function getSuggestedContexts(subHubName: string): Array<{
  contextKey: string;
  displayLabel: string;
  itemCount: number;
}> {
  const lowerName = subHubName.toLowerCase().trim();
  const suggestedContexts: Set<string> = new Set();

  // Find all matching contexts
  for (const [contextKey, definition] of Object.entries(CONTEXT_RECOGNITION_MAPPING)) {
    for (const keyword of definition.keywords) {
      if (lowerName.includes(keyword)) {
        suggestedContexts.add(contextKey);
        break;
      }
    }
  }

  // Convert to array with metadata
  return Array.from(suggestedContexts).map(contextKey => {
    const definition = CONTEXT_RECOGNITION_MAPPING[contextKey];
    return {
      contextKey,
      displayLabel: definition.displayLabel,
      itemCount: definition.items.length,
    };
  });
}

/**
 * Gets all items for a specific context
 */
export function getContextItems(contextKey: string): ContextItem[] {
  const definition = CONTEXT_RECOGNITION_MAPPING[contextKey];
  return definition ? definition.items : [];
}

/**
 * Gets the display label for a context
 */
export function getContextLabel(contextKey: string): string {
  const definition = CONTEXT_RECOGNITION_MAPPING[contextKey];
  return definition ? definition.displayLabel : '';
}

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

  'stock': {
    keywords: [
      'stock', 'supplies', 'household stock', 'storage', 'inventory',
      'bulk', 'essentials', 'home supplies', 'pantry stock', 'restock',
      'replenish', 'stockpile', 'stocking up', 'staples', 'necessities'
    ],
    displayLabel: 'Stock Supplies',
    items: [
      { name: 'Batteries', listCategory: 'Cleaning' },
      { name: 'Lightbulbs', listCategory: 'Cleaning' },
      { name: 'Toilet Paper', listCategory: 'Cleaning' },
      { name: 'Soap', listCategory: 'Cleaning' },
      { name: 'Sponges', listCategory: 'Cleaning' },
      { name: 'Paper Towels', listCategory: 'Cleaning' },
      { name: 'Garbage Bags', listCategory: 'Cleaning' },
      { name: 'Aluminum Foil', listCategory: 'Cleaning' },
      { name: 'Trash Liners', listCategory: 'Cleaning' },
      { name: 'Cleaning Supplies', listCategory: 'Cleaning' },
      { name: 'Tissues', listCategory: 'Cleaning' },
      { name: 'Plastic Wrap', listCategory: 'Cleaning' },
      { name: 'Ziploc Bags', listCategory: 'Cleaning' },
      { name: 'Dish Soap', listCategory: 'Cleaning' },
      { name: 'Laundry Detergent', listCategory: 'Cleaning' },
      { name: 'Bleach', listCategory: 'Cleaning' },
      { name: 'Air Freshener', listCategory: 'Cleaning' },
      { name: 'Disinfectant Wipes', listCategory: 'Cleaning' },
      { name: 'Vacuum Bags', listCategory: 'Cleaning' },
      { name: 'Light Switch Covers', listCategory: 'Cleaning' },
    ]
  },

  'grocery': {
    keywords: [
      'grocery', 'supermarket', 'groceries', 'food shopping', 'market',
      'shopping', 'store', 'whole foods', 'costco', 'trader joe',
      'walmart', 'target', 'food', 'weekly shop', 'safeway'
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
      { name: 'Butter', listCategory: 'Dairy' },
      { name: 'Orange Juice', listCategory: 'Dairy' },
      { name: 'Cereal', listCategory: 'Pantry' },
      { name: 'Potatoes', listCategory: 'Vegetables' },
      { name: 'Carrots', listCategory: 'Vegetables' },
      { name: 'Oranges', listCategory: 'Fruit' },
    ]
  },

  'pharmacy': {
    keywords: [
      'pharmacy', 'pharma', 'drugstore', 'medicine', 'medications',
      'health', 'wellness', 'supplement', 'vitamin', 'cvs',
      'walgreens', 'rite aid', 'prescription', 'medical', 'first aid'
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
      { name: 'Cough Syrup', listCategory: 'Pharma & Hygiene' },
      { name: 'Allergy Medicine', listCategory: 'Pharma & Hygiene' },
      { name: 'Cold Medicine', listCategory: 'Pharma & Hygiene' },
      { name: 'Contact Lens Solution', listCategory: 'Pharma & Hygiene' },
      { name: 'Cotton Swabs', listCategory: 'Pharma & Hygiene' },
      { name: 'Rubbing Alcohol', listCategory: 'Pharma & Hygiene' },
      { name: 'Thermometer', listCategory: 'Pharma & Hygiene' },
      { name: 'Gauze Pads', listCategory: 'Pharma & Hygiene' },
      { name: 'Heating Pad', listCategory: 'Pharma & Hygiene' },
      { name: 'Facial Tissues', listCategory: 'Pharma & Hygiene' },
    ]
  },

  'camping': {
    keywords: [
      'camping', 'camp', 'outdoor', 'hike', 'trail', 'trek',
      'backpack', 'wilderness', 'adventure', 'nature', 'vacation',
      'rv', 'glamping', 'fishing', 'outdoors'
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
      { name: 'First Aid Kit', listCategory: 'Camping' },
      { name: 'Matches/Lighter', listCategory: 'Camping' },
      { name: 'Camping Chair', listCategory: 'Camping' },
      { name: 'Bug Spray', listCategory: 'Camping' },
      { name: 'Hiking Boots', listCategory: 'Camping' },
      { name: 'Map & Compass', listCategory: 'Camping' },
      { name: 'Firewood', listCategory: 'Camping' },
      { name: 'Camping Knife', listCategory: 'Camping' },
      { name: 'Hammock', listCategory: 'Camping' },
      { name: 'Portable Charger', listCategory: 'Camping' },
    ]
  },

  'abroad': {
    keywords: [
      'abroad', 'travel', 'vacation', 'trip', 'holiday', 'flight',
      'journey', 'international', 'overseas', 'getaway', 'adventure',
      'tourism', 'sightseeing', 'backpacking', 'cruise'
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
      { name: 'Travel Guidebook', listCategory: 'Documents & Money' },
      { name: 'Phone Charger', listCategory: 'Cleaning' },
      { name: 'Travel Toiletries', listCategory: 'Pharma & Hygiene' },
      { name: 'Camera', listCategory: 'Cleaning' },
      { name: 'Travel Lock', listCategory: 'Camping' },
      { name: 'Snacks for Flight', listCategory: 'Pantry' },
      { name: 'Earplugs', listCategory: 'Pharma & Hygiene' },
      { name: 'Eye Mask', listCategory: 'Pharma & Hygiene' },
      { name: 'Reusable Water Bottle', listCategory: 'Camping' },
      { name: 'Travel Backpack', listCategory: 'Camping' },
    ]
  },

  'baby': {
    keywords: [
      'baby', 'newborn', 'infant', 'nursery', 'pregnancy',
      'maternity', 'child', 'toddler', 'baby shower', 'kids',
      'children', 'pediatric', 'infant care', 'parenting', 'babies'
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
      { name: 'Baby Lotion', listCategory: 'Pharma & Hygiene' },
      { name: 'Teething Toys', listCategory: 'Baby' },
      { name: 'Burp Cloths', listCategory: 'Baby' },
      { name: 'Baby Monitor', listCategory: 'Baby' },
      { name: 'Diaper Bag', listCategory: 'Baby' },
      { name: 'Baby Clothes', listCategory: 'Baby' },
      { name: 'Sippy Cups', listCategory: 'Baby' },
      { name: 'Baby Socks', listCategory: 'Baby' },
      { name: 'Nursing Pads', listCategory: 'Baby' },
      { name: 'Baby Thermometer', listCategory: 'Pharma & Hygiene' },
    ]
  },

  'home-renovation': {
    keywords: [
      'renovation', 'remodel', 'paint', 'drywall', 'construction',
      'build', 'fix', 'repair', 'home improvement', 'upgrade',
      'diy', 'hardware', 'tools', 'makeover', 'refinish'
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
      { name: 'Paint Roller', listCategory: 'Home Renovation' },
      { name: 'Drop Cloth', listCategory: 'Home Renovation' },
      { name: 'Primer', listCategory: 'Home Renovation' },
      { name: 'Painter\'s Tape', listCategory: 'Home Renovation' },
      { name: 'Drill Bits', listCategory: 'Home Renovation' },
      { name: 'Hammer', listCategory: 'Home Renovation' },
      { name: 'Level', listCategory: 'Home Renovation' },
      { name: 'Spackle', listCategory: 'Home Renovation' },
      { name: 'Wood Glue', listCategory: 'Home Renovation' },
      { name: 'Lumber', listCategory: 'Home Renovation' },
    ]
  },

  'baking': {
    keywords: [
      'baking', 'baker', 'cake', 'bread', 'pastry', 'dessert',
      'recipe', 'cookies', 'cupcake', 'cookie decorating', 'bake',
      'muffin', 'brownie', 'pie', 'sweet'
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
      { name: 'Brown Sugar', listCategory: 'Pantry' },
      { name: 'Cocoa Powder', listCategory: 'Pantry' },
      { name: 'Powdered Sugar', listCategory: 'Pantry' },
      { name: 'Yeast', listCategory: 'Pantry' },
      { name: 'Almond Extract', listCategory: 'Pantry' },
      { name: 'Cream Cheese', listCategory: 'Dairy' },
      { name: 'Heavy Cream', listCategory: 'Dairy' },
      { name: 'Food Coloring', listCategory: 'Pantry' },
      { name: 'Sprinkles', listCategory: 'Pantry' },
      { name: 'Parchment Paper', listCategory: 'Pantry' },
    ]
  },

  'party': {
    keywords: [
      'party', 'celebration', 'event', 'gathering', 'birthday',
      'wedding', 'festive', 'get-together', 'reception', 'fiesta',
      'anniversary', 'banquet', 'social', 'entertaining', 'host'
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
      { name: 'Candles', listCategory: 'Party' },
      { name: 'Tablecloth', listCategory: 'Party' },
      { name: 'Plastic Utensils', listCategory: 'Party' },
      { name: 'Party Banners', listCategory: 'Party' },
      { name: 'Centerpieces', listCategory: 'Party' },
      { name: 'Paper Straws', listCategory: 'Party' },
      { name: 'Cake Toppers', listCategory: 'Party' },
      { name: 'Party Games', listCategory: 'Party' },
      { name: 'Thank You Cards', listCategory: 'Party' },
      { name: 'Invitations', listCategory: 'Party' },
    ]
  },

  'pets': {
    keywords: [
      'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal',
      'aquarium', 'bird', 'rabbit', 'guinea pig', 'pets',
      'petco', 'petsmart', 'vet', 'veterinary'
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
      { name: 'Pet Leash', listCategory: 'Pets' },
      { name: 'Water Bowl', listCategory: 'Pets' },
      { name: 'Food Bowl', listCategory: 'Pets' },
      { name: 'Pet Carrier', listCategory: 'Pets' },
      { name: 'Flea Treatment', listCategory: 'Pets' },
      { name: 'Pet Nail Clippers', listCategory: 'Pets' },
      { name: 'Pet ID Tag', listCategory: 'Pets' },
      { name: 'Scratching Post', listCategory: 'Pets' },
      { name: 'Bird Seed', listCategory: 'Pets' },
      { name: 'Fish Tank Filter', listCategory: 'Pets' },
    ]
  },

  'gardening': {
    keywords: [
      'gardening', 'garden', 'plant', 'flower', 'vegetable', 'yard',
      'lawn', 'outdoor', 'landscaping', 'herbs', 'greenhouse',
      'nursery', 'horticulture', 'planting', 'greenery'
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
      { name: 'Garden Hose', listCategory: 'Gardening' },
      { name: 'Trowel', listCategory: 'Gardening' },
      { name: 'Rake', listCategory: 'Gardening' },
      { name: 'Weed Killer', listCategory: 'Gardening' },
      { name: 'Garden Stakes', listCategory: 'Gardening' },
      { name: 'Potting Mix', listCategory: 'Gardening' },
      { name: 'Plant Food', listCategory: 'Gardening' },
      { name: 'Garden Sprayer', listCategory: 'Gardening' },
      { name: 'Wheelbarrow', listCategory: 'Gardening' },
      { name: 'Garden Kneeler', listCategory: 'Gardening' },
    ]
  },

  'home-decor': {
    keywords: [
      'decor', 'decoration', 'home decor', 'interior', 'furnish',
      'design', 'furniture', 'aesthetic', 'style', 'ikea',
      'home goods', 'decorating', 'accent', 'styling', 'ambiance'
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
      { name: 'Candle Holders', listCategory: 'Home Decor' },
      { name: 'Decorative Tray', listCategory: 'Home Decor' },
      { name: 'Wall Clock', listCategory: 'Home Decor' },
      { name: 'Shelf Decor', listCategory: 'Home Decor' },
      { name: 'Window Blinds', listCategory: 'Home Decor' },
      { name: 'Floor Lamp', listCategory: 'Home Decor' },
      { name: 'Accent Chair', listCategory: 'Home Decor' },
      { name: 'Bookends', listCategory: 'Home Decor' },
      { name: 'Decorative Bowls', listCategory: 'Home Decor' },
      { name: 'Wall Shelves', listCategory: 'Home Decor' },
    ]
  }
};

/**
 * Detects the context of a Sub-Hub by matching keywords in its name
 * Returns the context key (e.g., 'camping', 'grocery', 'stock') or null if no match
 *
 * Searches through all defined contexts and matches against their keywords.
 * Uses word boundary matching for more precise detection.
 */
export function detectContext(subHubName: string): string | null {
  const lowerName = subHubName.toLowerCase().trim();

  // Try to find a matching context by keyword
  // Higher priority contexts are checked first based on keyword specificity
  const priorityOrder = ['stock', 'pharmacy', 'camping', 'abroad', 'baby', 'home-renovation', 'baking', 'party', 'pets', 'gardening', 'home-decor', 'grocery'];

  for (const contextKey of priorityOrder) {
    const definition = CONTEXT_RECOGNITION_MAPPING[contextKey];
    if (definition) {
      for (const keyword of definition.keywords) {
        // Use word boundary matching for more specific detection
        const wordBoundaryPattern = new RegExp(`\\b${keyword}\\b`, 'i');
        if (wordBoundaryPattern.test(lowerName)) {
          return contextKey;
        }
      }
    }
  }

  return null;
}

/**
 * Gets suggested contexts for a Sub-Hub name
 * Returns all matching contexts with their display labels and items
 *
 * Useful for showing multiple suggestion bubbles when applicable.
 * Uses word boundary matching for more precise detection.
 */
export function getSuggestedContexts(subHubName: string): Array<{
  contextKey: string;
  displayLabel: string;
  itemCount: number;
}> {
  const lowerName = subHubName.toLowerCase().trim();
  const suggestedContexts: Set<string> = new Set();

  // Find all matching contexts using word boundary matching
  for (const [contextKey, definition] of Object.entries(CONTEXT_RECOGNITION_MAPPING)) {
    for (const keyword of definition.keywords) {
      const wordBoundaryPattern = new RegExp(`\\b${keyword}\\b`, 'i');
      if (wordBoundaryPattern.test(lowerName)) {
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

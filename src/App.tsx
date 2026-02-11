import { useState, useEffect } from 'react'
import ShoppingHub from './components/ShoppingHub'
import ShoppingList from './components/ShoppingList'

export interface ShoppingItem {
  id: number;
  text: string;
  completed: boolean;
  category?: string;
}

export interface MasterListItem {
  id: number;
  text: string;
  category?: string;
}

export interface DuplicateCheck {
  name: string;
  onConfirm: () => void;
}

interface ListInstance {
  id: string;
  name: string;
  items: ShoppingItem[];
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping-hub' | 'shopping'>('dashboard');

  // Multi-list state
  const [lists, setLists] = useState<Record<string, ListInstance>>(() => {
    const saved = localStorage.getItem('homehub-lists');
    if (saved) return JSON.parse(saved);

    // Migration from legacy single-list
    const legacyItems = localStorage.getItem('homehub-items');
    const defaultItems = legacyItems ? JSON.parse(legacyItems) : [
      { id: 1, text: 'Milk', completed: false },
      { id: 2, text: 'Eggs', completed: false },
    ];

    return {
      groceries: { id: 'groceries', name: 'Groceries', items: defaultItems },
      general: { id: 'general', name: 'General Household', items: [] }
    };
  });

  const [activeListId, setActiveListId] = useState<string>('groceries');

  // Master list (global)
  const [masterListItems, setMasterListItems] = useState<MasterListItem[]>(() => {
    const saved = localStorage.getItem('homehub-masterlist');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Bread', category: 'Pantry' },
      { id: 2, text: 'Cheese', category: 'Dairy' },
      { id: 3, text: 'Chicken', category: 'Meat' },
      { id: 4, text: 'Tomato', category: 'Vegetables' },
      { id: 5, text: 'Apple', category: 'Fruit' },
    ];
  });

  const categories = [
    // Existing categories
    'Dairy',
    'Meat',
    'Fish',
    'Pantry',
    'Vegetables',
    'Fruit',
    'Cleaning',
    'Pharma & Hygiene',
    // New categories for Context Recognition
    'Documents & Money',
    'Camping',
    'Baby',
    'Home Renovation',
    'Party',
    'Pets',
    'Gardening',
    'Home Decor',
  ];

  // Auto-save multi-list state to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-lists', JSON.stringify(lists));
  }, [lists]);

  // Auto-save master list to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-masterlist', JSON.stringify(masterListItems));
  }, [masterListItems]);

  // Shared utilities
  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const autoCategorize = (itemName: string): string => {
    const name = itemName.toLowerCase().trim();
    const categoryMap: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'cheddar', 'ice cream', 'labneh', 'tofu', 'ricotta', 'parmesan', 'feta', 'brie', 'gouda'],
      'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon', 'ham', 'steak', 'ground beef', 'meatball', 'pastrami', 'salami', 'pepperoni', 'duck', 'veal'],
      'Fish': ['salmon', 'tuna', 'cod', 'shrimp', 'fish', 'tilapia', 'crab', 'lobster', 'sardine', 'anchovy', 'trout', 'halibut', 'mussels', 'clams', 'scallops', 'oyster'],
      'Vegetables': ['tomato', 'lettuce', 'carrot', 'onion', 'potato', 'broccoli', 'cucumber', 'pepper', 'spinach', 'celery', 'garlic', 'cabbage', 'zucchini', 'eggplant', 'mushroom', 'kale', 'arugula', 'beet', 'radish', 'asparagus', 'cauliflower', 'corn', 'peas', 'beans', 'leek', 'squash'],
      'Fruit': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple', 'watermelon', 'pear', 'peach', 'lemon', 'lime', 'cherry', 'kiwi', 'avocado', 'plum', 'grapefruit', 'melon', 'cantaloupe', 'raspberry', 'blackberry', 'pomegranate', 'papaya', 'dragon fruit'],
      'Pantry': ['bread', 'pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'cereal', 'oats', 'honey', 'jam', 'peanut butter', 'crackers', 'chips', 'cookies', 'nuts', 'beans', 'lentils', 'quinoa', 'couscous', 'noodles', 'sauce', 'spices', 'herbs', 'tea', 'coffee'],
      'Cleaning': ['soap', 'detergent', 'bleach', 'sponge', 'cleaner', 'paper towel', 'tissue', 'toilet paper', 'dish soap', 'laundry', 'wipes', 'mop', 'broom', 'vacuum', 'duster', 'garbage bags', 'aluminum foil', 'plastic wrap', 'napkins'],
      'Pharma & Hygiene': ['toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'deodorant', 'vitamin', 'aspirin', 'band-aid', 'sunscreen', 'razor', 'floss', 'lotion', 'pads', 'tampons', 'soap', 'makeup', 'perfume', 'hair gel', 'body wash', 'hand sanitizer', 'cotton swabs', 'tissues']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => name.includes(keyword))) return category;
    }
    return 'Pantry';
  };

  // Router: Dashboard
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
        <header className="mb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#630606' }}>HomeHub</h1>
          <p className="text-lg mt-2" style={{ color: '#8E806A', opacity: 0.8 }}>Welcome home, Mor.</p>
        </header>

        <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => setCurrentScreen('shopping-hub')}
            className="bg-white p-10 rounded-[40px] shadow-sm text-left hover:shadow-md transition-all active:scale-[0.95] flex flex-col border border-transparent"
          >
            <span className="text-4xl mb-4">🛒</span>
            <h2 className="text-2xl font-semibold" style={{ color: '#8E806A' }}>Shopping Lists</h2>
            <p className="text-sm mt-1" style={{ color: '#8E806A', opacity: 0.6 }}>Manage your shopping lists</p>
          </button>

          <button className="bg-white p-10 rounded-[40px] shadow-sm text-left opacity-80 flex flex-col border border-transparent">
            <span className="text-3xl mb-4 grayscale">🏠</span>
            <h2 className="text-2xl font-semibold" style={{ color: '#8E806A' }}>Home Tasks</h2>
            <p className="text-sm mt-1" style={{ color: '#8E806A', opacity: 0.6 }}>Coming soon...</p>
          </button>

          <div className="bg-white/50 p-10 rounded-[40px] border border-dashed border-[#8E806A33] flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#8E806A11] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold" style={{ color: '#8E806A' }}>
              Soon
            </div>
            <span className="text-3xl mb-4 grayscale opacity-50">🎟️</span>
            <h2 className="text-2xl font-semibold opacity-40" style={{ color: '#8E806A' }}>Vouchers</h2>
            <p className="text-sm mt-1 opacity-30" style={{ color: '#8E806A' }}>Future rewards & surprises</p>
          </div>
        </main>
      </div>
    );
  }

  // Router: Shopping Hub
  if (currentScreen === 'shopping-hub') {
    return (
      <ShoppingHub
        lists={lists}
        onSelectList={(id) => {
          setActiveListId(id);
          setCurrentScreen('shopping');
        }}
        onCreateList={(name) => {
          const id = `list-${Date.now()}`;
          setLists({
            ...lists,
            [id]: { id, name: name.trim(), items: [] }
          });
        }}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Router: Shopping List
  if (currentScreen === 'shopping') {
    const currentList = lists[activeListId];
    if (!currentList) {
      setCurrentScreen('shopping-hub');
      return null;
    }

    return (
      <ShoppingList
        listName={currentList.name}
        items={currentList.items}
        onUpdateItems={(newItems) => {
          setLists({
            ...lists,
            [activeListId]: { ...currentList, items: newItems }
          });
        }}
        onBack={() => setCurrentScreen('shopping-hub')}
        masterListItems={masterListItems}
        onUpdateMasterList={setMasterListItems}
        categories={categories}
        capitalizeFirstLetter={capitalizeFirstLetter}
        autoCategorize={autoCategorize}
      />
    );
  }
}

export default App
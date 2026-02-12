import { useState, useEffect, useRef } from 'react'
import ShoppingHub from './components/ShoppingHub'
import ShoppingList from './components/ShoppingList'
import {
  loadMasterListById,
  saveMasterListById,
  clearMasterListById,
  migrateContextBasedStorage
} from './utils/flexibleMemory'
import type {
  MasterListItem,
  ListInstance
} from './types/base'

// Hub ID constant for hierarchical Sub-Hub IDs
const SHOPPING_HUB_ID = 'shopping-hub';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping-hub' | 'shopping'>('dashboard');

  // Track previous activeListId to save to correct context when switching
  const prevActiveListIdRef = useRef<string>('');

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
      'shopping-hub_groceries': {
        id: 'shopping-hub_groceries',
        name: 'Groceries',
        items: defaultItems
      },
      'shopping-hub_general': {
        id: 'shopping-hub_general',
        name: 'General Household',
        items: []
      }
    };
  });

  // Persist active list ID across refreshes
  const [activeListId, setActiveListId] = useState<string>(() => {
    const saved = localStorage.getItem('homehub-active-list');
    return saved || 'shopping-hub_groceries';
  });

  // Master list (ID-based with Flexible Memory V2)
  // Loads from ID-based localStorage keys - fully isolated per Sub-Hub
  // Starts empty to show suggestion bubbles for new lists
  const [masterListItems, setMasterListItems] = useState<MasterListItem[]>(() => {
    // Load lists from localStorage first
    const savedLists = localStorage.getItem('homehub-lists');
    if (savedLists) {
      const parsedLists = JSON.parse(savedLists);
      const savedActiveId = localStorage.getItem('homehub-active-list') || 'shopping-hub_groceries';
      const activeList = parsedLists[savedActiveId];

      if (activeList) {
        // Load from Sub-Hub ID (V2)
        const items = loadMasterListById(activeList.id);
        return items; // Returns empty array if nothing saved
      }
    }

    // Fallback: load from default 'shopping-hub_groceries' ID
    const items = loadMasterListById('shopping-hub_groceries');
    return items;
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

  // Run migration on mount (V1 → V2)
  useEffect(() => {
    migrateContextBasedStorage(lists);
  }, []);

  // Auto-save multi-list state to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-lists', JSON.stringify(lists));
  }, [lists]);

  // Auto-save active list ID to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-active-list', activeListId);
  }, [activeListId]);

  // Handle Sub-Hub switching: save to OLD Sub-Hub, load from NEW Sub-Hub
  useEffect(() => {
    const prevListId = prevActiveListIdRef.current;
    const currentList = lists[activeListId];

    if (!currentList) return;

    // If switching Sub-Hubs (not initial load)
    if (prevListId && prevListId !== activeListId) {
      // Save current masterListItems to PREVIOUS Sub-Hub by ID before switching
      saveMasterListById(prevListId, masterListItems);
    }

    // Load items from NEW Sub-Hub by ID
    const items = loadMasterListById(activeListId);
    setMasterListItems(items);

    // Update ref to track current Sub-Hub
    prevActiveListIdRef.current = activeListId;
  }, [activeListId, lists]);

  // Auto-save when master list items change (user adds/removes/edits items)
  useEffect(() => {
    const currentList = lists[activeListId];

    // Only save if we have a valid list and we're not on initial load
    if (currentList && prevActiveListIdRef.current === activeListId) {
      saveMasterListById(activeListId, masterListItems);
    }
  }, [masterListItems, activeListId, lists]);

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
    return 'Other';
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
          const id = `${SHOPPING_HUB_ID}_list-${Date.now()}`;
          setLists({
            ...lists,
            [id]: { id, name: name.trim(), items: [] }
          });
        }}
        onEditList={(listId, newName) => {
          const list = lists[listId];
          if (list) {
            setLists({
              ...lists,
              [listId]: { ...list, name: newName.trim() }
            });
          }
        }}
        onDeleteList={(listId) => {
          const list = lists[listId];
          if (list) {
            // Remove list from state first
            const newLists = { ...lists };
            delete newLists[listId];

            // Clear associated Master List by ID (V2)
            clearMasterListById(listId);

            setLists(newLists);

            // If deleting the active list, reset to default
            if (activeListId === listId) {
              const remainingIds = Object.keys(newLists);
              setActiveListId(remainingIds[0] || 'shopping-hub_groceries');
            }
          }
        }}
        onDeleteLists={(listIds) => {
          const newLists = { ...lists };

          // Remove all selected lists from state
          listIds.forEach(listId => {
            delete newLists[listId];
          });

          // Clear Master Lists by ID (V2)
          listIds.forEach(listId => {
            clearMasterListById(listId);
          });

          setLists(newLists);

          // If active list was deleted, reset to default
          if (listIds.includes(activeListId)) {
            const remainingIds = Object.keys(newLists);
            setActiveListId(remainingIds[0] || 'shopping-hub_groceries');
          }
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

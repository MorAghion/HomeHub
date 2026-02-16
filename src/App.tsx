import { useState, useEffect, useRef } from 'react'
import { ShoppingBag, ListTodo, Gift } from 'lucide-react'
import ShoppingHub from './components/ShoppingHub'
import ShoppingList from './components/ShoppingList'
import TasksHub from './components/TasksHub'
import TaskList from './components/TaskList'
import VouchersHub from './components/VouchersHub'
import VoucherList from './components/VoucherList'
import {
  loadMasterListById,
  saveMasterListById,
  clearMasterListById,
  migrateContextBasedStorage
} from './utils/flexibleMemory'
import {
  loadTaskMasterListById,
  saveTaskMasterListById,
  clearTaskMasterListById,
  getUrgentTasks,
  type TaskListInstance
} from './utils/taskMemory'
import {
  loadVoucherLists,
  saveVoucherLists,
  createVoucherSubHub,
  getVouchersFromSubHub,
  saveVouchersToSubHub,
  generateVoucherSubHubId
} from './utils/voucherMemory'
import type {
  MasterListItem,
  ListInstance,
  Task,
  VoucherListInstance,
  VoucherItem
} from './types/base'

// Hub ID constants for hierarchical Sub-Hub IDs
const SHOPPING_HUB_ID = 'shopping-hub';
const HOME_TASKS_HUB_ID = 'home-tasks';
const VOUCHERS_HUB_ID = 'vouchers';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping-hub' | 'shopping' | 'home-tasks-hub' | 'home-tasks' | 'vouchers-hub' | 'vouchers'>('dashboard');

  // Mobile Card Stack Navigation
  const [activeHub, setActiveHub] = useState<'shopping' | 'tasks' | 'vouchers'>('shopping');
  const [isLandingMode, setIsLandingMode] = useState(true); // Landing vs Active mode
  const cardStackRef = useRef<HTMLDivElement>(null);

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

  // =====================================================================
  // TASK LISTS STATE & MANAGEMENT
  // =====================================================================

  // Track previous active task list ID
  const prevActiveTaskListIdRef = useRef<string>('');

  // Multi-task-list state
  const [taskLists, setTaskLists] = useState<Record<string, TaskListInstance>>(() => {
    const saved = localStorage.getItem('homehub-task-lists');
    if (saved) return JSON.parse(saved);

    // Initialize with Urgent Tasks sub-hub
    return {
      'home-tasks_urgent': {
        id: 'home-tasks_urgent',
        name: 'Urgent Tasks',
        tasks: []
      }
    };
  });

  // Persist active task list ID across refreshes
  const [activeTaskListId, setActiveTaskListId] = useState<string>(() => {
    const saved = localStorage.getItem('homehub-active-task-list');
    return saved || 'home-tasks_urgent';
  });

  // Highlighted task ID for flashlight effect
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null);

  // Task master list (ID-based storage)
  const [masterListTasks, setMasterListTasks] = useState<Task[]>(() => {
    const savedLists = localStorage.getItem('homehub-task-lists');
    if (savedLists) {
      const parsedLists = JSON.parse(savedLists);
      const savedActiveId = localStorage.getItem('homehub-active-task-list') || 'home-tasks_urgent';
      const activeList = parsedLists[savedActiveId];

      if (activeList && activeList.id !== 'home-tasks_urgent') {
        const items = loadTaskMasterListById(activeList.id);
        return items;
      }
    }

    return [];
  });

  // Auto-save task lists to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-task-lists', JSON.stringify(taskLists));
  }, [taskLists]);

  // Auto-save active task list ID to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-active-task-list', activeTaskListId);
  }, [activeTaskListId]);

  // Handle Task Sub-Hub switching: save to OLD, load from NEW
  useEffect(() => {
    const prevTaskListId = prevActiveTaskListIdRef.current;
    const currentTaskList = taskLists[activeTaskListId];

    if (!currentTaskList) return;

    // Skip for urgent view
    if (currentTaskList.id === 'home-tasks_urgent') {
      prevActiveTaskListIdRef.current = activeTaskListId;
      setMasterListTasks([]);
      return;
    }

    // If switching Sub-Hubs (not initial load)
    if (prevTaskListId && prevTaskListId !== activeTaskListId && prevTaskListId !== 'home-tasks_urgent') {
      saveTaskMasterListById(prevTaskListId, masterListTasks);
    }

    // Load items from NEW Sub-Hub by ID
    const items = loadTaskMasterListById(activeTaskListId);
    setMasterListTasks(items);

    // Update ref to track current Sub-Hub
    prevActiveTaskListIdRef.current = activeTaskListId;
  }, [activeTaskListId, taskLists]);

  // Auto-save when task master list changes
  useEffect(() => {
    const currentTaskList = taskLists[activeTaskListId];

    // Only save if we have a valid list and we're not on initial load or urgent view
    if (currentTaskList &&
        currentTaskList.id !== 'home-tasks_urgent' &&
        prevActiveTaskListIdRef.current === activeTaskListId) {
      saveTaskMasterListById(activeTaskListId, masterListTasks);
    }
  }, [masterListTasks, activeTaskListId, taskLists]);

  // Update urgent tasks whenever task lists change
  useEffect(() => {
    const urgentTasks = getUrgentTasks(taskLists);

    // Only update if the urgent tasks have actually changed
    const currentUrgent = taskLists['home-tasks_urgent'];
    const hasChanged = !currentUrgent ||
      JSON.stringify(currentUrgent.tasks) !== JSON.stringify(urgentTasks);

    if (hasChanged) {
      setTaskLists(prev => ({
        ...prev,
        'home-tasks_urgent': {
          id: 'home-tasks_urgent',
          name: 'Urgent Tasks',
          tasks: urgentTasks
        }
      }));
    }
  }, [JSON.stringify(Object.values(taskLists).filter(list => list.id !== 'home-tasks_urgent').map(list => list.tasks))]);

  // =====================================================================
  // END TASK LISTS STATE & MANAGEMENT
  // =====================================================================

  // =====================================================================
  // VOUCHER LISTS STATE & MANAGEMENT
  // =====================================================================

  // Voucher lists state
  const [voucherLists, setVoucherLists] = useState<Record<string, VoucherListInstance>>(() => {
    return loadVoucherLists();
  });

  // Active voucher list ID
  const [activeVoucherListId, setActiveVoucherListId] = useState<string>('');

  // Current vouchers for the active list
  const [currentVouchers, setCurrentVouchers] = useState<VoucherItem[]>([]);

  // Auto-save voucher lists to localStorage
  useEffect(() => {
    saveVoucherLists(voucherLists);
  }, [voucherLists]);

  // Load vouchers when active voucher list changes
  useEffect(() => {
    if (activeVoucherListId) {
      const vouchers = getVouchersFromSubHub(activeVoucherListId);
      setCurrentVouchers(vouchers);
    }
  }, [activeVoucherListId]);

  // Save vouchers when they change
  useEffect(() => {
    if (activeVoucherListId && currentVouchers.length >= 0) {
      saveVouchersToSubHub(activeVoucherListId, currentVouchers);
      // Update the voucher list state
      setVoucherLists(prev => ({
        ...prev,
        [activeVoucherListId]: {
          ...prev[activeVoucherListId],
          items: currentVouchers
        }
      }));
    }
  }, [currentVouchers, activeVoucherListId]);

  // =====================================================================
  // END VOUCHER LISTS STATE & MANAGEMENT
  // =====================================================================

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

  // Card Stack Navigation Functions
  const scrollToHub = (hub: 'shopping' | 'tasks' | 'vouchers') => {
    // Set active hub BEFORE switching modes
    setActiveHub(hub);
    // Exit landing mode
    setIsLandingMode(false);

    // Wait for re-render to Active Mode, then scroll to correct hub
    setTimeout(() => {
      if (!cardStackRef.current) return;
      const hubIndex = { shopping: 0, tasks: 1, vouchers: 2 }[hub];
      const cards = cardStackRef.current.children;
      const targetCard = cards[hubIndex] as HTMLElement;

      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 0);
  };

  // Return to Landing Mode (HomeView)
  const returnToHome = () => {
    setIsLandingMode(true);
    // Scroll to center (shopping hub by default)
    if (cardStackRef.current) {
      const cards = cardStackRef.current.children;
      const centerCard = cards[0] as HTMLElement; // Shopping is center
      centerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  // Detect active card from scroll position (sync with bottom nav)
  useEffect(() => {
    const container = cardStackRef.current;
    if (!container) return;

    // Scroll-based detection for reliable active hub tracking
    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const centerPosition = scrollLeft + containerWidth / 2;

      // Find which card's center is closest to viewport center
      let closestHub: 'shopping' | 'tasks' | 'vouchers' = 'shopping';
      let minDistance = Infinity;

      Array.from(container.children).forEach((card, index) => {
        const element = card as HTMLElement;
        const cardLeft = element.offsetLeft;
        const cardCenter = cardLeft + element.clientWidth / 2;
        const distance = Math.abs(cardCenter - centerPosition);

        if (distance < minDistance) {
          minDistance = distance;
          const hubId = element.getAttribute('data-hub') as 'shopping' | 'tasks' | 'vouchers';
          if (hubId) closestHub = hubId;
        }
      });

      if (closestHub !== activeHub) {
        setActiveHub(closestHub);
      }
    };

    // Initial detection
    handleScroll();

    // Listen to scroll events
    container.addEventListener('scroll', handleScroll);

    // Also use IntersectionObserver as backup
    const observer = new IntersectionObserver(
      (entries) => {
        let maxEntry = entries[0];
        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxEntry.intersectionRatio) {
            maxEntry = entry;
          }
        });

        if (maxEntry && maxEntry.intersectionRatio > 0.5) {
          const hubId = maxEntry.target.getAttribute('data-hub') as 'shopping' | 'tasks' | 'vouchers';
          if (hubId && hubId !== activeHub) {
            setActiveHub(hubId);
          }
        }
      },
      { threshold: [0.5], root: null }
    );

    Array.from(container.children).forEach((card) => {
      observer.observe(card);
    });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [activeHub, isLandingMode]); // Re-run when mode changes

  // Scroll to initial hub on mount - Start in Landing Mode
  useEffect(() => {
    if (cardStackRef.current && (currentScreen === 'dashboard' || currentScreen === 'shopping-hub' || currentScreen === 'home-tasks-hub' || currentScreen === 'vouchers-hub')) {
      // Small delay to ensure DOM is ready, then center on active hub
      setTimeout(() => {
        if (cardStackRef.current) {
          const hubIndex = { shopping: 0, tasks: 1, vouchers: 2 }[activeHub];
          const cards = cardStackRef.current.children;
          const targetCard = cards[hubIndex] as HTMLElement;
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
          }
        }
      }, 100);
    }
  }, []);

  // Shared utilities
  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const autoCategorize = (itemName: string): string => {
    const name = itemName.toLowerCase().trim();
    // Order matters! Check more specific categories first to prevent substring conflicts
    const categoryMap: Record<string, string[]> = {
      'Pharma & Hygiene': ['toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'deodorant', 'vitamin', 'aspirin', 'band-aid', 'sunscreen', 'razor', 'floss', 'lotion', 'pads', 'tampons', 'soap', 'makeup', 'perfume', 'hair gel', 'body wash', 'hand sanitizer', 'cotton swabs', 'tissues', 'baby shampoo', 'baby wipes', 'baby lotion', 'diaper cream'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'cheddar', 'ice cream', 'labneh', 'tofu', 'ricotta', 'parmesan', 'feta', 'brie', 'gouda'],
      'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon', 'ham', 'steak', 'ground beef', 'meatball', 'pastrami', 'salami', 'pepperoni', 'duck', 'veal'],
      'Fish': ['salmon', 'tuna', 'cod', 'shrimp', 'fish', 'tilapia', 'crab', 'lobster', 'sardine', 'anchovy', 'trout', 'halibut', 'mussels', 'clams', 'scallops', 'oyster'],
      'Vegetables': ['tomato', 'lettuce', 'carrot', 'onion', 'potato', 'broccoli', 'cucumber', 'pepper', 'spinach', 'celery', 'garlic', 'cabbage', 'zucchini', 'eggplant', 'mushroom', 'kale', 'arugula', 'beet', 'radish', 'asparagus', 'cauliflower', 'corn', 'peas', 'beans', 'leek', 'squash'],
      'Fruit': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple', 'watermelon', 'pear', 'peach', 'lemon', 'lime', 'cherry', 'kiwi', 'avocado', 'plum', 'grapefruit', 'melon', 'cantaloupe', 'raspberry', 'blackberry', 'pomegranate', 'papaya', 'dragon fruit'],
      'Pantry': ['bread', 'pasta', 'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'cereal', 'oats', 'honey', 'jam', 'peanut butter', 'crackers', 'chips', 'cookies', 'nuts', 'beans', 'lentils', 'quinoa', 'couscous', 'noodles', 'sauce', 'spices', 'herbs', 'tea', 'coffee'],
      'Cleaning': ['soap', 'detergent', 'bleach', 'sponge', 'cleaner', 'paper towel', 'tissue', 'toilet paper', 'dish soap', 'laundry', 'wipes', 'mop', 'broom', 'vacuum', 'duster', 'garbage bags', 'aluminum foil', 'plastic wrap', 'napkins']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => name.includes(keyword))) return category;
    }
    return 'Other';
  };

  // Render Bottom Navigation
  const renderBottomNav = () => (
    <div
      className="absolute bottom-0 left-0 w-full h-20 z-50 border-t backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(245, 242, 231, 0.9)',
        borderColor: 'rgba(99, 6, 6, 0.1)'
      }}
    >
      <div className="flex items-center justify-around h-full px-6 max-w-md mx-auto">
        <button
          onClick={() => scrollToHub('shopping')}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all"
          style={{
            color: activeHub === 'shopping' ? '#630606' : '#8E806A',
            backgroundColor: activeHub === 'shopping' ? '#63060611' : 'transparent'
          }}
        >
          <ShoppingBag size={24} strokeWidth={2} />
          <span className="text-xs font-medium">Shopping</span>
        </button>

        <button
          onClick={() => scrollToHub('tasks')}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all"
          style={{
            color: activeHub === 'tasks' ? '#630606' : '#8E806A',
            backgroundColor: activeHub === 'tasks' ? '#63060611' : 'transparent'
          }}
        >
          <ListTodo size={24} strokeWidth={2} />
          <span className="text-xs font-medium">Tasks</span>
        </button>

        <button
          onClick={() => scrollToHub('vouchers')}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all"
          style={{
            color: activeHub === 'vouchers' ? '#630606' : '#8E806A',
            backgroundColor: activeHub === 'vouchers' ? '#63060611' : 'transparent'
          }}
        >
          <Gift size={24} strokeWidth={2} />
          <span className="text-xs font-medium">Vouchers</span>
        </button>
      </div>
    </div>
  );

  // Router: Mobile Card Stack (Hub Level) - HomeView Landing Page
  if (currentScreen === 'dashboard' || currentScreen === 'shopping-hub' || currentScreen === 'home-tasks-hub' || currentScreen === 'vouchers-hub') {
    return (
      <div
        className="fixed inset-0 w-full h-[100dvh] overflow-hidden"
        style={{
          backgroundColor: '#F5F2E7',
          touchAction: 'none'
        }}
      >
        {/* Fixed Header - Clean Logo Only */}
        <header
          className="absolute top-0 left-0 w-full h-16 z-50 flex items-center justify-center backdrop-blur-md border-b"
          style={{
            backgroundColor: 'rgba(245, 242, 231, 0.9)',
            borderColor: '#8E806A22'
          }}
        >
          <button
            onClick={returnToHome}
            className="text-center transition-all hover:opacity-70 active:scale-95"
          >
            <h1 className="text-2xl font-bold" style={{ color: '#630606' }}>HomeHub</h1>
          </button>
        </header>

        {/* Landing Page Layout */}
        {isLandingMode ? (
          <div className="absolute top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col">
            {/* Subtle Small Greeting */}
            <div className="flex-shrink-0 flex items-center justify-center pt-8 pb-6">
              <h2 className="text-xl font-medium" style={{ color: '#630606' }}>
                Welcome home, Mor.
              </h2>
            </div>

            {/* Card Stack Carousel - 80vw with Deep Stack Effect */}
            <div className="flex-1 flex items-center overflow-hidden">
              <div
                ref={cardStackRef}
                className="w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  paddingLeft: '10vw',
                  paddingRight: '10vw',
                  touchAction: 'pan-x'
                }}
              >
                {/* Shopping Hub Card - Summary Mode */}
                <div
                  data-hub="shopping"
                  onClick={() => scrollToHub('shopping')}
                  className="snap-center flex-shrink-0 transition-all duration-300 cursor-pointer"
                  style={{
                    width: '80vw',
                    opacity: activeHub === 'shopping' ? 1 : 0.4,
                    transform: activeHub === 'shopping' ? 'scale(1)' : 'scale(0.9)'
                  }}
                >
                  <div className="h-[60vh] bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={64} strokeWidth={2} style={{ color: '#630606' }} className="mb-6" />
                    <h2 className="text-3xl font-bold mb-3" style={{ color: '#630606' }}>
                      Shopping Lists
                    </h2>
                    <p className="text-lg" style={{ color: '#8E806A' }}>
                      {Object.keys(lists).length} {Object.keys(lists).length === 1 ? 'active list' : 'active lists'}
                    </p>
                  </div>
                </div>

                {/* Tasks Hub Card - Summary Mode */}
                <div
                  data-hub="tasks"
                  onClick={() => scrollToHub('tasks')}
                  className="snap-center flex-shrink-0 transition-all duration-300 cursor-pointer"
                  style={{
                    width: '80vw',
                    opacity: activeHub === 'tasks' ? 1 : 0.4,
                    transform: activeHub === 'tasks' ? 'scale(1)' : 'scale(0.9)'
                  }}
                >
                  <div className="h-[60vh] bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center">
                    <ListTodo size={64} strokeWidth={2} style={{ color: '#630606' }} className="mb-6" />
                    <h2 className="text-3xl font-bold mb-3" style={{ color: '#630606' }}>
                      Home Tasks
                    </h2>
                    <p className="text-lg" style={{ color: '#8E806A' }}>
                      {Object.keys(taskLists).filter(id => id !== 'home-tasks_urgent').length} {Object.keys(taskLists).filter(id => id !== 'home-tasks_urgent').length === 1 ? 'active list' : 'active lists'}
                    </p>
                  </div>
                </div>

                {/* Vouchers Hub Card - Summary Mode */}
                <div
                  data-hub="vouchers"
                  onClick={() => scrollToHub('vouchers')}
                  className="snap-center flex-shrink-0 transition-all duration-300 cursor-pointer"
                  style={{
                    width: '80vw',
                    opacity: activeHub === 'vouchers' ? 1 : 0.4,
                    transform: activeHub === 'vouchers' ? 'scale(1)' : 'scale(0.9)'
                  }}
                >
                  <div className="h-[60vh] bg-white rounded-3xl shadow-xl p-12 flex flex-col items-center justify-center text-center">
                    <Gift size={64} strokeWidth={2} style={{ color: '#630606' }} className="mb-6" />
                    <h2 className="text-3xl font-bold mb-3" style={{ color: '#630606' }}>
                      Vouchers & Cards
                    </h2>
                    <p className="text-lg" style={{ color: '#8E806A' }}>
                      {Object.keys(voucherLists).length} {Object.keys(voucherLists).length === 1 ? 'active list' : 'active lists'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Mode - Full Screen Hub */
          <div
            ref={cardStackRef}
            className="absolute top-16 left-0 right-0 bottom-20 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              touchAction: 'pan-x'
            }}
          >
          {/* Shopping Hub Card - Full Screen Active Mode */}
          <div
            data-hub="shopping"
            className="snap-center min-w-full max-w-full flex-shrink-0 h-full flex flex-col"
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
              <ShoppingHub
                lists={lists}
                onSelectList={(id) => {
                  setActiveListId(id);
                  setCurrentScreen('shopping');
                }}
                onCreateList={(name) => {
                  const id = `${SHOPPING_HUB_ID}_${name.toLowerCase().replace(/\s+/g, '-')}`;
                  setLists({
                    ...lists,
                    [id]: { id, name, items: [] }
                  });
                }}
                onEditList={(listId, newName) => {
                  setLists({
                    ...lists,
                    [listId]: { ...lists[listId], name: newName }
                  });
                }}
                onDeleteList={(listId) => {
                  const newLists = { ...lists };
                  delete newLists[listId];
                  setLists(newLists);
                  if (activeListId === listId) {
                    setActiveListId(Object.keys(newLists)[0] || '');
                  }
                }}
                onDeleteLists={(listIds) => {
                  const newLists = { ...lists };
                  listIds.forEach(listId => {
                    delete newLists[listId];
                  });
                  setLists(newLists);
                  if (listIds.includes(activeListId)) {
                    setActiveListId(Object.keys(newLists)[0] || '');
                  }
                }}
                onBack={returnToHome}
              />
            </div>
          </div>

          {/* Tasks Hub Card - Full Screen Active Mode */}
          <div
            data-hub="tasks"
            className="snap-center min-w-full max-w-full flex-shrink-0 h-full flex flex-col"
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
              <TasksHub
                taskLists={taskLists}
                urgentTaskCount={taskLists['home-tasks_urgent']?.tasks.length || 0}
                onSelectList={(id) => {
                  setActiveTaskListId(id);
                  setCurrentScreen('home-tasks');
                }}
                onCreateList={(name) => {
                  const id = `${HOME_TASKS_HUB_ID}_${name.toLowerCase().replace(/\s+/g, '-')}`;
                  setTaskLists({
                    ...taskLists,
                    [id]: { id, name, tasks: [] }
                  });
                }}
                onEditList={(listId, newName) => {
                  setTaskLists({
                    ...taskLists,
                    [listId]: { ...taskLists[listId], name: newName }
                  });
                }}
                onDeleteList={(listId) => {
                  const newLists = { ...taskLists };
                  delete newLists[listId];
                  setTaskLists(newLists);
                  if (activeTaskListId === listId) {
                    setActiveTaskListId(Object.keys(newLists).filter(id => id !== 'home-tasks_urgent')[0] || '');
                  }
                }}
                onDeleteLists={(listIds) => {
                  const newLists = { ...taskLists };
                  listIds.forEach(listId => {
                    delete newLists[listId];
                  });
                  setTaskLists(newLists);
                  if (listIds.includes(activeTaskListId)) {
                    setActiveTaskListId(Object.keys(newLists).filter(id => id !== 'home-tasks_urgent')[0] || '');
                  }
                }}
                onBack={returnToHome}
              />
            </div>
          </div>

          {/* Vouchers Hub Card - Full Screen Active Mode */}
          <div
            data-hub="vouchers"
            className="snap-center min-w-full max-w-full flex-shrink-0 h-full flex flex-col"
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ touchAction: 'pan-y' }}>
              <VouchersHub
                voucherLists={voucherLists}
                onSelectList={(id) => {
                  setActiveVoucherListId(id);
                  setCurrentScreen('vouchers');
                }}
                onCreateList={(templateId, displayName, defaultType) => {
                  const id = generateVoucherSubHubId(templateId);
                  const newList = createVoucherSubHub(templateId, displayName, defaultType);
                  setVoucherLists({
                    ...voucherLists,
                    [id]: newList
                  });
                }}
                onDeleteList={(listId) => {
                  const newLists = { ...voucherLists };
                  delete newLists[listId];
                  setVoucherLists(newLists);
                  if (activeVoucherListId === listId) {
                    setActiveVoucherListId('');
                  }
                }}
                onDeleteLists={(listIds) => {
                  const newLists = { ...voucherLists };
                  listIds.forEach(listId => {
                    delete newLists[listId];
                  });
                  setVoucherLists(newLists);
                  if (listIds.includes(activeVoucherListId)) {
                    setActiveVoucherListId('');
                  }
                }}
                onBack={returnToHome}
              />
            </div>
          </div>
        </div>
        )}

        {/* Bottom Navigation - Only in Active Mode */}
        {!isLandingMode && renderBottomNav()}
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
      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
        <ShoppingList
        listName={currentList.name}
        items={currentList.items}
        onUpdateItems={(newItems) => {
          setLists({
            ...lists,
            [activeListId]: { ...currentList, items: newItems }
          });
        }}
        onBack={() => {
          setCurrentScreen('shopping-hub');
          setTimeout(() => {
            scrollToHub('shopping');
          }, 0);
        }}
        masterListItems={masterListItems}
        onUpdateMasterList={setMasterListItems}
        categories={categories}
        capitalizeFirstLetter={capitalizeFirstLetter}
        autoCategorize={autoCategorize}
      />
      </div>
    );
  }

  // Router: Home Tasks Hub
  if (currentScreen === 'home-tasks-hub') {
    const urgentTasks = getUrgentTasks(taskLists);

    return (
      <TasksHub
        taskLists={taskLists}
        urgentTaskCount={urgentTasks.length}
        onSelectList={(id) => {
          setActiveTaskListId(id);
          setCurrentScreen('home-tasks');
        }}
        onCreateList={(name) => {
          const id = `${HOME_TASKS_HUB_ID}_list-${Date.now()}`;
          setTaskLists({
            ...taskLists,
            [id]: { id, name: name.trim(), tasks: [] }
          });
        }}
        onEditList={(listId, newName) => {
          const list = taskLists[listId];
          if (list) {
            setTaskLists({
              ...taskLists,
              [listId]: { ...list, name: newName.trim() }
            });
          }
        }}
        onDeleteList={(listId) => {
          const list = taskLists[listId];
          if (list) {
            // Remove list from state first
            const newLists = { ...taskLists };
            delete newLists[listId];

            // Clear associated Task Master List by ID
            clearTaskMasterListById(listId);

            setTaskLists(newLists);

            // If deleting the active list, reset to urgent
            if (activeTaskListId === listId) {
              setActiveTaskListId('home-tasks_urgent');
            }
          }
        }}
        onDeleteLists={(listIds) => {
          const newLists = { ...taskLists };

          // Remove all selected lists from state
          listIds.forEach(listId => {
            delete newLists[listId];
          });

          // Clear Task Master Lists by ID
          listIds.forEach(listId => {
            clearTaskMasterListById(listId);
          });

          setTaskLists(newLists);

          // If active list was deleted, reset to urgent
          if (listIds.includes(activeTaskListId)) {
            setActiveTaskListId('home-tasks_urgent');
          }
        }}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Router: Home Tasks List
  if (currentScreen === 'home-tasks') {
    const currentTaskList = taskLists[activeTaskListId];
    if (!currentTaskList) {
      setCurrentScreen('home-tasks-hub');
      return null;
    }

    const isUrgentView = currentTaskList.id === 'home-tasks_urgent';

    return (
      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
        <TaskList
        listName={currentTaskList.name}
        listId={currentTaskList.id}
        isUrgentView={isUrgentView}
        tasks={currentTaskList.tasks}
        onUpdateTasks={(newTasks) => {
          if (!isUrgentView) {
            setTaskLists({
              ...taskLists,
              [activeTaskListId]: { ...currentTaskList, tasks: newTasks }
            });
          }
        }}
        onBack={() => {
          setCurrentScreen('home-tasks-hub');
          setTimeout(() => {
            scrollToHub('tasks');
          }, 0);
        }}
        onNavigateToSource={(sourceSubHubId, taskId) => {
          setActiveTaskListId(sourceSubHubId);
          setHighlightedTaskId(taskId);
          // Stay on same screen to show the source list
        }}
        onUpdateUrgentTask={(sourceSubHubId, taskId) => {
          // Find the source sub-hub and toggle the task's completion status
          const sourceList = taskLists[sourceSubHubId];
          if (sourceList) {
            const updatedTasks = sourceList.tasks.map(task => {
              if (task.id === taskId) {
                const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
                return { ...task, status: newStatus };
              }
              return task;
            });
            setTaskLists({
              ...taskLists,
              [sourceSubHubId]: { ...sourceList, tasks: updatedTasks }
            });
          }
        }}
        masterListTasks={masterListTasks}
        onUpdateMasterList={setMasterListTasks}
        highlightedTaskId={highlightedTaskId}
        onClearHighlight={() => setHighlightedTaskId(null)}
      />
      </div>
    );
  }

  // Router: Vouchers Hub
  if (currentScreen === 'vouchers-hub') {
    return (
      <VouchersHub
        voucherLists={voucherLists}
        onSelectList={(id) => {
          setActiveVoucherListId(id);
          setCurrentScreen('vouchers');
        }}
        onCreateList={(templateId, displayName, defaultType) => {
          const id = generateVoucherSubHubId(templateId);
          const newList = createVoucherSubHub(templateId, displayName, defaultType);
          setVoucherLists({
            ...voucherLists,
            [id]: newList
          });
        }}
        onDeleteList={(listId) => {
          const newLists = { ...voucherLists };
          delete newLists[listId];
          setVoucherLists(newLists);

          // If deleting the active list, clear active state
          if (activeVoucherListId === listId) {
            setActiveVoucherListId('');
          }
        }}
        onDeleteLists={(listIds) => {
          const newLists = { ...voucherLists };
          listIds.forEach(listId => {
            delete newLists[listId];
          });
          setVoucherLists(newLists);

          // If active list was deleted, clear active state
          if (listIds.includes(activeVoucherListId)) {
            setActiveVoucherListId('');
          }
        }}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // Router: Voucher List
  if (currentScreen === 'vouchers') {
    const currentVoucherList = voucherLists[activeVoucherListId];
    if (!currentVoucherList) {
      setCurrentScreen('vouchers-hub');
      return null;
    }

    return (
      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
        <VoucherList
        listName={currentVoucherList.name}
        listId={currentVoucherList.id}
        vouchers={currentVouchers}
        onUpdateVouchers={setCurrentVouchers}
        onBack={() => {
          setCurrentScreen('vouchers-hub');
          setTimeout(() => {
            scrollToHub('vouchers');
          }, 0);
        }}
      />
      </div>
    );
  }
}

export default App

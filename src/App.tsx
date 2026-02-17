import { useState, useEffect, useRef } from 'react'
import { ShoppingBag, ListTodo, Gift, Settings } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'
import AuthScreen from './components/AuthScreen'
import SettingsModal from './components/SettingsModal'
import ShoppingHub from './components/ShoppingHub'
import ShoppingList from './components/ShoppingList'
import TasksHub from './components/TasksHub'
import TaskList from './components/TaskList'
import VouchersHub from './components/VouchersHub'
import VoucherList from './components/VoucherList'
import { ShoppingService } from './utils/supabaseShoppingService'
import { MasterListService } from './utils/supabaseMasterListService'
import { TaskService } from './utils/supabaseTaskService'
import { VoucherService } from './utils/supabaseVoucherService'
import { supabase } from './supabaseClient'
import { getUrgentTasks } from './utils/supabaseTaskService'
import type {
  MasterListItem,
  ListInstance,
  Task,
  TaskListInstance,
  VoucherListInstance,
  VoucherItem
} from './types/base'


function App() {
  const { user, profile, loading } = useAuth();

  // Lock body scroll when authenticated (app uses its own scroll containers)
  // Release lock on auth screens so forms can scroll on small phones
  useEffect(() => {
    if (user && profile) {
      document.body.classList.add('app-locked');
    } else {
      document.body.classList.remove('app-locked');
    }
    return () => document.body.classList.remove('app-locked');
  }, [user, profile]);

  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping-hub' | 'shopping' | 'home-tasks-hub' | 'home-tasks' | 'vouchers-hub' | 'vouchers'>('dashboard');

  // Mobile Card Stack Navigation
  const [activeHub, setActiveHub] = useState<'shopping' | 'tasks' | 'vouchers'>('shopping');
  const [isLandingMode, setIsLandingMode] = useState(true); // Landing vs Active mode
  const cardStackRef = useRef<HTMLDivElement>(null);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  // Shopping lists state — populated from Supabase on mount
  const [lists, setLists] = useState<Record<string, ListInstance>>({});

  // Active list ID — persisted as UI preference only
  const [activeListId, setActiveListId] = useState<string>(
    () => localStorage.getItem('homehub-active-list') || ''
  );

  // Master list (ID-based with Flexible Memory V2 — still in localStorage)
  // Starts empty; loads when activeListId is set
  const [masterListItems, setMasterListItems] = useState<MasterListItem[]>([]);

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

  // Task lists — populated from Supabase on mount
  const [taskLists, setTaskLists] = useState<Record<string, TaskListInstance>>({
    'home-tasks_urgent': { id: 'home-tasks_urgent', name: 'Urgent Tasks', tasks: [] }
  });

  // Active task list ID — persisted as UI preference only
  const [activeTaskListId, setActiveTaskListId] = useState<string>(
    () => localStorage.getItem('homehub-active-task-list') || 'home-tasks_urgent'
  );

  // Highlighted task ID for flashlight effect
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  // Task master list items
  const [masterListTasks, setMasterListTasks] = useState<Task[]>([]);

  // ── Supabase: load task lists + subscribe ──────────────────────────────────
  useEffect(() => {
    if (!profile?.household_id) return;

    let isMounted = true;

    const loadTaskData = async () => {
      try {
        const dbLists = await TaskService.fetchLists(profile.household_id);
        const listsRecord: Record<string, TaskListInstance> = {};

        await Promise.all(
          dbLists.map(async (list) => {
            const dbTasks = await TaskService.fetchTasks(list.id);
            listsRecord[list.id] = {
              id:    list.id,
              name:  list.name,
              tasks: dbTasks.map((t) => ({
                id:       t.id,
                name:     t.name,
                status:   t.status,
                urgency:  t.urgency,
                dueDate:  t.dueDate,
                assignee: t.assignee,
              })),
            };
          })
        );

        if (isMounted) {
          // Recompute urgent tasks from freshly loaded data
          const urgentTasks = getUrgentTasks(listsRecord);
          listsRecord['home-tasks_urgent'] = {
            id: 'home-tasks_urgent', name: 'Urgent Tasks', tasks: urgentTasks,
          };
          setTaskLists(listsRecord);
          setActiveTaskListId((prev) => {
            if (prev === 'home-tasks_urgent') return prev;
            if (prev && listsRecord[prev]) return prev;
            return 'home-tasks_urgent';
          });
        }
      } catch (err) {
        console.error('[Tasks] Failed to load from Supabase:', err);
      }
    };

    loadTaskData();

    const channel = TaskService.subscribeToLists(profile.household_id, () => {
      if (isMounted) loadTaskData();
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.household_id]);

  // ── Supabase: subscribe to tasks while a list is open ─────────────────────
  useEffect(() => {
    if (currentScreen !== 'home-tasks' || !activeTaskListId || activeTaskListId === 'home-tasks_urgent') return;

    const channel = TaskService.subscribeToTasks(activeTaskListId, (dbTasks) => {
      setTaskLists((prev) => {
        const updatedList: TaskListInstance = {
          ...prev[activeTaskListId],
          tasks: dbTasks.map((t) => ({
            id:       t.id,
            name:     t.name,
            status:   t.status,
            urgency:  t.urgency,
            dueDate:  t.dueDate,
            assignee: t.assignee,
          })),
        };
        const next = { ...prev, [activeTaskListId]: updatedList };
        // Recompute urgent tasks
        next['home-tasks_urgent'] = {
          id: 'home-tasks_urgent', name: 'Urgent Tasks',
          tasks: getUrgentTasks(next),
        };
        return next;
      });
    });

    return () => { supabase.removeChannel(channel); };
  }, [currentScreen, activeTaskListId]);

  // ── Master tasks: load from Supabase when active list changes ─────────────
  useEffect(() => {
    if (!activeTaskListId || activeTaskListId === 'home-tasks_urgent') {
      setMasterListTasks([]);
      return;
    }
    TaskService.fetchMasterItems(activeTaskListId)
      .then((items) => setMasterListTasks(
        items.map((i) => ({
          id:       i.id,
          name:     i.name,
          status:   i.status,
          urgency:  i.urgency,
          dueDate:  i.dueDate,
          assignee: i.assignee,
        }))
      ))
      .catch((err) => console.error('[TaskMaster] Failed to load:', err));
  }, [activeTaskListId]);

  // ── UI preference: persist active task list ID ─────────────────────────────
  useEffect(() => {
    localStorage.setItem('homehub-active-task-list', activeTaskListId);
  }, [activeTaskListId]);

  // ── Keep urgent tasks view in sync when task lists change ─────────────────
  useEffect(() => {
    const urgentTasks = getUrgentTasks(taskLists);
    const currentUrgent = taskLists['home-tasks_urgent'];
    const hasChanged = !currentUrgent ||
      JSON.stringify(currentUrgent.tasks) !== JSON.stringify(urgentTasks);

    if (hasChanged) {
      setTaskLists((prev) => ({
        ...prev,
        'home-tasks_urgent': { id: 'home-tasks_urgent', name: 'Urgent Tasks', tasks: urgentTasks },
      }));
    }
  }, [JSON.stringify(
    Object.values(taskLists)
      .filter((l) => l.id !== 'home-tasks_urgent')
      .map((l) => l.tasks)
  )]);

  // =====================================================================
  // END TASK LISTS STATE & MANAGEMENT
  // =====================================================================

  // =====================================================================
  // VOUCHER LISTS STATE & MANAGEMENT
  // =====================================================================

  // Voucher lists — populated from Supabase on mount
  const [voucherLists, setVoucherLists] = useState<Record<string, VoucherListInstance>>({});

  // Active voucher list ID
  const [activeVoucherListId, setActiveVoucherListId] = useState<string>('');

  // Current vouchers for the active list
  const [currentVouchers, setCurrentVouchers] = useState<VoucherItem[]>([]);

  // ── Supabase: load voucher lists + subscribe ───────────────────────────────
  useEffect(() => {
    if (!profile?.household_id) return;

    let isMounted = true;

    const loadVoucherData = async () => {
      try {
        const dbLists = await VoucherService.fetchLists(profile.household_id);
        const listsRecord: Record<string, VoucherListInstance> = {};
        dbLists.forEach((list) => { listsRecord[list.id] = list; });

        if (isMounted) {
          setVoucherLists(listsRecord);
          setActiveVoucherListId((prev) => {
            if (prev && listsRecord[prev]) return prev;
            return Object.keys(listsRecord)[0] || '';
          });
        }
      } catch (err) {
        console.error('[Vouchers] Failed to load from Supabase:', err);
      }
    };

    loadVoucherData();

    const channel = VoucherService.subscribeToLists(profile.household_id, () => {
      if (isMounted) loadVoucherData();
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.household_id]);

  // ── Sync currentVouchers when active list changes ─────────────────────────
  useEffect(() => {
    if (!activeVoucherListId) return;
    setCurrentVouchers(voucherLists[activeVoucherListId]?.items || []);
  }, [activeVoucherListId, voucherLists]);

  // ── Supabase: subscribe to voucher item changes while list is open ─────────
  useEffect(() => {
    if (currentScreen !== 'vouchers' || !activeVoucherListId) return;

    const channel = VoucherService.subscribeToItems(activeVoucherListId, (items) => {
      setCurrentVouchers(items);
      setVoucherLists((prev) => ({
        ...prev,
        [activeVoucherListId]: { ...prev[activeVoucherListId], items },
      }));
    });

    return () => { supabase.removeChannel(channel); };
  }, [currentScreen, activeVoucherListId]);

  // =====================================================================
  // END VOUCHER LISTS STATE & MANAGEMENT
  // =====================================================================

  // ── Supabase: load shopping lists + subscribe to realtime changes ──────────
  useEffect(() => {
    if (!profile?.household_id) return;

    let isMounted = true;

    const loadShoppingData = async () => {
      try {
        const dbLists = await ShoppingService.fetchLists(profile.household_id);
        const listsRecord: Record<string, ListInstance> = {};

        await Promise.all(
          dbLists.map(async (list) => {
            const dbItems = await ShoppingService.fetchItems(list.id);
            listsRecord[list.id] = {
              id: list.id,
              name: list.name,
              items: dbItems.map((item) => ({
                id: item.id,
                text: item.text,
                completed: item.isCompleted,
                category: item.category,
              })),
            };
          })
        );

        if (isMounted) {
          setLists(listsRecord);
          // Keep saved activeListId if it still exists, else fall back to first list
          setActiveListId((prev) => {
            if (prev && listsRecord[prev]) return prev;
            return Object.keys(listsRecord)[0] || '';
          });
        }
      } catch (err) {
        console.error('[Shopping] Failed to load from Supabase:', err);
      }
    };

    loadShoppingData();

    // Realtime: re-fetch all shopping data when another device adds/deletes a list
    const channel = ShoppingService.subscribeToLists(profile.household_id, () => {
      if (isMounted) loadShoppingData();
    });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.household_id]);

  // ── Supabase: subscribe to item changes while a list is open ───────────────
  useEffect(() => {
    if (currentScreen !== 'shopping' || !activeListId) return;

    const channel = ShoppingService.subscribeToListItems(activeListId, (dbItems) => {
      setLists((prev) => ({
        ...prev,
        [activeListId]: {
          ...prev[activeListId],
          items: dbItems.map((item) => ({
            id: item.id,
            text: item.text,
            completed: item.isCompleted,
            category: item.category,
          })),
        },
      }));
    });

    return () => { supabase.removeChannel(channel); };
  }, [currentScreen, activeListId]);

  // ── UI preference: persist active list ID ─────────────────────────────────
  useEffect(() => {
    if (activeListId) localStorage.setItem('homehub-active-list', activeListId);
  }, [activeListId]);

  // ── Master List: load from Supabase when active Sub-Hub changes ───────────
  useEffect(() => {
    if (!activeListId) return;

    MasterListService.fetchItems(activeListId)
      .then((dbItems) => {
        setMasterListItems(
          dbItems.map((item) => ({
            id:       item.id,
            text:     item.text,
            category: item.category,
          }))
        );
      })
      .catch((err) => console.error('[MasterList] Failed to load:', err));
  }, [activeListId]);

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

      Array.from(container.children).forEach((card) => {
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

  // Auth Gate - Show loading or login screen
  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: '#F5F2E7' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#63060633', borderTopColor: '#630606' }}></div>
          <p className="text-sm" style={{ color: '#8E806A' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreen />;
  }

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
        {/* Fixed Header - Logo + Settings */}
        <header
          className="absolute top-0 left-0 w-full h-16 z-50 flex items-center justify-between px-4 backdrop-blur-md border-b"
          style={{
            backgroundColor: 'rgba(245, 242, 231, 0.9)',
            borderColor: '#8E806A22'
          }}
        >
          <div className="w-10"></div> {/* Spacer for centering */}
          <button
            onClick={returnToHome}
            className="text-center transition-all hover:opacity-70 active:scale-95"
          >
            <h1 className="text-2xl font-bold" style={{ color: '#630606' }}>HomeHub</h1>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-[#63060611]"
            style={{ color: '#630606' }}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </header>

        {/* Landing Page Layout */}
        {isLandingMode ? (
          <div className="absolute top-16 left-0 right-0 bottom-0 overflow-hidden flex flex-col">
            {/* Subtle Small Greeting */}
            <div className="flex-shrink-0 flex items-center justify-center pt-8 pb-6">
              <h2 className="text-xl font-medium" style={{ color: '#630606' }}>
                Welcome home, {profile?.display_name}.
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
                  if (!profile?.household_id) return;
                  ShoppingService.createList(profile.household_id, name)
                    .then((newList) => {
                      setLists((prev) => ({
                        ...prev,
                        [newList.id]: { id: newList.id, name: newList.name, items: [] },
                      }));
                      setActiveListId(newList.id);
                    })
                    .catch((err) => console.error('[Shopping] createList failed:', err));
                }}
                onEditList={(listId, newName) => {
                  // Optimistic update
                  setLists((prev) => ({
                    ...prev,
                    [listId]: { ...prev[listId], name: newName },
                  }));
                  ShoppingService.updateList(listId, { name: newName })
                    .catch((err) => console.error('[Shopping] updateList failed:', err));
                }}
                onDeleteList={(listId) => {
                  // Optimistic update
                  setLists((prev) => {
                    const next = { ...prev };
                    delete next[listId];
                    return next;
                  });
                  if (activeListId === listId) {
                    setActiveListId(Object.keys(lists).find((id) => id !== listId) || '');
                  }
                  ShoppingService.deleteList(listId)
                    .catch((err) => console.error('[Shopping] deleteList failed:', err));
                }}
                onDeleteLists={(listIds) => {
                  // Optimistic update
                  setLists((prev) => {
                    const next = { ...prev };
                    listIds.forEach((id) => delete next[id]);
                    return next;
                  });
                  if (listIds.includes(activeListId)) {
                    setActiveListId(Object.keys(lists).find((id) => !listIds.includes(id)) || '');
                  }
                  Promise.all(listIds.map((id) => ShoppingService.deleteList(id)))
                    .catch((err) => console.error('[Shopping] deleteLists failed:', err));
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
                  if (!profile?.household_id) return;
                  TaskService.createList(profile.household_id, name)
                    .then((newList) => {
                      setTaskLists((prev) => ({
                        ...prev,
                        [newList.id]: { id: newList.id, name: newList.name, tasks: [] },
                      }));
                      setActiveTaskListId(newList.id);
                    })
                    .catch((err) => console.error('[Tasks] createList failed:', err));
                }}
                onEditList={(listId, newName) => {
                  setTaskLists((prev) => ({
                    ...prev,
                    [listId]: { ...prev[listId], name: newName },
                  }));
                  TaskService.updateList(listId, newName)
                    .catch((err) => console.error('[Tasks] updateList failed:', err));
                }}
                onDeleteList={(listId) => {
                  setTaskLists((prev) => {
                    const next = { ...prev };
                    delete next[listId];
                    return next;
                  });
                  if (activeTaskListId === listId) {
                    setActiveTaskListId(
                      Object.keys(taskLists).find((id) => id !== listId && id !== 'home-tasks_urgent') || 'home-tasks_urgent'
                    );
                  }
                  TaskService.deleteList(listId)
                    .catch((err) => console.error('[Tasks] deleteList failed:', err));
                }}
                onDeleteLists={(listIds) => {
                  setTaskLists((prev) => {
                    const next = { ...prev };
                    listIds.forEach((id) => delete next[id]);
                    return next;
                  });
                  if (listIds.includes(activeTaskListId)) {
                    setActiveTaskListId(
                      Object.keys(taskLists).find((id) => !listIds.includes(id) && id !== 'home-tasks_urgent') || 'home-tasks_urgent'
                    );
                  }
                  Promise.all(listIds.map((id) => TaskService.deleteList(id)))
                    .catch((err) => console.error('[Tasks] deleteLists failed:', err));
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
                onCreateList={(_templateId, displayName, defaultType) => {
                  if (!profile?.household_id) return;
                  const name = displayName || _templateId;
                  VoucherService.createList(profile.household_id, name, defaultType)
                    .then((newList) => {
                      const full = { ...newList, items: [] };
                      setVoucherLists((prev) => ({ ...prev, [newList.id]: full }));
                      setActiveVoucherListId(newList.id);
                    })
                    .catch((err) => console.error('[Vouchers] createList failed:', err));
                }}
                onDeleteList={(listId) => {
                  setVoucherLists((prev) => {
                    const next = { ...prev };
                    delete next[listId];
                    return next;
                  });
                  if (activeVoucherListId === listId) setActiveVoucherListId('');
                  VoucherService.deleteList(listId)
                    .catch((err) => console.error('[Vouchers] deleteList failed:', err));
                }}
                onDeleteLists={(listIds) => {
                  setVoucherLists((prev) => {
                    const next = { ...prev };
                    listIds.forEach((id) => delete next[id]);
                    return next;
                  });
                  if (listIds.includes(activeVoucherListId)) setActiveVoucherListId('');
                  Promise.all(listIds.map((id) => VoucherService.deleteList(id)))
                    .catch((err) => console.error('[Vouchers] deleteLists failed:', err));
                }}
                onBack={returnToHome}
              />
            </div>
          </div>
        </div>
        )}

        {/* Bottom Navigation - Only in Active Mode */}
        {!isLandingMode && renderBottomNav()}

        {/* Settings Modal */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
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
        onUpdateItems={async (newItems) => {
          const prevItems = currentList.items;

          // Optimistic update — instant UI response
          setLists((prev) => ({
            ...prev,
            [activeListId]: { ...prev[activeListId], items: newItems },
          }));

          // Diff to determine exact Supabase operations needed
          const prevMap = new Map(prevItems.map((i) => [i.id, i]));
          const newMap  = new Map(newItems.map((i) => [i.id, i]));

          const added   = newItems.filter((i) => !prevMap.has(i.id));
          const removed = prevItems.filter((i) => !newMap.has(i.id));
          const changed = newItems.filter((i) => {
            const p = prevMap.get(i.id);
            return p && (p.completed !== i.completed || p.text !== i.text || p.category !== i.category);
          });

          try {
            // Insert new items using the client-generated UUID as the DB id
            if (added.length > 0) {
              await supabase.from('shopping_items').insert(
                added.map((item) => ({
                  id: item.id,
                  list_id: activeListId,
                  text: item.text,
                  category: item.category ?? null,
                  is_completed: item.completed,
                }))
              );
            }
            // Delete removed items
            await Promise.all(removed.map((item) => ShoppingService.deleteItem(item.id)));
            // Patch changed items
            await Promise.all(
              changed.map((item) => {
                const prev = prevMap.get(item.id)!;
                const patch: Record<string, unknown> = {};
                if (prev.completed !== item.completed) patch['is_completed'] = item.completed;
                if (prev.text !== item.text)           patch['text']         = item.text;
                if (prev.category !== item.category)   patch['category']     = item.category ?? null;
                return supabase.from('shopping_items').update(patch).eq('id', item.id);
              })
            );
          } catch (err) {
            console.error('[Shopping] Failed to sync items to Supabase:', err);
          }
        }}
        onBack={() => {
          setCurrentScreen('shopping-hub');
          setTimeout(() => {
            scrollToHub('shopping');
          }, 0);
        }}
        masterListItems={masterListItems}
        onUpdateMasterList={async (newItems) => {
          const prevItems = masterListItems;

          // Optimistic update
          setMasterListItems(newItems);

          // Diff: sync only what changed to Supabase
          const prevMap = new Map(prevItems.map((i) => [i.id, i]));
          const newMap  = new Map(newItems.map((i) => [i.id, i]));

          const added   = newItems.filter((i) => !prevMap.has(i.id));
          const removed = prevItems.filter((i) => !newMap.has(i.id));
          const changed = newItems.filter((i) => {
            const p = prevMap.get(i.id);
            return p && (p.text !== i.text || p.category !== i.category);
          });

          try {
            if (added.length > 0) {
              await MasterListService.addItems(
                activeListId,
                added.map((item) => ({ id: item.id, text: item.text, category: item.category }))
              );
            }
            await Promise.all(removed.map((item) => MasterListService.deleteItem(item.id)));
            await Promise.all(
              changed.map((item) =>
                MasterListService.updateItem(item.id, { text: item.text, category: item.category })
              )
            );
          } catch (err) {
            console.error('[MasterList] Failed to sync to Supabase:', err);
          }
        }}
        categories={categories}
        capitalizeFirstLetter={capitalizeFirstLetter}
        autoCategorize={autoCategorize}
      />
      </div>
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
        onUpdateTasks={async (newTasks) => {
          if (isUrgentView) return;

          const prevTasks = currentTaskList.tasks;

          // Optimistic update
          setTaskLists((prev) => ({
            ...prev,
            [activeTaskListId]: { ...prev[activeTaskListId], tasks: newTasks },
          }));

          // Diff and sync to Supabase
          const prevMap = new Map(prevTasks.map((t) => [t.id, t]));
          const newMap  = new Map(newTasks.map((t) => [t.id, t]));

          const added   = newTasks.filter((t) => !prevMap.has(t.id));
          const removed = prevTasks.filter((t) => !newMap.has(t.id));
          const changed = newTasks.filter((t) => {
            const p = prevMap.get(t.id);
            return p && JSON.stringify(p) !== JSON.stringify(t);
          });

          try {
            await Promise.all([
              ...added.map((t) => TaskService.upsertTask(activeTaskListId, t.id, {
                name: t.name, status: t.status || 'Not Started',
                urgency: t.urgency, dueDate: t.dueDate as string | undefined,
                assignee: t.assignee,
              })),
              ...removed.map((t) => TaskService.deleteTask(t.id)),
              ...changed.map((t) => TaskService.upsertTask(activeTaskListId, t.id, {
                name: t.name, status: t.status || 'Not Started',
                urgency: t.urgency, dueDate: t.dueDate as string | undefined,
                assignee: t.assignee,
              })),
            ]);
          } catch (err) {
            console.error('[Tasks] Failed to sync to Supabase:', err);
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
        }}
        onUpdateUrgentTask={async (sourceSubHubId, taskId) => {
          const sourceList = taskLists[sourceSubHubId];
          if (!sourceList) return;

          const task = sourceList.tasks.find((t) => t.id === taskId);
          if (!task) return;

          const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
          const updatedTask = { ...task, status: newStatus };

          // Optimistic update
          setTaskLists((prev) => ({
            ...prev,
            [sourceSubHubId]: {
              ...prev[sourceSubHubId],
              tasks: prev[sourceSubHubId].tasks.map((t) => t.id === taskId ? updatedTask : t),
            },
          }));

          try {
            await TaskService.upsertTask(sourceSubHubId, taskId, {
              name: updatedTask.name, status: newStatus,
              urgency: updatedTask.urgency,
              dueDate: updatedTask.dueDate as string | undefined,
              assignee: updatedTask.assignee,
            });
          } catch (err) {
            console.error('[Tasks] Failed to update urgent task:', err);
          }
        }}
        masterListTasks={masterListTasks}
        onUpdateMasterList={async (newTasks) => {
          const prevTasks = masterListTasks;
          setMasterListTasks(newTasks);

          const prevMap = new Map(prevTasks.map((t) => [t.id, t]));
          const newMap  = new Map(newTasks.map((t) => [t.id, t]));

          const added   = newTasks.filter((t) => !prevMap.has(t.id));
          const removed = prevTasks.filter((t) => !newMap.has(t.id));
          const changed = newTasks.filter((t) => {
            const p = prevMap.get(t.id);
            return p && JSON.stringify(p) !== JSON.stringify(t);
          });

          try {
            await Promise.all([
              ...added.map((t) => TaskService.upsertMasterItem(activeTaskListId, t.id, {
                name: t.name, status: t.status || 'Not Started',
                urgency: t.urgency, dueDate: t.dueDate as string | undefined,
                assignee: t.assignee,
              })),
              ...removed.map((t) => TaskService.deleteMasterItem(t.id)),
              ...changed.map((t) => TaskService.upsertMasterItem(activeTaskListId, t.id, {
                name: t.name, status: t.status || 'Not Started',
                urgency: t.urgency, dueDate: t.dueDate as string | undefined,
                assignee: t.assignee,
              })),
            ]);
          } catch (err) {
            console.error('[TaskMaster] Failed to sync to Supabase:', err);
          }
        }}
        highlightedTaskId={highlightedTaskId ?? null}
        onClearHighlight={() => setHighlightedTaskId(null)}
      />
      </div>
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
        onUpdateVouchers={async (newVouchers) => {
          const prevVouchers = currentVouchers;

          // Optimistic update
          setCurrentVouchers(newVouchers);
          setVoucherLists((prev) => ({
            ...prev,
            [activeVoucherListId]: { ...prev[activeVoucherListId], items: newVouchers },
          }));

          // Diff and sync to Supabase
          const prevMap = new Map(prevVouchers.map((v) => [v.id, v]));
          const newMap  = new Map(newVouchers.map((v) => [v.id, v]));

          const added   = newVouchers.filter((v) => !prevMap.has(v.id));
          const removed = prevVouchers.filter((v) => !newMap.has(v.id));
          const changed = newVouchers.filter((v) => {
            const p = prevMap.get(v.id);
            return p && JSON.stringify(p) !== JSON.stringify(v);
          });

          try {
            await Promise.all([
              ...added.map((v)   => VoucherService.upsertItem(activeVoucherListId, v.id, v)),
              ...removed.map((v) => VoucherService.deleteItem(v.id)),
              ...changed.map((v) => VoucherService.upsertItem(activeVoucherListId, v.id, v)),
            ]);
          } catch (err) {
            console.error('[Vouchers] Failed to sync to Supabase:', err);
          }
        }}
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

import { useState, useEffect } from 'react'

interface ShoppingItem {
  id: number;
  text: string;
  completed: boolean;
  category?: string;
}

interface MasterListItem {
  id: number;
  text: string;
  category?: string;
}

interface DuplicateCheck {
  name: string;
  onConfirm: () => void;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping'>('dashboard');

  // Active shopping list
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('homehub-items');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Milk', completed: false },
      { id: 2, text: 'Eggs', completed: false },
    ];
  });

  // Master list state
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

  const [newItem, setNewItem] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Master list UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMasterListEditMode, setIsMasterListEditMode] = useState(false);
  const [masterListEditingId, setMasterListEditingId] = useState<number | null>(null);
  const [masterListEditText, setMasterListEditText] = useState('');
  const [masterListEditCategory, setMasterListEditCategory] = useState('');
  const [newMasterItem, setNewMasterItem] = useState('');

  // Duplicate check state
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);

  const categories = ['Dairy', 'Meat', 'Fish', 'Pantry', 'Vegetables', 'Fruit', 'Cleaning'];

  // Helper: Capitalize first letter
  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Helper: Check if item already exists in active list (case-insensitive)
  const checkDuplicate = (itemName: string): boolean => {
    const normalized = itemName.toLowerCase().trim();
    return items.some(item => item.text.toLowerCase().trim() === normalized);
  };

  // Auto-categorization helper
  const autoCategorize = (itemName: string): string => {
    const name = itemName.toLowerCase().trim();

    const categoryMap: Record<string, string[]> = {
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'mozzarella', 'cheddar', 'ice cream'],
      'Meat': ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'sausage', 'bacon', 'ham', 'steak', 'ground beef', 'meatball'],
      'Fish': ['salmon', 'tuna', 'cod', 'shrimp', 'fish', 'tilapia', 'crab', 'lobster', 'sardine', 'anchovy'],
      'Vegetables': ['tomato', 'lettuce', 'carrot', 'onion', 'potato', 'broccoli', 'cucumber', 'pepper', 'spinach', 'celery', 'garlic', 'cabbage', 'zucchini', 'eggplant', 'mushroom'],
      'Fruit': ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'mango', 'pineapple', 'watermelon', 'pear', 'peach', 'lemon', 'lime', 'cherry', 'kiwi'],
      'Cleaning': ['soap', 'detergent', 'bleach', 'sponge', 'cleaner', 'paper towel', 'tissue', 'toilet paper', 'dish soap', 'laundry', 'wipes'],
      'Pharma & Hygiene': ['toothpaste', 'toothbrush', 'shampoo', 'conditioner', 'deodorant', 'vitamin', 'aspirin', 'band-aid', 'sunscreen', 'razor', 'floss', 'lotion', 'pads', 'tampons']
    };

    // Check if any keyword matches
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => name.includes(keyword))) {
        return category;
      }
    }

    return 'Pantry'; // Default category
  };

  // Auto-save active list to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-items', JSON.stringify(items));
  }, [items]);

  // Auto-save master list to localStorage
  useEffect(() => {
    localStorage.setItem('homehub-masterlist', JSON.stringify(masterListItems));
  }, [masterListItems]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const capitalizedText = capitalizeFirstLetter(newItem.trim());
    const category = autoCategorize(capitalizedText);

    // Check for duplicate
    if (checkDuplicate(capitalizedText)) {
      setDuplicateCheck({
        name: capitalizedText,
        onConfirm: () => {
          setItems([{
            id: Date.now(),
            text: capitalizedText,
            completed: false,
            category: category
          }, ...items]);
          setNewItem('');
          setDuplicateCheck(null);
        }
      });
      return;
    }

    // No duplicate, add directly
    setItems([{
      id: Date.now(),
      text: capitalizedText,
      completed: false,
      category: category
    }, ...items]);
    setNewItem('');
    setSelectedCategory('');
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    setItems(items.filter(item => !item.completed));
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditCategory(item.category || '');
  };

  const saveEdit = () => {
    if (!editText.trim() || editingId === null) return;

    const capitalizedText = capitalizeFirstLetter(editText.trim());

    setItems(items.map(item =>
      item.id === editingId
        ? { ...item, text: capitalizedText, category: editCategory || undefined }
        : item
    ));
    setEditingId(null);
    setEditText('');
    setEditCategory('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditCategory('');
  };

  // --- Master List Functions ---

  // Add item from master list to active list
  const addFromMasterList = (masterItem: MasterListItem) => {
    const capitalizedText = capitalizeFirstLetter(masterItem.text.trim());

    // Check for duplicate
    if (checkDuplicate(capitalizedText)) {
      setDuplicateCheck({
        name: capitalizedText,
        onConfirm: () => {
          setItems([{
            id: Date.now(),
            text: capitalizedText,
            completed: false,
            category: masterItem.category
          }, ...items]);
          setDuplicateCheck(null);
        }
      });
      return;
    }

    // No duplicate, add directly
    setItems([{
      id: Date.now(),
      text: capitalizedText,
      completed: false,
      category: masterItem.category
    }, ...items]);
  };

  // Add new item to master list
  const addToMasterList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterItem.trim()) return;

    const capitalizedText = capitalizeFirstLetter(newMasterItem.trim());
    const category = autoCategorize(capitalizedText);

    setMasterListItems([{
      id: Date.now(),
      text: capitalizedText,
      category: category
    }, ...masterListItems]);
    setNewMasterItem('');
  };

  // Delete item from master list
  const deleteMasterListItem = (id: number) => {
    setMasterListItems(masterListItems.filter(item => item.id !== id));
  };

  // Start editing master list item
  const startEditingMasterItem = (item: MasterListItem) => {
    setMasterListEditingId(item.id);
    setMasterListEditText(item.text);
    setMasterListEditCategory(item.category || '');
  };

  // Save master list edit
  const saveMasterEdit = () => {
    if (!masterListEditText.trim() || masterListEditingId === null) return;

    const capitalizedText = capitalizeFirstLetter(masterListEditText.trim());

    setMasterListItems(masterListItems.map(item =>
      item.id === masterListEditingId
        ? { ...item, text: capitalizedText, category: masterListEditCategory || undefined }
        : item
    ));
    setMasterListEditingId(null);
    setMasterListEditText('');
    setMasterListEditCategory('');
  };

  // Cancel master list edit
  const cancelMasterEdit = () => {
    setMasterListEditingId(null);
    setMasterListEditText('');
    setMasterListEditCategory('');
  };

  // Group master list items by category
  const groupedMasterItems = () => {
    const grouped: Record<string, MasterListItem[]> = {};

    // Initialize all categories
    categories.forEach(cat => {
      grouped[cat] = [];
    });
    grouped['Other'] = [];

    // Group items
    masterListItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    return grouped;
  };

  // Group items by category and sort within each group
  const groupedItems = () => {
    const grouped: Record<string, ShoppingItem[]> = {};

    // Initialize all categories
    categories.forEach(cat => {
      grouped[cat] = [];
    });
    grouped['Other'] = [];

    // Group items
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    // Sort within each category: incomplete first, completed last
    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    });

    return grouped;
  };


  // --- מסך רשימת קניות ---
  if (currentScreen === 'shopping') {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
        <header className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="text-2xl hover:opacity-50 transition-opacity"
              >
                ←
              </button>
              {/* Master List Button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 hover:bg-[#63060611] rounded-lg transition-colors"
                style={{ color: '#630606' }}
                title="Open Master List"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>Shopping List</h1>
            </div>
            <span className="text-sm font-medium" style={{ color: '#8E806A' }}>
              {items.filter(i => !i.completed).length} items left
            </span>
          </div>
          {items.some(i => i.completed) && (
            <div className="flex justify-end">
              <button
                onClick={clearCompleted}
                className="text-sm px-4 py-2 rounded-full hover:bg-[#63060611] transition-colors"
                style={{ color: '#630606' }}
              >
                Clear Completed ({items.filter(i => i.completed).length})
              </button>
            </div>
          )}
        </header>

        <main className="max-w-4xl mx-auto">
          {/* שדה הוספה */}
          <form onSubmit={addItem} className="mb-8">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add something to the list..."
              className="w-full p-5 rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-[#8E806A44] outline-none text-lg"
              style={{ color: '#8E806A' }}
            />
          </form>

          {/* הצגת הפריטים */}
          <div className="space-y-8">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block opacity-30">🛒</span>
                <p className="text-lg opacity-50" style={{ color: '#8E806A' }}>
                  Your shopping list is empty
                </p>
              </div>
            ) : (
              Object.entries(groupedItems()).map(([category, categoryItems]) => {
                // Skip empty categories
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category}>
                    {/* Category Headline */}
                    <h2
                      className="text-base font-bold uppercase tracking-wide mb-3 px-1 flex items-center gap-2"
                      style={{ color: '#630606' }}
                    >
                      {category}
                      <span className="text-xs font-normal normal-case opacity-60">
                        ({categoryItems.filter(i => !i.completed).length})
                      </span>
                    </h2>

                    {/* Items in this category - Notepad style */}
                    <div className="bg-white rounded-xl overflow-hidden">
                      {categoryItems.map((item, index) => (
                        <div key={item.id}>
                          <div
                            className="p-4 flex items-center gap-4 group hover:bg-[#8E806A05] transition-colors"
                          >
                            {editingId === item.id ? (
                              // Edit Mode
                              <>
                                <div className="flex-1 space-y-3">
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#8E806A44] outline-none"
                                    style={{ color: '#8E806A' }}
                                    autoFocus
                                  />
                                  <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#8E806A44] outline-none text-sm"
                                    style={{ color: '#8E806A' }}
                                  >
                                    <option value="">Other</option>
                                    {categories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveEdit}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                                    style={{ backgroundColor: '#630606' }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                                    style={{ color: '#8E806A' }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              // View Mode
                              <>
                                {/* Checkbox */}
                                <div
                                  onClick={() => toggleItem(item.id)}
                                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
                                  style={{
                                    borderColor: item.completed ? '#630606' : '#8E806A33',
                                    backgroundColor: item.completed ? '#630606' : 'transparent'
                                  }}
                                >
                                  {item.completed && <span className="text-white text-xs font-bold">✓</span>}
                                </div>

                                {/* Item Text */}
                                <span
                                  onClick={() => toggleItem(item.id)}
                                  className={`flex-1 text-base transition-all cursor-pointer ${item.completed ? 'line-through opacity-40' : ''}`}
                                  style={{ color: '#8E806A' }}
                                >
                                  {item.text}
                                </span>

                                {/* Edit Button */}
                                <button
                                  onClick={() => startEditing(item)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-[#8E806A11] rounded-lg"
                                  style={{ color: '#8E806A' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg"
                                  style={{ color: '#630606' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                          {/* Subtle divider between items */}
                          {index < categoryItems.length - 1 && (
                            <div className="border-b border-[#8E806A11]"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Master List Drawer */}
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsDrawerOpen(false)}
            ></div>

            {/* Drawer */}
            <div className="fixed top-0 left-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="p-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>Master List</h2>
                  <div className="flex items-center gap-2">
                    {/* Edit Mode Toggle */}
                    <button
                      onClick={() => {
                        setIsMasterListEditMode(!isMasterListEditMode);
                        if (isMasterListEditMode) {
                          // Cancel any ongoing edits when leaving edit mode
                          cancelMasterEdit();
                          setNewMasterItem('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: isMasterListEditMode ? '#630606' : 'transparent',
                        color: isMasterListEditMode ? 'white' : '#630606',
                        border: isMasterListEditMode ? 'none' : '1px solid #63060633'
                      }}
                    >
                      {isMasterListEditMode ? 'Done' : 'Edit'}
                    </button>
                    {/* Close Button */}
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ color: '#8E806A' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Add Form (only in edit mode) */}
                {isMasterListEditMode && (
                  <form onSubmit={addToMasterList} className="mb-6">
                    <input
                      type="text"
                      value={newMasterItem}
                      onChange={(e) => setNewMasterItem(e.target.value)}
                      placeholder="Add to master list..."
                      className="w-full p-3 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#8E806A44] outline-none text-sm"
                      style={{ color: '#8E806A' }}
                    />
                  </form>
                )}

                {/* Master List Items */}
                <div className="space-y-6">
                  {masterListItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm opacity-50" style={{ color: '#8E806A' }}>
                        No items in master list
                      </p>
                    </div>
                  ) : (
                    Object.entries(groupedMasterItems()).map(([category, categoryItems]) => {
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category}>
                          {/* Category Headline */}
                          <h3
                            className="text-sm font-bold uppercase tracking-wide mb-2 px-1"
                            style={{ color: '#630606' }}
                          >
                            {category}
                          </h3>

                          {/* Items */}
                          <div className="bg-gray-50 rounded-lg overflow-hidden">
                            {categoryItems.map((item, index) => (
                              <div key={item.id}>
                                <div className="p-3 flex items-center gap-3 group hover:bg-white transition-colors">
                                  {masterListEditingId === item.id ? (
                                    // Edit Mode
                                    <>
                                      <div className="flex-1 space-y-2">
                                        <input
                                          type="text"
                                          value={masterListEditText}
                                          onChange={(e) => setMasterListEditText(e.target.value)}
                                          className="w-full p-2 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#8E806A44] outline-none text-sm"
                                          style={{ color: '#8E806A' }}
                                          autoFocus
                                        />
                                        <select
                                          value={masterListEditCategory}
                                          onChange={(e) => setMasterListEditCategory(e.target.value)}
                                          className="w-full p-2 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#8E806A44] outline-none text-xs"
                                          style={{ color: '#8E806A' }}
                                        >
                                          <option value="">Other</option>
                                          {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <button
                                          onClick={saveMasterEdit}
                                          className="px-2 py-1 rounded text-xs font-medium text-white transition-colors"
                                          style={{ backgroundColor: '#630606' }}
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelMasterEdit}
                                          className="px-2 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
                                          style={{ color: '#8E806A' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    // View Mode
                                    <>
                                      {/* Item Text */}
                                      <span
                                        onClick={() => !isMasterListEditMode && addFromMasterList(item)}
                                        className={`flex-1 text-sm ${!isMasterListEditMode ? 'cursor-pointer hover:opacity-70' : ''}`}
                                        style={{ color: '#8E806A' }}
                                      >
                                        {item.text}
                                      </span>

                                      {/* Edit/Delete Buttons (only in edit mode) */}
                                      {isMasterListEditMode && (
                                        <>
                                          <button
                                            onClick={() => startEditingMasterItem(item)}
                                            className="p-1.5 hover:bg-[#8E806A11] rounded transition-opacity"
                                            style={{ color: '#8E806A' }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => deleteMasterListItem(item.id)}
                                            className="p-1.5 hover:bg-red-50 rounded transition-opacity"
                                            style={{ color: '#630606' }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </div>
                                {index < categoryItems.length - 1 && (
                                  <div className="border-b border-[#8E806A11]"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Duplicate Confirmation Modal */}
        {duplicateCheck && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
                <h3 className="text-lg font-bold mb-2" style={{ color: '#630606' }}>
                  Item Already Exists
                </h3>
                <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
                  <span className="font-semibold">{duplicateCheck.name}</span> is already in the list. Add it anyway?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={duplicateCheck.onConfirm}
                    className="flex-1 py-2.5 rounded-lg font-medium text-white transition-colors"
                    style={{ backgroundColor: '#630606' }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => {
                      setDuplicateCheck(null);
                      setNewItem('');
                    }}
                    className="flex-1 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // --- מסך דאשבורד (בית) ---
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#630606' }}>HomeHub</h1>
        <p className="text-lg mt-2" style={{ color: '#8E806A', opacity: 0.8 }}>Welcome home, Mor.</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => setCurrentScreen('shopping')} 
          className="bg-white p-10 rounded-[40px] shadow-sm text-left hover:shadow-md transition-all active:scale-[0.95] flex flex-col border border-transparent"
        >
          <span className="text-4xl mb-4">🛒</span>
          <h2 className="text-2xl font-semibold" style={{ color: '#8E806A' }}>Shopping List</h2>
          <p className="text-sm mt-1" style={{ color: '#8E806A', opacity: 0.6 }}>Check what's missing in the pantry</p>
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
  )
}

export default App
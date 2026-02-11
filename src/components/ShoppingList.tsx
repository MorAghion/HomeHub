import { useState } from 'react';
import type { ShoppingItem, MasterListItem, DuplicateCheck } from '../App';
import MasterListDrawer from './MasterListDrawer';

interface ShoppingListProps {
  listName: string;
  items: ShoppingItem[];
  onUpdateItems: (items: ShoppingItem[]) => void;
  onBack: () => void;
  masterListItems: MasterListItem[];
  onUpdateMasterList: (items: MasterListItem[]) => void;
  categories: string[];
  capitalizeFirstLetter: (text: string) => string;
  autoCategorize: (text: string) => string;
}

function ShoppingList({
  listName,
  items,
  onUpdateItems,
  onBack,
  masterListItems,
  onUpdateMasterList,
  categories,
  capitalizeFirstLetter,
  autoCategorize,
}: ShoppingListProps) {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedItemsForDeletion, setSelectedItemsForDeletion] = useState<Set<number>>(new Set());
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);

  const checkDuplicate = (itemName: string): boolean => {
    const normalized = itemName.toLowerCase().trim();
    return items.some(item => item.text.toLowerCase().trim() === normalized);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const capitalizedText = capitalizeFirstLetter(newItem.trim());
    const category = autoCategorize(capitalizedText);

    if (checkDuplicate(capitalizedText)) {
      setDuplicateCheck({
        name: capitalizedText,
        onConfirm: () => {
          onUpdateItems([
            {
              id: Date.now(),
              text: capitalizedText,
              completed: false,
              category: category,
            },
            ...items,
          ]);
          setNewItem('');
          setDuplicateCheck(null);
        },
      });
      return;
    }

    onUpdateItems([
      {
        id: Date.now(),
        text: capitalizedText,
        completed: false,
        category: category,
      },
      ...items,
    ]);
    setNewItem('');
  };

  const toggleItem = (id: number) => {
    onUpdateItems(
      items.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteItem = (id: number) => {
    onUpdateItems(items.filter(item => item.id !== id));
  };

  const clearCompleted = () => {
    onUpdateItems(items.filter(item => !item.completed));
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditCategory(item.category || '');
  };

  const saveEdit = () => {
    if (!editText.trim() || editingId === null) return;

    const capitalizedText = capitalizeFirstLetter(editText.trim());

    onUpdateItems(
      items.map(item =>
        item.id === editingId
          ? { ...item, text: capitalizedText, category: editCategory || undefined }
          : item
      )
    );
    setEditingId(null);
    setEditText('');
    setEditCategory('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditCategory('');
  };

  const addFromMasterList = (masterItem: MasterListItem) => {
    const capitalizedText = capitalizeFirstLetter(masterItem.text.trim());

    if (checkDuplicate(capitalizedText)) {
      setDuplicateCheck({
        name: capitalizedText,
        onConfirm: () => {
          onUpdateItems([
            {
              id: Date.now(),
              text: capitalizedText,
              completed: false,
              category: masterItem.category,
            },
            ...items,
          ]);
          setDuplicateCheck(null);
        },
      });
      return;
    }

    onUpdateItems([
      {
        id: Date.now(),
        text: capitalizedText,
        completed: false,
        category: masterItem.category,
      },
      ...items,
    ]);
  };

  const addAllFromMasterList = () => {
    const itemsToAdd: MasterListItem[] = [];
    const duplicates: string[] = [];

    masterListItems.forEach(masterItem => {
      const capitalizedText = capitalizeFirstLetter(masterItem.text.trim());
      if (checkDuplicate(capitalizedText)) {
        duplicates.push(capitalizedText);
      } else {
        itemsToAdd.push(masterItem);
      }
    });

    if (duplicates.length > 0) {
      setDuplicateCheck({
        name: `${duplicates.length} item${duplicates.length > 1 ? 's' : ''} (${duplicates
          .slice(0, 3)
          .join(', ')}${duplicates.length > 3 ? '...' : ''})`,
        onConfirm: () => {
          const allItems = masterListItems.map(masterItem => ({
            id: Date.now() + Math.random(),
            text: capitalizeFirstLetter(masterItem.text.trim()),
            completed: false,
            category: masterItem.category,
          }));
          onUpdateItems([...allItems, ...items]);
          setDuplicateCheck(null);
        },
      });
      return;
    }

    const newItems = itemsToAdd.map(masterItem => ({
      id: Date.now() + Math.random(),
      text: capitalizeFirstLetter(masterItem.text.trim()),
      completed: false,
      category: masterItem.category,
    }));
    onUpdateItems([...newItems, ...items]);
  };

  const toggleItemSelection = (id: number) => {
    const newSelected = new Set(selectedItemsForDeletion);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItemsForDeletion(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItemsForDeletion.size === items.length) {
      setSelectedItemsForDeletion(new Set());
    } else {
      setSelectedItemsForDeletion(new Set(items.map(item => item.id)));
    }
  };

  const deleteSelectedItems = () => {
    onUpdateItems(items.filter(item => !selectedItemsForDeletion.has(item.id)));
    setSelectedItemsForDeletion(new Set());
    setIsBulkDeleteMode(false);
  };

  const cancelBulkDelete = () => {
    setSelectedItemsForDeletion(new Set());
    setIsBulkDeleteMode(false);
  };

  const groupedItems = () => {
    const grouped: Record<string, ShoppingItem[]> = {};

    categories.forEach(cat => {
      grouped[cat] = [];
    });
    grouped['Other'] = [];

    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    Object.keys(grouped).forEach(cat => {
      grouped[cat].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    });

    return grouped;
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-2xl hover:opacity-50 transition-opacity">
              ←
            </button>
            {/* Master List Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2 hover:bg-[#63060611] rounded-lg transition-colors"
              style={{ color: '#630606' }}
              title="Open Master List"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>
              {listName}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Bulk Delete Toggle */}
            {!isBulkDeleteMode && (
              <button
                onClick={() => setIsBulkDeleteMode(true)}
                className="p-2 hover:bg-[#63060611] rounded-lg transition-colors"
                style={{ color: '#630606' }}
                title="Bulk Delete Mode"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium" style={{ color: '#8E806A' }}>
              {items.filter(i => !i.completed).length} items left
            </span>
          </div>
        </div>

        {/* Bulk Delete Mode Actions */}
        {isBulkDeleteMode && (
          <div className="flex items-center justify-between mb-4 p-3 bg-[#63060611] rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: '#630606' }}>
                {selectedItemsForDeletion.size} selected
              </span>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedItemsForDeletion.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={deleteSelectedItems}
                disabled={selectedItemsForDeletion.size === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-30"
                style={{ backgroundColor: '#630606' }}
              >
                Delete Selected
              </button>
              <button
                onClick={cancelBulkDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                style={{ color: '#630606' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isBulkDeleteMode && items.some(i => i.completed) && (
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
        {/* Add Item Form */}
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

        {/* Items Display */}
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

                  {/* Items in this category */}
                  <div className="bg-white rounded-xl overflow-hidden">
                    {categoryItems.map((item, index) => (
                      <div key={item.id}>
                        <div className="p-4 flex items-center gap-4 group hover:bg-[#8E806A05] transition-colors">
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
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
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
                              {isBulkDeleteMode ? (
                                // Bulk Delete Mode - Square Checkbox
                                <>
                                  <div
                                    onClick={() => toggleItemSelection(item.id)}
                                    className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
                                    style={{
                                      borderColor: selectedItemsForDeletion.has(item.id)
                                        ? '#630606'
                                        : '#8E806A33',
                                      backgroundColor: selectedItemsForDeletion.has(item.id)
                                        ? '#630606'
                                        : 'transparent',
                                    }}
                                  >
                                    {selectedItemsForDeletion.has(item.id) && (
                                      <span className="text-white text-xs font-bold">✓</span>
                                    )}
                                  </div>

                                  <span
                                    onClick={() => toggleItemSelection(item.id)}
                                    className={`flex-1 text-base transition-all cursor-pointer ${
                                      item.completed ? 'line-through opacity-40' : ''
                                    }`}
                                    style={{ color: '#8E806A' }}
                                  >
                                    {item.text}
                                  </span>
                                </>
                              ) : (
                                // Normal Mode - Round Checkbox
                                <>
                                  <div
                                    onClick={() => toggleItem(item.id)}
                                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0"
                                    style={{
                                      borderColor: item.completed ? '#630606' : '#8E806A33',
                                      backgroundColor: item.completed ? '#630606' : 'transparent',
                                    }}
                                  >
                                    {item.completed && (
                                      <span className="text-white text-xs font-bold">✓</span>
                                    )}
                                  </div>

                                  <span
                                    onClick={() => toggleItem(item.id)}
                                    className={`flex-1 text-base transition-all cursor-pointer ${
                                      item.completed ? 'line-through opacity-40' : ''
                                    }`}
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
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => deleteItem(item.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg"
                                    style={{ color: '#630606' }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
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
      </main>

      {/* Master List Drawer */}
      <MasterListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        masterListItems={masterListItems}
        onAddToActiveList={addFromMasterList}
        onAddToMasterList={(text, category) => {
          onUpdateMasterList([
            {
              id: Date.now(),
              text,
              category,
            },
            ...masterListItems,
          ]);
        }}
        onUpdateMasterItem={(id, text, category) => {
          onUpdateMasterList(
            masterListItems.map(item =>
              item.id === id ? { ...item, text, category } : item
            )
          );
        }}
        onDeleteMasterItem={(id) => {
          onUpdateMasterList(masterListItems.filter(item => item.id !== id));
        }}
        onAddAllFromMasterList={addAllFromMasterList}
        categories={categories}
        capitalizeFirstLetter={capitalizeFirstLetter}
        autoCategorize={autoCategorize}
        currentListName={listName}
      />

      {/* Duplicate Confirmation Modal */}
      {duplicateCheck && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
              <h3 className="text-lg font-bold mb-2" style={{ color: '#630606' }}>
                Item Already Exists
              </h3>
              <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
                <span className="font-semibold">{duplicateCheck.name}</span> is already in the
                list. Add it anyway?
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
  );
}

export default ShoppingList;

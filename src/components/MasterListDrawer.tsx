import { useState } from 'react';
import type { MasterListItem } from '../App';
import {
  getSuggestedContexts,
  getContextItems,
} from '../utils/contextMapping';

interface MasterListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  masterListItems: MasterListItem[];
  onAddToActiveList: (item: MasterListItem) => void;
  onAddToMasterList: (text: string, category: string) => void;
  onUpdateMasterList: (items: MasterListItem[]) => void;
  onUpdateMasterItem: (id: number, text: string, category: string) => void;
  onDeleteMasterItem: (id: number) => void;
  onAddAllFromMasterList: () => void;
  categories: string[];
  capitalizeFirstLetter: (text: string) => string;
  autoCategorize: (text: string) => string;
  currentListName: string;
}

function MasterListDrawer({
  isOpen,
  onClose,
  masterListItems,
  onAddToActiveList,
  onAddToMasterList,
  onUpdateMasterList,
  onUpdateMasterItem,
  onDeleteMasterItem,
  onAddAllFromMasterList,
  categories,
  capitalizeFirstLetter,
  autoCategorize,
  currentListName,
}: MasterListDrawerProps) {
  const [isMasterListEditMode, setIsMasterListEditMode] = useState(false);
  const [masterListSearch, setMasterListSearch] = useState('');
  const [masterListEditingId, setMasterListEditingId] = useState<number | null>(null);
  const [masterListEditText, setMasterListEditText] = useState('');
  const [masterListEditCategory, setMasterListEditCategory] = useState('');
  const [newMasterItem, setNewMasterItem] = useState('');

  const startEditingMasterItem = (item: MasterListItem) => {
    setMasterListEditingId(item.id);
    setMasterListEditText(item.text);
    setMasterListEditCategory(item.category || '');
  };

  const saveMasterEdit = () => {
    if (!masterListEditText.trim() || masterListEditingId === null) return;
    const capitalizedText = capitalizeFirstLetter(masterListEditText.trim());
    onUpdateMasterItem(masterListEditingId, capitalizedText, masterListEditCategory);
    setMasterListEditingId(null);
    setMasterListEditText('');
    setMasterListEditCategory('');
  };

  const cancelMasterEdit = () => {
    setMasterListEditingId(null);
    setMasterListEditText('');
    setMasterListEditCategory('');
  };

  const handleAddToMasterList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterItem.trim()) return;
    const capitalizedText = capitalizeFirstLetter(newMasterItem.trim());
    const category = autoCategorize(capitalizedText);
    onAddToMasterList(capitalizedText, category);
    setNewMasterItem('');
  };

  const handleApplyContext = (contextKey: string) => {
    const contextItems = getContextItems(contextKey);
    if (!contextItems || contextItems.length === 0) return;

    // Batch all items into a single state update to avoid stale state issues
    const newItems: MasterListItem[] = [];

    contextItems.forEach((item) => {
      const capitalizedText = capitalizeFirstLetter(item.name);

      // Check if item already exists (case-insensitive) to prevent duplicates
      const exists = masterListItems.some(
        existingItem => existingItem.text.toLowerCase() === capitalizedText.toLowerCase()
      ) || newItems.some(
        existingItem => existingItem.text.toLowerCase() === capitalizedText.toLowerCase()
      );

      if (!exists) {
        newItems.push({
          id: Date.now() + Math.random(),
          text: capitalizedText,
          category: item.listCategory,
        });
      }
    });

    // Update master list with all new items at once
    if (newItems.length > 0) {
      onUpdateMasterList([...newItems, ...masterListItems]);
    }
  };

  const groupedMasterItems = () => {
    const grouped: Record<string, MasterListItem[]> = {};
    categories.forEach(cat => {
      grouped[cat] = [];
    });
    grouped['Other'] = [];

    // Apply search filter
    const filteredItems = masterListItems.filter(item => {
      if (!masterListSearch.trim()) return true;
      return item.text.toLowerCase().includes(masterListSearch.toLowerCase().trim());
    });

    filteredItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(item);
    });

    return grouped;
  };

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>

      {/* Drawer with slide animation */}
      <div
        className={`fixed top-0 left-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
              Master List
            </h2>
            <div className="flex items-center gap-2">
              {/* Select All Button (only in view mode) */}
              {!isMasterListEditMode && masterListItems.length > 0 && (
                <button
                  onClick={onAddAllFromMasterList}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-white"
                  style={{ backgroundColor: '#630606' }}
                  title="Add all items to list"
                >
                  Select All
                </button>
              )}
              {/* Edit Mode Toggle */}
              <button
                onClick={() => {
                  setIsMasterListEditMode(!isMasterListEditMode);
                  if (isMasterListEditMode) {
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
                onClick={() => {
                  onClose();
                  setMasterListSearch('');
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                style={{ color: '#8E806A' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Input */}
          {!isMasterListEditMode && masterListItems.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={masterListSearch}
                onChange={(e) => setMasterListSearch(e.target.value)}
                placeholder="Search items..."
                className="w-full p-2.5 rounded-lg border border-[#8E806A33] focus:ring-2 focus:ring-[#63060611] outline-none text-sm transition-all"
                style={{ color: '#8E806A' }}
              />
            </div>
          )}

          {/* Add Form (only in edit mode) */}
          {isMasterListEditMode && (
            <form onSubmit={handleAddToMasterList} className="mb-6">
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
              <div className="flex flex-col items-center justify-center py-12 px-4 min-h-64">
                {/* Header */}
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#630606' }}>
                  Quick Setup
                </h3>
                <p className="text-sm mb-8 opacity-70" style={{ color: '#8E806A' }}>
                  Start with a context-based suggestion
                </p>

                {/* Suggestion Bubbles */}
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {getSuggestedContexts(currentListName).map(suggestion => (
                    <button
                      key={suggestion.contextKey}
                      onClick={() => handleApplyContext(suggestion.contextKey)}
                      className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:shadow-md active:scale-95"
                      style={{
                        backgroundColor: 'rgba(99, 6, 6, 0.1)',
                        border: `1px solid #630606`,
                        color: '#630606'
                      }}
                      title={`${suggestion.itemCount} items`}
                    >
                      {suggestion.displayLabel}
                    </button>
                  ))}
                </div>

                {/* Keep Empty Bubble */}
                <button
                  onClick={() => setIsMasterListEditMode(true)}
                  className="px-6 py-3 rounded-full text-sm font-medium transition-all hover:shadow-md active:scale-95"
                  style={{
                    backgroundColor: 'rgba(99, 6, 6, 0.1)',
                    border: `1px dashed #630606`,
                    color: '#630606'
                  }}
                >
                  Keep Empty
                </button>
              </div>
            ) : Object.values(groupedMasterItems()).every(arr => arr.length === 0) ? (
              <div className="text-center py-12">
                <p className="text-sm opacity-50" style={{ color: '#8E806A' }}>
                  No items match "{masterListSearch}"
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
                                      <option key={cat} value={cat}>
                                        {cat}
                                      </option>
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
                                  onClick={() => !isMasterListEditMode && onAddToActiveList(item)}
                                  className={`flex-1 text-sm ${
                                    !isMasterListEditMode ? 'cursor-pointer hover:opacity-70' : ''
                                  }`}
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
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => onDeleteMasterItem(item.id)}
                                      className="p-1.5 hover:bg-red-50 rounded transition-opacity"
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
        </div>
      </div>
    </>
  );
}

export default MasterListDrawer;

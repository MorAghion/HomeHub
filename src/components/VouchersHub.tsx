import { useState } from 'react';
import { Gift, Calendar, Plus } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getContextIcon } from '../utils/iconMapping';
import type { VoucherListInstance } from '../types/base';
import { VOUCHER_TEMPLATES } from '../utils/voucherMemory';

interface VouchersHubProps {
  voucherLists: Record<string, VoucherListInstance>;
  onSelectList: (listId: string) => void;
  onCreateList: (templateId: string, displayName?: string, defaultType?: 'voucher' | 'reservation') => void;
  onDeleteList: (listId: string) => void;
  onDeleteLists: (listIds: string[]) => void;
  onBack: () => void;
}

function VouchersHub({
  voucherLists,
  onSelectList,
  onCreateList,
  onDeleteList,
  onDeleteLists,
  onBack,
}: VouchersHubProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedListsForDeletion, setSelectedListsForDeletion] = useState<Set<string>>(new Set());
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'voucher' | 'reservation'>('voucher');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    listId?: string;
  } | null>(null);

  const listArray = Object.values(voucherLists);

  const toggleListSelection = (listId: string) => {
    const newSelected = new Set(selectedListsForDeletion);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedListsForDeletion(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedListsForDeletion.size === listArray.length) {
      setSelectedListsForDeletion(new Set());
    } else {
      setSelectedListsForDeletion(new Set(listArray.map(list => list.id)));
    }
  };

  const handleDeleteSelected = () => {
    onDeleteLists(Array.from(selectedListsForDeletion));
    setSelectedListsForDeletion(new Set());
    setDeleteConfirmation(null);
    setIsEditMode(false);
  };

  const handleDeleteSingle = (listId: string) => {
    onDeleteList(listId);
    setDeleteConfirmation(null);
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setSelectedListsForDeletion(new Set());
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = VOUCHER_TEMPLATES.find(t => t.id === templateId);

    // If template has no default type, show type selector
    if (template && template.defaultType === undefined) {
      setSelectedTemplate(templateId);
      // Don't close modal, show type selection instead
    } else {
      // Create with default type
      onCreateList(templateId, undefined, template?.defaultType);
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleConfirmType = () => {
    if (selectedTemplate) {
      onCreateList(selectedTemplate, undefined, selectedType);
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setSelectedType('voucher'); // Reset to default
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>
              Vouchers & Cards
            </h1>
          </div>

          {/* Header Action Buttons - Ghost UI */}
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-all hover:bg-[#63060611]"
                style={{
                  backgroundColor: 'transparent',
                  color: '#630606',
                  border: '1px solid #630606'
                }}
              >
                <Plus size={16} strokeWidth={2} />
                <span>New</span>
              </button>
            )}
            {listArray.length > 0 && (
              <button
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (isEditMode) {
                    cancelEditMode();
                  }
                }}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isEditMode ? '#630606' : 'transparent',
                  color: isEditMode ? 'white' : '#630606',
                  border: isEditMode ? 'none' : '1px solid #63060633'
                }}
              >
                {isEditMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        {/* Bulk Delete Actions */}
        {isEditMode && (
          <div className="flex items-center justify-between p-3 bg-[#63060611] rounded-xl mb-4">
            <div className="flex items-center gap-3">
              {selectedListsForDeletion.size > 0 && (
                <span className="text-sm font-medium" style={{ color: '#630606' }}>
                  {selectedListsForDeletion.size} selected
                </span>
              )}
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedListsForDeletion.size === listArray.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              {selectedListsForDeletion.size > 0 && (
                <button
                  onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Empty State */}
        {listArray.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              {(() => {
                const Icon = getContextIcon('vouchers');
                return <Icon size={64} strokeWidth={2} style={{ color: '#630606' }} />;
              })()}
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#630606' }}>
              No Vouchers Yet
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
              Start organizing your gift cards, tickets, and vouchers
            </p>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              Create Your First Voucher List
            </button>
          </div>
        )}

        {/* Voucher Lists Grid */}
        {listArray.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listArray.map((list) => (
              <div key={list.id} className="relative">
                {isEditMode && (
                  <div
                    onClick={() => toggleListSelection(list.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10 bg-white"
                    style={{
                      borderColor: selectedListsForDeletion.has(list.id) ? '#630606' : '#8E806A33',
                      backgroundColor: selectedListsForDeletion.has(list.id) ? '#630606' : 'white',
                    }}
                  >
                    {selectedListsForDeletion.has(list.id) && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </div>
                )}
                <button
                  onClick={() => !isEditMode && onSelectList(list.id)}
                  className={`w-full bg-white p-6 rounded-2xl shadow-sm text-left transition-all ${
                    !isEditMode ? 'hover:bg-white hover:shadow-md active:scale-[0.98]' : 'opacity-70'
                  }`}
                  style={{ border: selectedListsForDeletion.has(list.id) ? '2px solid #630606' : '1px solid #8E806A22' }}
                  disabled={isEditMode}
                >
                  <div className="mb-3">
                    {(() => {
                      const Icon = getContextIcon(list.name);
                      return <Icon size={32} strokeWidth={2} style={{ color: '#630606' }} />;
                    })()}
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-semibold flex-1" style={{ color: '#630606' }}>
                      {list.name}
                    </h2>
                    {!isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmation({ type: 'single', listId: list.id });
                        }}
                        className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ color: '#DC2626' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#8E806A' }}>
                    {list.items.length} {list.items.length === 1 ? 'voucher' : 'vouchers'}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
                {selectedTemplate ? 'Choose Item Type' : 'Choose a Template'}
              </h2>
              <button
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setSelectedTemplate(null);
                }}
                className="text-2xl hover:opacity-50 transition-opacity"
                style={{ color: '#8E806A' }}
              >
                ×
              </button>
            </div>

            {!selectedTemplate ? (
              // Template Selection
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VOUCHER_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:border-[#630606] active:scale-[0.98]"
                    style={{ borderColor: '#8E806A22' }}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <h3 className="text-lg font-semibold mb-1" style={{ color: '#630606' }}>
                      {template.name}
                    </h3>
                    <p className="text-xs" style={{ color: '#8E806A' }}>
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              // Type Selection (for Custom/Physical)
              <div className="space-y-4">
                <p className="text-sm" style={{ color: '#8E806A' }}>
                  What type of items will you store in this list?
                </p>

                {/* Radio Buttons */}
                <div className="space-y-3">
                  <label className="flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                    style={{
                      borderColor: selectedType === 'voucher' ? '#630606' : '#8E806A22',
                      backgroundColor: selectedType === 'voucher' ? '#63060608' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="itemType"
                      value="voucher"
                      checked={selectedType === 'voucher'}
                      onChange={(e) => setSelectedType(e.target.value as 'voucher')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift size={20} strokeWidth={2} style={{ color: '#630606' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
                          Vouchers & Gift Cards
                        </h3>
                      </div>
                      <p className="text-xs" style={{ color: '#8E806A' }}>
                        Gift cards, coupons, and vouchers with value and expiry dates
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md"
                    style={{
                      borderColor: selectedType === 'reservation' ? '#630606' : '#8E806A22',
                      backgroundColor: selectedType === 'reservation' ? '#63060608' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="itemType"
                      value="reservation"
                      checked={selectedType === 'reservation'}
                      onChange={(e) => setSelectedType(e.target.value as 'reservation')}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={20} strokeWidth={2} style={{ color: '#630606' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
                          Reservations & Events
                        </h3>
                      </div>
                      <p className="text-xs" style={{ color: '#8E806A' }}>
                        Restaurant bookings, movie tickets, and event reservations
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors hover:bg-[#8E806A11]"
                    style={{ color: '#8E806A', border: '1px solid #8E806A33' }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmType}
                    className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#630606' }}
                  >
                    Create List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation?.type === 'bulk') {
            handleDeleteSelected();
          } else if (deleteConfirmation?.listId) {
            handleDeleteSingle(deleteConfirmation.listId);
          }
        }}
        title={deleteConfirmation?.type === 'bulk' ? 'Delete Selected Lists?' : 'Delete Voucher List?'}
        message={
          deleteConfirmation?.type === 'bulk'
            ? `Are you sure you want to delete ${selectedListsForDeletion.size} list${selectedListsForDeletion.size !== 1 ? 's' : ''}?`
            : 'Are you sure you want to delete this voucher list and all its vouchers?'
        }
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}

export default VouchersHub;

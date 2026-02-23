import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gift, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getContextIcon } from '../utils/contextResolver';
import type { VoucherListInstance } from '../types/base';
import { VOUCHER_TEMPLATES } from '../utils/voucherMemory';

interface VouchersHubProps {
  voucherLists: Record<string, VoucherListInstance>;
  onSelectList: (listId: string) => void;
  onCreateList: (templateId: string, displayName?: string, defaultType?: 'voucher' | 'reservation') => Promise<void>;
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
  const { t } = useTranslation('vouchers');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedListsForDeletion, setSelectedListsForDeletion] = useState<Set<string>>(new Set());
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'voucher' | 'reservation'>('voucher');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    listId?: string;
  } | null>(null);

  // fe-bug-005: only show voucher-type lists here; reservation-type lists go in ReservationsHub
  const listArray = Object.values(voucherLists).filter((l) => l.defaultType !== 'reservation');

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

  const handleTemplateSelect = async (templateId: string) => {
    const template = VOUCHER_TEMPLATES.find((tmpl) => tmpl.id === templateId);

    // If template has no default type, show type selector (don't create yet)
    if (template && template.defaultType === undefined) {
      setSelectedTemplate(templateId);
      return;
    }

    // fe-bug-006: await the create, pass template.name as display name, close only on success
    setIsCreating(true);
    try {
      await onCreateList(templateId, template?.name, template?.defaultType ?? 'voucher');
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error('[VouchersHub] createList failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmType = async () => {
    if (!selectedTemplate) return;
    const template = VOUCHER_TEMPLATES.find((tmpl) => tmpl.id === selectedTemplate);
    setIsCreating(true);
    try {
      await onCreateList(selectedTemplate, template?.name, selectedType);
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setSelectedType('voucher');
    } catch (err) {
      console.error('[VouchersHub] createList failed:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="px-6 py-8 overflow-x-hidden w-full" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity"
            >
              ←
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: '#630606' }}>
              {t('title')}
            </h1>
          </div>

          {/* Header Action Buttons - Circular Icon-Only Ghost UI */}
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-[#63060611]"
                style={{
                  backgroundColor: 'transparent',
                  color: '#630606',
                  border: '1.5px solid #630606'
                }}
                title={t('newVoucherList')}
              >
                <Plus size={18} strokeWidth={2.5} />
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
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: isEditMode ? '#630606' : 'transparent',
                  color: isEditMode ? 'white' : '#630606',
                  border: isEditMode ? 'none' : '1.5px solid #630606'
                }}
                title={isEditMode ? 'Done' : 'Edit'}
              >
                {isEditMode ? (
                  <span className="text-sm font-medium">✓</span>
                ) : (
                  <Pencil size={16} strokeWidth={2.5} />
                )}
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
                  {t('common:selected_other', { count: selectedListsForDeletion.size })}
                </span>
              )}
              <button
                onClick={toggleSelectAll}
                className="h-9 px-4 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedListsForDeletion.size === listArray.length ? t('common:deselectAll') : t('common:selectAll')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedListsForDeletion.size > 0 && (
                <button
                  onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                  className="h-9 px-4 rounded-lg text-sm font-medium text-white transition-all"
                  style={{ backgroundColor: '#630606' }}
                >
                  {t('common:deleteSelected')}
                </button>
              )}
              <button
                onClick={cancelEditMode}
                className="h-9 px-4 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                style={{ color: '#630606' }}
              >
                {t('common:cancel')}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Empty State */}
        {listArray.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              <Gift size={64} strokeWidth={2} style={{ color: '#630606' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#630606' }}>
              {t('noVouchersYet')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
              {t('noVouchersDesc')}
            </p>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              {t('createFirstList')}
            </button>
          </div>
        )}

        {/* Voucher Lists Grid */}
        {listArray.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listArray.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-2xl shadow-sm transition-all hover:shadow-md"
                style={{ border: isEditMode && selectedListsForDeletion.has(list.id) ? '2px solid #630606' : '1px solid #8E806A22' }}
              >
                {isEditMode ? (
                  <div className="flex items-center gap-4 p-6">
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleListSelection(list.id)}
                      className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                      style={{
                        borderColor: selectedListsForDeletion.has(list.id) ? '#630606' : '#8E806A33',
                        backgroundColor: selectedListsForDeletion.has(list.id) ? '#630606' : 'transparent',
                      }}
                    >
                      {selectedListsForDeletion.has(list.id) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 cursor-pointer" onClick={() => toggleListSelection(list.id)}>
                      <div className="mb-2">
                        {(() => {
                          const Icon = getContextIcon(list.name);
                          return <Icon size={28} strokeWidth={2} style={{ color: '#630606' }} />;
                        })()}
                      </div>
                      <h2 className="text-xl font-semibold mb-1" style={{ color: '#630606' }}>
                        {list.name}
                      </h2>
                      <p className="text-sm" style={{ color: '#8E806A' }}>
                        {list.items.length} {list.items.length === 1 ? 'voucher' : 'vouchers'}
                      </p>
                    </div>
                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirmation({ type: 'single', listId: list.id })}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: '#630606' }}
                      title={t('deleteVoucherList')}
                    >
                      <Trash2 size={20} strokeWidth={2} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectList(list.id)}
                    className="w-full p-6 rounded-2xl text-start active:scale-[0.98]"
                  >
                    <div className="mb-3">
                      {(() => {
                        const Icon = getContextIcon(list.name);
                        return <Icon size={32} strokeWidth={2} style={{ color: '#630606' }} />;
                      })()}
                    </div>
                    <h2 className="text-xl font-semibold mb-3" style={{ color: '#630606' }}>
                      {list.name}
                    </h2>
                    <p className="text-sm" style={{ color: '#8E806A' }}>
                      {list.items.length} {list.items.length === 1 ? 'voucher' : 'vouchers'}
                    </p>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Template Selection Modal — sits between header (top-16) and footer (bottom-20) */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-x-0 top-16 bottom-20 bg-black/50 z-40 overflow-y-auto p-4"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
                {selectedTemplate ? t('chooseItemType') : t('chooseTemplate')}
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
                    disabled={isCreating}
                    className="p-4 rounded-xl border-2 text-start transition-all hover:shadow-md hover:border-[#630606] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {t('itemTypeQuestion')}
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
                      className="mt-1 me-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Gift size={20} strokeWidth={2} style={{ color: '#630606' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
                          {t('typeVoucher')}
                        </h3>
                      </div>
                      <p className="text-xs" style={{ color: '#8E806A' }}>
                        {t('typeVoucherDesc')}
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
                      className="mt-1 me-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={20} strokeWidth={2} style={{ color: '#630606' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
                          {t('typeReservation')}
                        </h3>
                      </div>
                      <p className="text-xs" style={{ color: '#8E806A' }}>
                        {t('typeReservationDesc')}
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
                    {t('common:back')}
                  </button>
                  <button
                    onClick={handleConfirmType}
                    disabled={isCreating}
                    className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#630606' }}
                  >
                    {isCreating ? '…' : t('createList')}
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
        title={deleteConfirmation?.type === 'bulk' ? t('deleteSelectedLists') : t('deleteVoucherList')}
        message={
          deleteConfirmation?.type === 'bulk'
            ? t(selectedListsForDeletion.size === 1 ? 'deleteSelectedListsMessage_one' : 'deleteSelectedListsMessage_other', { count: selectedListsForDeletion.size })
            : t('deleteVoucherListMessage')
        }
        confirmText={t('deleteConfirm')}
        isDestructive
      />
    </div>
  );
}

export default VouchersHub;

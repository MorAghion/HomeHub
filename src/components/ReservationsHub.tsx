import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, Pencil, Trash2 } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { getContextIcon } from '../utils/contextResolver';
import type { VoucherListInstance } from '../types/base';
import { VOUCHER_TEMPLATES } from '../utils/voucherMemory';

// Only templates that make sense for reservations
const RESERVATION_TEMPLATES = VOUCHER_TEMPLATES.filter(
  (t) => t.defaultType === 'reservation' || t.defaultType === undefined
);

interface ReservationsHubProps {
  voucherLists: Record<string, VoucherListInstance>;
  onSelectList: (listId: string) => void;
  onCreateList: (templateId: string, displayName?: string, defaultType?: 'voucher' | 'reservation') => Promise<void>;
  onDeleteList: (listId: string) => void;
  onDeleteLists: (listIds: string[]) => void;
  onBack: () => void;
}

function ReservationsHub({
  voucherLists,
  onSelectList,
  onCreateList,
  onDeleteList,
  onDeleteLists,
  onBack,
}: ReservationsHubProps) {
  const { t } = useTranslation('vouchers');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedListsForDeletion, setSelectedListsForDeletion] = useState<Set<string>>(new Set());
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    listId?: string;
  } | null>(null);

  // Only show reservation-type lists
  const listArray = Object.values(voucherLists).filter((l) => l.defaultType === 'reservation');

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
      setSelectedListsForDeletion(new Set(listArray.map((list) => list.id)));
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

  // Reservations hub always creates with defaultType: 'reservation'
  const handleTemplateSelect = async (templateId: string) => {
    const template = RESERVATION_TEMPLATES.find((tmpl) => tmpl.id === templateId);
    setIsCreating(true);
    try {
      await onCreateList(templateId, template?.name, 'reservation');
      setIsTemplateModalOpen(false);
    } catch (err) {
      console.error('[ReservationsHub] createList failed:', err);
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
              {t('typeReservation')}
            </h1>
          </div>

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
                title={t('newReservationList')}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            )}
            {listArray.length > 0 && (
              <button
                onClick={() => {
                  if (isEditMode) {
                    cancelEditMode();
                  } else {
                    setIsEditMode(true);
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
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedListsForDeletion.size === listArray.length ? t('common:deselectAll') : t('common:selectAll')}
              </button>
            </div>
            <div className="flex gap-2">
              {selectedListsForDeletion.size > 0 && (
                <button
                  onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  {t('common:deleteSelected')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        {listArray.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              <Calendar size={64} strokeWidth={2} style={{ color: '#630606' }} />
            </div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#630606' }}>
              {t('noReservationsYet')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
              {t('noReservationsDesc')}
            </p>
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              {t('createFirstReservation')}
            </button>
          </div>
        )}

        {listArray.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listArray.map((list) => (
              <div key={list.id} className="relative">
                {isEditMode && (
                  <>
                    <div
                      onClick={() => toggleListSelection(list.id)}
                      className="absolute -top-2 -end-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10 bg-white"
                      style={{
                        borderColor: selectedListsForDeletion.has(list.id) ? '#630606' : '#8E806A33',
                        backgroundColor: selectedListsForDeletion.has(list.id) ? '#630606' : 'white',
                      }}
                    >
                      {selectedListsForDeletion.has(list.id) && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                    <button
                      onClick={() => setDeleteConfirmation({ type: 'single', listId: list.id })}
                      className="absolute -top-2 -start-2 w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer z-10 bg-white hover:bg-red-50"
                      style={{ border: '1.5px solid #DC262666' }}
                      title={t('deleteReservationList')}
                    >
                      <Trash2 size={12} strokeWidth={2} style={{ color: '#DC2626' }} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => !isEditMode && onSelectList(list.id)}
                  className={`w-full bg-white p-6 rounded-2xl shadow-sm text-start transition-all ${
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
                  <h2 className="text-xl font-semibold mb-3" style={{ color: '#630606' }}>
                    {list.name}
                  </h2>
                  <p className="text-sm" style={{ color: '#8E806A' }}>
                    {list.items.length} {list.items.length === 1 ? 'reservation' : 'reservations'}
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
          className="fixed inset-x-0 top-16 bottom-20 bg-black/50 z-40 overflow-y-auto p-4"
          onClick={() => setIsTemplateModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: '#630606' }}>
                {t('chooseTemplate')}
              </h2>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-2xl hover:opacity-50 transition-opacity"
                style={{ color: '#8E806A' }}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {RESERVATION_TEMPLATES.map((template) => (
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
          </div>
        </div>
      )}

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
        title={deleteConfirmation?.type === 'bulk' ? t('deleteSelectedLists') : t('deleteReservationList')}
        message={
          deleteConfirmation?.type === 'bulk'
            ? t(selectedListsForDeletion.size === 1 ? 'deleteSelectedListsMessage_one' : 'deleteSelectedListsMessage_other', { count: selectedListsForDeletion.size })
            : t('deleteReservationListMessage')
        }
        confirmText={t('deleteConfirm')}
        isDestructive
      />
    </div>
  );
}

export default ReservationsHub;

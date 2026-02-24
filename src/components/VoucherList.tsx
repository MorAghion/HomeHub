import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { VoucherItem } from '../types/base';
import VoucherCard from './VoucherCard';
import ConfirmationModal from './ConfirmationModal';
import AddVoucherModal from './AddVoucherModal';
import AddReservationModal from './AddReservationModal';

interface VoucherListProps {
  listName: string;
  listId: string;
  listType: 'voucher' | 'reservation';
  vouchers: VoucherItem[];
  onUpdateVouchers: (vouchers: VoucherItem[]) => void;
  onBack: () => void;
  autoOpenAdd?: boolean; // fe-bug-010: open add form immediately on mount
}

function VoucherList({ listName, listId, listType, vouchers, onUpdateVouchers, onBack, autoOpenAdd = false }: VoucherListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(autoOpenAdd);
  const [editingItem, setEditingItem] = useState<VoucherItem | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const { t } = useTranslation('vouchers');

  const openAddModal = () => {
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: VoucherItem) => {
    setEditingItem(item);
    setIsAddModalOpen(true);
  };

  const handleSave = (item: VoucherItem) => {
    if (editingItem) {
      onUpdateVouchers(vouchers.map(v => v.id === item.id ? item : v));
    } else {
      onUpdateVouchers([...vouchers, item]);
    }
    setEditingItem(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    onUpdateVouchers(vouchers.filter(v => v.id !== voucherId));
    setDeleteConfirmation(null);
  };

  return (
    <div className="w-full px-6 py-8 overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity flex-shrink-0"
            >
              ←
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate" style={{ color: '#630606' }}>
                {listName}
              </h1>
              <p className="text-xs mt-1" style={{ color: '#8E806A' }}>
                {t('voucher', { count: vouchers.length })}
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#630606' }}
          >
            {t('addVoucher')}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Empty State */}
        {vouchers.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎫</div>
            <h2 className="text-2xl font-semibold mb-2" style={{ color: '#630606' }}>
              {t('noVouchersYet')}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
              {t('noVouchersAdd')}
            </p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              {t('addVoucher')}
            </button>
          </div>
        )}

        {/* Voucher Grid */}
        {vouchers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onEdit={handleEditItem}
                onDelete={(id) => setDeleteConfirmation(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal — routed by listType */}
      {listType === 'reservation' ? (
        <AddReservationModal
          isOpen={isAddModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          listName={listName}
          listId={listId}
          editingItem={editingItem}
        />
      ) : (
        <AddVoucherModal
          isOpen={isAddModalOpen}
          onClose={closeModal}
          onSave={handleSave}
          listName={listName}
          listId={listId}
          editingItem={editingItem}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => deleteConfirmation && handleDeleteVoucher(deleteConfirmation)}
        title={t('deleteVoucher')}
        message={t('deleteVoucherMessage')}
        confirmText={t('deleteConfirm')}
        isDestructive
      />
    </div>
  );
}

export default VoucherList;

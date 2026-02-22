import { Gift } from 'lucide-react';
import type { Voucher } from '../../types/voucher';
import VoucherCard from './VoucherCard';

interface VoucherGridProps {
  vouchers: Voucher[];
  onEdit?: (voucher: Voucher) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

function VoucherGrid({ vouchers, onEdit, onDelete, onAdd }: VoucherGridProps) {
  if (vouchers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <Gift size={56} strokeWidth={1.5} style={{ color: '#630606', opacity: 0.4 }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#630606' }}>
          No vouchers yet
        </h3>
        <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
          Add your first gift card, coupon, or voucher
        </p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#630606' }}
          >
            Add Voucher
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {vouchers.map((voucher) => (
        <VoucherCard
          key={voucher.id}
          voucher={voucher}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default VoucherGrid;

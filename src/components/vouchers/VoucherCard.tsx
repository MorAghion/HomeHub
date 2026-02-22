import { useState } from 'react';
import { Copy, Image, Check } from 'lucide-react';
import type { Voucher } from '../../types/voucher';
import VoucherDetailModal from './VoucherDetailModal';

interface VoucherCardProps {
  voucher: Voucher;
  onEdit?: (voucher: Voucher) => void;
  onDelete?: (id: string) => void;
}

function formatExpiry(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isSoonExpiring(dateStr?: string): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(now.getDate() + 30);
  return expiry >= now && expiry <= thirtyDays;
}

function VoucherCard({ voucher, onEdit, onDelete }: VoucherCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const expired = isExpired(voucher.expiryDate);
  const soonExpiring = isSoonExpiring(voucher.expiryDate);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voucher.code) return;
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
        style={{ border: '1px solid #8E806A22' }}
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: '#630606' }} />

        <div className="p-4">
          {/* Name row + icons */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3
              className="text-base font-semibold leading-tight truncate"
              style={{ color: '#630606' }}
            >
              {voucher.name}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {voucher.imageUrl && (
                <Image size={14} strokeWidth={2} style={{ color: '#8E806A' }} />
              )}
              {voucher.code && (
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded-md transition-colors hover:bg-[#63060611]"
                  title="Copy code"
                >
                  {copied ? (
                    <Check size={14} strokeWidth={2.5} style={{ color: '#630606' }} />
                  ) : (
                    <Copy size={14} strokeWidth={2} style={{ color: '#8E806A' }} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Value */}
          {voucher.value && (
            <p className="text-2xl font-bold mb-1" style={{ color: '#630606' }}>
              ₪{voucher.value}
            </p>
          )}

          {/* Issuer */}
          {voucher.issuer && (
            <p className="text-xs mb-2" style={{ color: '#8E806A' }}>
              {voucher.issuer}
            </p>
          )}

          {/* Expiry badge */}
          {voucher.expiryDate && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: expired
                  ? '#DC262611'
                  : soonExpiring
                  ? '#F5900011'
                  : '#63060611',
                color: expired ? '#DC2626' : soonExpiring ? '#B45309' : '#630606',
              }}
            >
              {expired ? 'Expired ' : 'Expires '}
              {formatExpiry(voucher.expiryDate)}
            </span>
          )}
        </div>
      </button>

      <VoucherDetailModal
        voucher={voucher}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}

export default VoucherCard;

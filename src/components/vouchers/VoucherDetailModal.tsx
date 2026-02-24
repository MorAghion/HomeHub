import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Pencil, Trash2, X } from 'lucide-react';
import type { Voucher } from '../../types/voucher';

interface VoucherDetailModalProps {
  voucher: Voucher;
  isOpen: boolean;
  onClose: () => void;
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

function VoucherDetailModal({ voucher, isOpen, onClose, onEdit, onDelete }: VoucherDetailModalProps) {
  const { t } = useTranslation(['vouchers', 'common']);
  const [copied, setCopied] = useState(false);
  const [imgZoomed, setImgZoomed] = useState(false);

  if (!isOpen) return null;

  const expired = isExpired(voucher.expiryDate);

  const handleCopyCode = () => {
    if (!voucher.code) return;
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: '#630606' }} />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#8E806A44' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-4 pb-2">
          <h2 className="text-xl font-bold leading-tight pe-4" style={{ color: '#630606' }}>
            {voucher.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#8E806A11] transition-colors flex-shrink-0"
          >
            <X size={18} strokeWidth={2} style={{ color: '#8E806A' }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Image */}
          {voucher.imageUrl && (
            <button
              onClick={() => setImgZoomed(!imgZoomed)}
              className="w-full rounded-xl overflow-hidden focus:outline-none"
            >
              <img
                src={voucher.imageUrl}
                alt={voucher.name}
                className={`w-full object-contain transition-all ${imgZoomed ? 'max-h-96' : 'max-h-48'}`}
              />
            </button>
          )}

          {/* Value */}
          {voucher.value && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('value')}</p>
              <p className="text-3xl font-bold" style={{ color: '#630606' }}>₪{voucher.value}</p>
            </div>
          )}

          {/* Issuer */}
          {voucher.issuer && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('issuer')}</p>
              <p className="text-base font-medium" style={{ color: '#1a1a1a' }}>{voucher.issuer}</p>
            </div>
          )}

          {/* Expiry */}
          {voucher.expiryDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('expiryDate')}</p>
              <p
                className="text-base font-medium"
                style={{ color: expired ? '#DC2626' : '#1a1a1a' }}
              >
                {formatExpiry(voucher.expiryDate)}
                {expired && ` — ${t('expired')}`}
              </p>
            </div>
          )}

          {/* Code */}
          {voucher.code && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('code')}</p>
              <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: '#F5F2E7' }}>
                <code className="flex-1 text-sm font-mono font-bold tracking-widest" style={{ color: '#630606' }}>
                  {voucher.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[#63060611]"
                  title={t('copyCode')}
                >
                  {copied ? (
                    <Check size={16} strokeWidth={2.5} style={{ color: '#630606' }} />
                  ) : (
                    <Copy size={16} strokeWidth={2} style={{ color: '#630606' }} />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notes */}
          {voucher.notes && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('notes')}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#5a5a5a' }}>{voucher.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div className="flex gap-3 pt-2">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(voucher); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: '#63060611', color: '#630606' }}
                >
                  <Pencil size={15} strokeWidth={2} />
                  {t('common:edit')}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onClose(); onDelete(voucher.id); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: '#DC262611', color: '#DC2626' }}
                >
                  <Trash2 size={15} strokeWidth={2} />
                  {t('common:delete')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoucherDetailModal;

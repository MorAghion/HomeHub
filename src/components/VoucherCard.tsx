import { useState } from 'react';
import type { VoucherItem, Voucher, Reservation } from '../types/base';

interface VoucherCardProps {
  voucher: VoucherItem;
  onEdit?: (voucher: VoucherItem) => void;
  onDelete?: (voucherId: string) => void;
  onRefreshDetails?: (voucher: VoucherItem) => void;
}

function VoucherCard({ voucher, onEdit, onDelete, onRefreshDetails }: VoucherCardProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyCode = () => {
    if (voucher.code) {
      navigator.clipboard.writeText(voucher.code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Check if there are multiple codes (separated by " / ")
  const hasMultipleCodes = voucher.code?.includes(' / ');

  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return null;

    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', color: '#DC2626', urgent: true };
    } else if (diffDays === 0) {
      return { text: 'Expires Today', color: '#F59E0B', urgent: true };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days left`, color: '#F59E0B', urgent: true };
    } else if (diffDays <= 30) {
      return { text: `${diffDays} days left`, color: '#8E806A', urgent: false };
    } else {
      const formatted = expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return { text: `Expires ${formatted}`, color: '#8E806A', urgent: false };
    }
  };

  const expiryInfo = voucher.itemType === 'voucher'
    ? formatExpiryDate((voucher as Voucher).expiryDate)
    : null;

  // Check if code is a URL (for BuyMe/Ontopo links)
  const isCodeUrl = voucher.code && (voucher.code.startsWith('http://') || voucher.code.startsWith('https://'));

  // Format event date for reservations
  const formatEventDate = (dateString?: string, time?: string) => {
    if (!dateString) return null;

    const eventDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatted = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: eventDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });

    let prefix = '';
    if (eventDate.toDateString() === today.toDateString()) {
      prefix = 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      prefix = 'Tomorrow';
    }

    const timeStr = time ? ` at ${time}` : '';
    return prefix ? `${prefix}${timeStr}` : `${formatted}${timeStr}`;
  };

  return (
    <>
      <div
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-4 border relative group"
        style={{ borderColor: expiryInfo?.urgent ? expiryInfo.color : '#8E806A22' }}
      >
        {/* Header with Issuer/Type Label and Edit/Delete */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {voucher.itemType === 'voucher' && (voucher as Voucher).issuer && (
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>
                {(voucher as Voucher).issuer}
              </p>
            )}
            {voucher.itemType === 'reservation' && (
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>
                📅 Reservation
              </p>
            )}
            <h3 className="text-lg font-semibold" style={{ color: '#630606' }}>
              {voucher.name}
            </h3>
          </div>

          {/* Always-visible action buttons (shown on card hover) */}
          <div className="flex gap-1 ms-2">
            {/* Refresh button - only show if code is a URL */}
            {isCodeUrl && onRefreshDetails && (
              <button
                onClick={() => onRefreshDetails?.(voucher)}
                className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                style={{ color: '#3B82F6' }}
                title="Refresh details from URL"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={() => onEdit?.(voucher)}
              className="p-1.5 hover:bg-[#8E806A11] rounded-lg transition-colors"
              style={{ color: '#8E806A' }}
              title="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete?.(voucher.id)}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
              style={{ color: '#DC2626' }}
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Voucher-specific: Value */}
        {voucher.itemType === 'voucher' && (voucher as Voucher).value && (
          <div className="mb-3">
            <p className="text-2xl font-bold" style={{ color: '#630606' }}>
              {(voucher as Voucher).value}
            </p>
          </div>
        )}

        {/* Reservation-specific: Event Date & Time */}
        {voucher.itemType === 'reservation' && (
          <div className="mb-3">
            <div className="flex items-center gap-2 text-lg font-semibold" style={{ color: '#630606' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatEventDate((voucher as Reservation).eventDate, (voucher as Reservation).time)}</span>
            </div>
            {(voucher as Reservation).address && (
              <div className="flex items-start gap-2 text-sm mt-2" style={{ color: '#8E806A' }}>
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="flex-1">{(voucher as Reservation).address}</span>
              </div>
            )}
          </div>
        )}

        {/* Voucher-specific: Expiry Date */}
        {voucher.itemType === 'voucher' && expiryInfo && (
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
            style={{
              backgroundColor: `${expiryInfo.color}11`,
              color: expiryInfo.color
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {expiryInfo.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {/* Open Original Button (for URLs) */}
          {isCodeUrl && (
            <button
              onClick={() => window.open(voucher.code, '_blank')}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#630606' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Original
            </button>
          )}

          {/* Copy Code Button (for non-URL codes) */}
          {voucher.code && !isCodeUrl && (
            <button
              onClick={handleCopyCode}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: copySuccess ? '#10B981' : '#630606',
                color: 'white'
              }}
            >
              {copySuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {hasMultipleCodes ? 'Copy Codes' : 'Copy Code'}
                </>
              )}
            </button>
          )}

          {/* View Image Button */}
          {voucher.imageUrl && (
            <button
              onClick={() => setImageModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[#63060611]"
              style={{
                color: '#630606',
                border: '1px solid #63060633'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Card
            </button>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {imageModalOpen && voucher.imageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 end-0 text-white hover:opacity-70 transition-opacity"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={voucher.imageUrl}
              alt={voucher.name}
              className="w-full h-auto rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default VoucherCard;

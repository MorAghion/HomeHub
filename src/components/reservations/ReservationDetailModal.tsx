import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, CalendarDays, Pencil, Trash2, X } from 'lucide-react';
import type { Reservation } from '../../types/reservation';

interface ReservationDetailModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isPast(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
  return dt < new Date();
}

function ReservationDetailModal({ reservation, isOpen, onClose, onEdit, onDelete }: ReservationDetailModalProps) {
  const { t, i18n } = useTranslation(['reservations', 'common']);
  const [imgZoomed, setImgZoomed] = useState(false);

  if (!isOpen) return null;

  const past = isPast(reservation.eventDate, reservation.time);

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
        {/* Top accent strip — sage green */}
        <div className="h-1.5 w-full" style={{ backgroundColor: '#8A9A8B' }} />

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#8E806A44' }} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-4 pb-2">
          <h2 className="text-xl font-bold leading-tight pe-4" style={{ color: '#1a1a1a' }}>
            {reservation.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#8E806A11] transition-colors flex-shrink-0"
          >
            <X size={18} strokeWidth={2} style={{ color: '#8E806A' }} />
          </button>
        </div>

        {/* Past badge */}
        {past && (
          <div className="px-6 pb-2">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#8E806A11', color: '#8E806A' }}
            >
              {t('reservations:pastEvent')}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Image */}
          {reservation.imageUrl && (
            <button
              onClick={() => setImgZoomed(!imgZoomed)}
              className="w-full rounded-xl overflow-hidden focus:outline-none"
            >
              <img
                src={reservation.imageUrl}
                alt={reservation.name}
                className={`w-full object-contain transition-all ${imgZoomed ? 'max-h-96' : 'max-h-48'}`}
              />
            </button>
          )}

          {/* Date & Time */}
          {(reservation.eventDate || reservation.time) && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8E806A' }}>{t('reservations:dateAndTime')}</p>
              <div className="space-y-1.5">
                {reservation.eventDate && (
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} strokeWidth={2} style={{ color: '#8A9A8B' }} />
                    <p className="text-base font-medium" style={{ color: '#1a1a1a' }}>
                      {formatDate(reservation.eventDate, i18n.language)}
                    </p>
                  </div>
                )}
                {reservation.time && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} strokeWidth={2} style={{ color: '#8A9A8B' }} />
                    <p className="text-base font-medium" style={{ color: '#1a1a1a' }}>
                      {reservation.time}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {reservation.address && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#8E806A' }}>{t('reservations:address')}</p>
              <div className="flex items-start gap-2">
                <MapPin size={16} strokeWidth={2} className="mt-0.5 flex-shrink-0" style={{ color: '#8A9A8B' }} />
                <p className="text-sm" style={{ color: '#1a1a1a' }}>{reservation.address}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {reservation.notes && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#8E806A' }}>{t('reservations:notes')}</p>
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#5a5a5a' }}>{reservation.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          {(onEdit || onDelete) && (
            <div className="flex gap-3 pt-2">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(reservation); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: '#8A9A8B22', color: '#4A6B4C' }}
                >
                  <Pencil size={15} strokeWidth={2} />
                  {t('common:edit')}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onClose(); onDelete(reservation.id); }}
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

export default ReservationDetailModal;

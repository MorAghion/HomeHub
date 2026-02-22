import { useState } from 'react';
import { MapPin, Clock, Image } from 'lucide-react';
import type { Reservation } from '../../types/reservation';
import ReservationDetailModal from './ReservationDetailModal';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

function isPast(dateStr?: string, timeStr?: string): boolean {
  if (!dateStr) return false;
  const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
  return dt < new Date();
}

function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false;
  const event = new Date(dateStr);
  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(now.getDate() + 7);
  return event >= now && event <= sevenDays;
}

function ReservationCard({ reservation, onEdit, onDelete }: ReservationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const past = isPast(reservation.eventDate, reservation.time);
  const upcoming = isUpcoming(reservation.eventDate);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left bg-white rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md active:scale-[0.98]"
        style={{ border: '1px solid #8E806A22' }}
      >
        {/* Top accent strip — sage green to distinguish from vouchers */}
        <div className="h-1.5 w-full" style={{ backgroundColor: '#8A9A8B' }} />

        <div className="p-4">
          {/* Name row + image icon */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3
              className="text-base font-semibold leading-tight truncate"
              style={{ color: '#1a1a1a' }}
            >
              {reservation.name}
            </h3>
            {reservation.imageUrl && (
              <Image size={14} strokeWidth={2} className="flex-shrink-0" style={{ color: '#8E806A' }} />
            )}
          </div>

          {/* Date badge */}
          {reservation.eventDate && (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2"
              style={{
                backgroundColor: past
                  ? '#8E806A11'
                  : upcoming
                  ? '#8A9A8B22'
                  : '#8A9A8B11',
                color: past ? '#8E806A' : upcoming ? '#4A6B4C' : '#5A7A5C',
              }}
            >
              {formatDate(reservation.eventDate)}
              {reservation.time && ` · ${reservation.time}`}
            </span>
          )}

          {/* Address */}
          {reservation.address && (
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin size={12} strokeWidth={2} className="mt-0.5 flex-shrink-0" style={{ color: '#8E806A' }} />
              <p className="text-xs truncate" style={{ color: '#8E806A' }}>
                {reservation.address}
              </p>
            </div>
          )}

          {/* Time (standalone, if no date) */}
          {!reservation.eventDate && reservation.time && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2} style={{ color: '#8E806A' }} />
              <p className="text-xs" style={{ color: '#8E806A' }}>{reservation.time}</p>
            </div>
          )}
        </div>
      </button>

      <ReservationDetailModal
        reservation={reservation}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}

export default ReservationCard;

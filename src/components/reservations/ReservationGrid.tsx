import { CalendarDays } from 'lucide-react';
import type { Reservation } from '../../types/reservation';
import ReservationCard from './ReservationCard';

interface ReservationGridProps {
  reservations: Reservation[];
  onEdit?: (reservation: Reservation) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
}

function ReservationGrid({ reservations, onEdit, onDelete, onAdd }: ReservationGridProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <CalendarDays size={56} strokeWidth={1.5} style={{ color: '#8A9A8B', opacity: 0.6 }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#1a1a1a' }}>
          No reservations yet
        </h3>
        <p className="text-sm mb-6" style={{ color: '#8E806A' }}>
          Add your first restaurant booking, ticket, or event
        </p>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#8A9A8B' }}
          >
            Add Reservation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default ReservationGrid;

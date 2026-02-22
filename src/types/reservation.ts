/**
 * Reservation Types
 *
 * TypeScript interfaces for the `reservations` table introduced in
 * migration 14-split-vouchers-reservations.sql.
 *
 * These replace the polymorphic BaseVoucherItem / Reservation types in base.ts
 * for any code that interacts with the dedicated `reservations` table.
 */

/**
 * ReservationRow
 *
 * Mirrors the `reservations` database table column-for-column.
 * Use this when reading from / writing to Supabase directly.
 */
export interface ReservationRow {
  id: string;             // UUID
  name: string;
  event_date: string | null;   // text "YYYY-MM-DD"
  time: string | null;         // text "HH:MM"
  address: string | null;
  image_url: string | null;
  notes: string | null;
  household_id: string;        // UUID
  created_by: string | null;   // UUID — auth.users.id
  created_at: string;          // ISO timestamp
}

/**
 * Reservation
 *
 * Application-layer representation of a reservation / event ticket.
 * Field names are camelCased for use in React components.
 */
export interface Reservation {
  id: string;
  name: string;
  eventDate?: string;    // text "YYYY-MM-DD"
  time?: string;         // text "HH:MM"
  address?: string;
  imageUrl?: string;
  notes?: string;
  householdId: string;
  createdBy?: string;
  createdAt: string;
}

/**
 * toReservation
 *
 * Maps a ReservationRow (snake_case DB shape) to a Reservation (camelCase app shape).
 */
export function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    name: row.name,
    eventDate: row.event_date ?? undefined,
    time: row.time ?? undefined,
    address: row.address ?? undefined,
    imageUrl: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    householdId: row.household_id,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * toReservationRow
 *
 * Maps a Reservation (camelCase app shape) to a ReservationRow (snake_case DB shape)
 * suitable for INSERT / UPDATE operations.
 */
export function toReservationRow(reservation: Omit<Reservation, 'id' | 'createdAt'>): Omit<ReservationRow, 'id' | 'created_at'> {
  return {
    name: reservation.name,
    event_date: reservation.eventDate ?? null,
    time: reservation.time ?? null,
    address: reservation.address ?? null,
    image_url: reservation.imageUrl ?? null,
    notes: reservation.notes ?? null,
    household_id: reservation.householdId,
    created_by: reservation.createdBy ?? null,
  };
}

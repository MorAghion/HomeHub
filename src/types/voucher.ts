/**
 * Voucher Types
 *
 * TypeScript interfaces for the `vouchers` table introduced in
 * migration 14-split-vouchers-reservations.sql.
 *
 * These replace the polymorphic BaseVoucherItem / Voucher types in base.ts
 * for any code that interacts with the dedicated `vouchers` table.
 */

/**
 * VoucherRow
 *
 * Mirrors the `vouchers` database table column-for-column.
 * Use this when reading from / writing to Supabase directly.
 */
export interface VoucherRow {
  id: string;            // UUID
  name: string;
  value: string | null;
  issuer: string | null;
  expiry_date: string | null;   // ISO date string "YYYY-MM-DD"
  code: string | null;
  image_url: string | null;
  notes: string | null;
  household_id: string;         // UUID
  created_by: string | null;    // UUID — auth.users.id
  created_at: string;           // ISO timestamp
}

/**
 * Voucher
 *
 * Application-layer representation of a voucher / gift card.
 * Field names are camelCased for use in React components.
 */
export interface Voucher {
  id: string;
  name: string;
  value?: string;
  issuer?: string;
  expiryDate?: string;    // ISO date string "YYYY-MM-DD"
  code?: string;
  imageUrl?: string;
  notes?: string;
  householdId: string;
  createdBy?: string;
  createdAt: string;
}

/**
 * toVoucher
 *
 * Maps a VoucherRow (snake_case DB shape) to a Voucher (camelCase app shape).
 */
export function toVoucher(row: VoucherRow): Voucher {
  return {
    id: row.id,
    name: row.name,
    value: row.value ?? undefined,
    issuer: row.issuer ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    code: row.code ?? undefined,
    imageUrl: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    householdId: row.household_id,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * toVoucherRow
 *
 * Maps a Voucher (camelCase app shape) to a VoucherRow (snake_case DB shape)
 * suitable for INSERT / UPDATE operations.
 */
export function toVoucherRow(voucher: Omit<Voucher, 'id' | 'createdAt'>): Omit<VoucherRow, 'id' | 'created_at'> {
  return {
    name: voucher.name,
    value: voucher.value ?? null,
    issuer: voucher.issuer ?? null,
    expiry_date: voucher.expiryDate ?? null,
    code: voucher.code ?? null,
    image_url: voucher.imageUrl ?? null,
    notes: voucher.notes ?? null,
    household_id: voucher.householdId,
    created_by: voucher.createdBy ?? null,
  };
}

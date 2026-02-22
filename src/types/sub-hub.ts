/**
 * Sub-Hub Types
 *
 * TypeScript interfaces for the voucher_lists sub-hub table.
 * The `type` field (renamed from `default_type` in migration 14) stores the
 * hub's item type explicitly so it is never derived at runtime.
 */

/** The two item types a Voucher Sub-Hub can hold. */
export type SubHubType = 'voucher' | 'reservation';

/**
 * VoucherSubHubRow
 *
 * Mirrors the `voucher_lists` database table column-for-column.
 * The `type` field was renamed from `default_type` in migration 14.
 */
export interface VoucherSubHubRow {
  id: string;                       // UUID
  household_id: string;             // UUID
  name: string;
  context: string | null;
  type: SubHubType | null;          // explicit item type for this sub-hub
  created_at: string;               // ISO timestamp
  updated_at: string;               // ISO timestamp
}

/**
 * VoucherSubHub
 *
 * Application-layer representation of a Voucher Sub-Hub.
 * Field names are camelCased for use in React components.
 */
export interface VoucherSubHub {
  id: string;
  householdId: string;
  name: string;
  context?: string;
  type?: SubHubType;
  createdAt: string;
  updatedAt: string;
}

/**
 * toVoucherSubHub
 *
 * Maps a VoucherSubHubRow (snake_case DB shape) to a VoucherSubHub (camelCase app shape).
 */
export function toVoucherSubHub(row: VoucherSubHubRow): VoucherSubHub {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    context: row.context ?? undefined,
    type: row.type ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

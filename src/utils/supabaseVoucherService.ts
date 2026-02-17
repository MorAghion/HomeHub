/**
 * Supabase Voucher Service
 *
 * Replaces localStorage-based voucher storage with Supabase.
 * Handles both Voucher and Reservation item types (polymorphic).
 *
 * Field mapping (App ↔ DB):
 *   VoucherItem.itemType  ↔  voucher_items.type
 *   Voucher.expiryDate    ↔  voucher_items.expiry_date
 *   Reservation.eventDate ↔  voucher_items.event_date
 *   Reservation.time      ↔  voucher_items.event_time
 *   Reservation.address   ↔  voucher_items.location
 */

import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { VoucherItem, Voucher, Reservation, VoucherListInstance } from '../types/base';

// =============================================================================
// Internal: DB row shapes
// =============================================================================

interface DbVoucherList {
  id: string;
  household_id: string;
  name: string;
  default_type: 'voucher' | 'reservation' | null;
}

interface DbVoucherItem {
  id: string;
  list_id: string;
  type: 'voucher' | 'reservation';
  name: string;
  notes: string | null;
  // Voucher fields
  value: string | null;
  issuer: string | null;
  expiry_date: string | null;
  code: string | null;
  used: boolean | null;
  // Reservation fields
  location: string | null;
  event_date: string | null;
  event_time: string | null;
  // Shared
  image_url: string | null;
}

// =============================================================================
// Internal: Mappers
// =============================================================================

function mapList(row: DbVoucherList): Omit<VoucherListInstance, 'items'> {
  return {
    id:          row.id,
    name:        row.name,
    defaultType: row.default_type ?? undefined,
  };
}

function mapItem(row: DbVoucherItem): VoucherItem {
  const base = {
    id:       row.id,
    name:     row.name,
    imageUrl: row.image_url ?? undefined,
    notes:    row.notes ?? undefined,
  };

  if (row.type === 'voucher') {
    const v: Voucher = {
      ...base,
      itemType:   'voucher',
      value:      row.value ?? undefined,
      issuer:     row.issuer ?? undefined,
      expiryDate: row.expiry_date ?? undefined,
      code:       row.code ?? undefined,
    };
    return v;
  } else {
    const r: Reservation = {
      ...base,
      itemType:  'reservation',
      eventDate: row.event_date ?? undefined,
      time:      row.event_time ?? undefined,
      address:   row.location ?? undefined,
      code:      row.code ?? undefined,
    };
    return r;
  }
}

function itemToRow(listId: string, id: string, item: VoucherItem): Omit<DbVoucherItem, 'used'> & { list_id: string } {
  const base = {
    id,
    list_id:   listId,
    type:      item.itemType,
    name:      item.name,
    notes:     item.notes ?? null,
    image_url: item.imageUrl ?? null,
    // defaults
    value:      null as string | null,
    issuer:     null as string | null,
    expiry_date: null as string | null,
    code:       null as string | null,
    location:   null as string | null,
    event_date: null as string | null,
    event_time: null as string | null,
  };

  if (item.itemType === 'voucher') {
    return {
      ...base,
      value:       item.value ?? null,
      issuer:      item.issuer ?? null,
      expiry_date: item.expiryDate ?? null,
      code:        item.code ?? null,
    };
  } else {
    return {
      ...base,
      location:   item.address ?? null,
      event_date: item.eventDate ?? null,
      event_time: item.time ?? null,
      code:       item.code ?? null,
    };
  }
}

// =============================================================================
// Voucher Lists CRUD
// =============================================================================

async function fetchLists(householdId: string): Promise<VoucherListInstance[]> {
  const { data, error } = await supabase
    .from('voucher_lists')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`fetchLists: ${error.message}`);

  const lists = await Promise.all(
    (data as DbVoucherList[]).map(async (row) => {
      const items = await fetchItems(row.id);
      return { ...mapList(row), items };
    })
  );
  return lists;
}

async function createList(
  householdId: string,
  name: string,
  defaultType?: 'voucher' | 'reservation',
): Promise<Omit<VoucherListInstance, 'items'>> {
  const { data, error } = await supabase
    .from('voucher_lists')
    .insert({ household_id: householdId, name, default_type: defaultType ?? null })
    .select()
    .single();

  if (error) throw new Error(`createList: ${error.message}`);
  return mapList(data as DbVoucherList);
}

async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('voucher_lists')
    .delete()
    .eq('id', listId);

  if (error) throw new Error(`deleteList: ${error.message}`);
}

// =============================================================================
// Voucher Items CRUD
// =============================================================================

async function fetchItems(listId: string): Promise<VoucherItem[]> {
  const { data, error } = await supabase
    .from('voucher_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`fetchItems: ${error.message}`);
  return (data as DbVoucherItem[]).map(mapItem);
}

async function upsertItem(listId: string, id: string, item: VoucherItem): Promise<void> {
  const row = itemToRow(listId, id, item);
  const { error } = await supabase
    .from('voucher_items')
    .upsert(row);

  if (error) throw new Error(`upsertItem: ${error.message}`);
}

async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('voucher_items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(`deleteItem: ${error.message}`);
}

// =============================================================================
// Realtime Subscriptions
// =============================================================================

function subscribeToLists(
  householdId: string,
  onUpdate: () => void,
): RealtimeChannel {
  return supabase
    .channel(`voucher_lists:${householdId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'voucher_lists',
        filter: `household_id=eq.${householdId}` },
      onUpdate,
    )
    .subscribe();
}

function subscribeToItems(
  listId: string,
  onUpdate: (items: VoucherItem[]) => void,
): RealtimeChannel {
  return supabase
    .channel(`voucher_items:${listId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'voucher_items',
        filter: `list_id=eq.${listId}` },
      async () => {
        try {
          const items = await fetchItems(listId);
          onUpdate(items);
        } catch (err) {
          console.error('[Voucher Realtime] Failed to refresh items:', err);
        }
      },
    )
    .subscribe();
}

// =============================================================================
// Exported Service
// =============================================================================

export const VoucherService = {
  fetchLists,
  createList,
  deleteList,
  fetchItems,
  upsertItem,
  deleteItem,
  subscribeToLists,
  subscribeToItems,
};

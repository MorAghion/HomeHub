/**
 * Supabase Master List Service
 *
 * Manages master_list_items — the permanent template items for each
 * shopping Sub-Hub. Replaces the localStorage-based flexibleMemory.ts.
 *
 * Usage:
 *   const items = await MasterListService.fetchItems(listId);
 *   await MasterListService.addItem(listId, itemId, 'Milk', 'Dairy');
 *   await MasterListService.updateItem(itemId, { text: 'Full Cream Milk' });
 *   await MasterListService.deleteItem(itemId);
 *
 *   const channel = MasterListService.subscribeToList(listId, setMasterItems);
 *   // On unmount: supabase.removeChannel(channel)
 */

import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

export interface MasterItem {
  id: string;       // UUID — supplied by the client (crypto.randomUUID())
  listId: string;
  text: string;
  category?: string;
}

interface DbMasterItem {
  id: string;
  list_id: string;
  text: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

function mapItem(row: DbMasterItem): MasterItem {
  return {
    id:       row.id,
    listId:   row.list_id,
    text:     row.text,
    category: row.category ?? undefined,
  };
}

// =============================================================================
// CRUD
// =============================================================================

/**
 * Fetches all master list items for a Sub-Hub, ordered by creation date.
 */
async function fetchItems(listId: string): Promise<MasterItem[]> {
  const { data, error } = await supabase
    .from('master_list_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`fetchItems: ${error.message}`);
  return (data as DbMasterItem[]).map(mapItem);
}

/**
 * Inserts a new master list item.
 * The caller provides the UUID so we can insert client-generated IDs
 * without a round-trip to get the DB-assigned id.
 */
async function addItem(
  listId: string,
  id: string,
  text: string,
  category?: string,
): Promise<void> {
  const { error } = await supabase
    .from('master_list_items')
    .insert({ id, list_id: listId, text, category: category ?? null });

  if (error) throw new Error(`addItem: ${error.message}`);
}

/**
 * Inserts multiple master list items in a single batch.
 */
async function addItems(
  listId: string,
  items: Array<{ id: string; text: string; category?: string }>,
): Promise<void> {
  if (items.length === 0) return;

  const { error } = await supabase
    .from('master_list_items')
    .insert(
      items.map((item) => ({
        id:       item.id,
        list_id:  listId,
        text:     item.text,
        category: item.category ?? null,
      }))
    );

  if (error) throw new Error(`addItems: ${error.message}`);
}

/**
 * Updates an existing master list item's text and/or category.
 */
async function updateItem(
  itemId: string,
  patch: Partial<Pick<MasterItem, 'text' | 'category'>>,
): Promise<void> {
  const { error } = await supabase
    .from('master_list_items')
    .update({
      ...(patch.text     !== undefined && { text:     patch.text }),
      ...(patch.category !== undefined && { category: patch.category ?? null }),
    })
    .eq('id', itemId);

  if (error) throw new Error(`updateItem: ${error.message}`);
}

/**
 * Deletes a single master list item.
 */
async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('master_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(`deleteItem: ${error.message}`);
}

/**
 * Deletes all master list items for a Sub-Hub (used when deleting a list).
 */
async function clearList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('master_list_items')
    .delete()
    .eq('list_id', listId);

  if (error) throw new Error(`clearList: ${error.message}`);
}

// =============================================================================
// Realtime
// =============================================================================

/**
 * Subscribes to master list changes for a specific Sub-Hub.
 * Re-fetches all items on any INSERT/UPDATE/DELETE so the callback
 * receives a consistent sorted snapshot.
 *
 * @example
 * const channel = MasterListService.subscribeToList(listId, setMasterItems);
 * // On unmount: supabase.removeChannel(channel)
 */
function subscribeToList(
  listId: string,
  onUpdate: (items: MasterItem[]) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`master_list_items:${listId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'master_list_items',
        filter: `list_id=eq.${listId}`,
      },
      async () => {
        try {
          const items = await fetchItems(listId);
          onUpdate(items);
        } catch (err) {
          console.error('[MasterList Realtime] Failed to refresh:', err);
        }
      },
    )
    .subscribe();

  return channel;
}

// =============================================================================
// Exported Service Object
// =============================================================================

export const MasterListService = {
  fetchItems,
  addItem,
  addItems,
  updateItem,
  deleteItem,
  clearList,
  subscribeToList,
};

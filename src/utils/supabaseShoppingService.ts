/**
 * Supabase Shopping Service
 *
 * Replaces localStorage-based shopping list storage with Supabase.
 * Provides CRUD operations and Realtime subscriptions so all household
 * members see changes instantly.
 *
 * Usage:
 *   const lists = await ShoppingService.fetchLists(householdId);
 *   const list  = await ShoppingService.createList(householdId, 'Supermarket');
 *   const item  = await ShoppingService.addItem(list.id, 'Milk', 'Dairy');
 *   await ShoppingService.toggleItem(item.id, true);
 *
 *   const channel = ShoppingService.subscribeToListItems(listId, (items) => {
 *     setItems(items);
 *   });
 *   // On unmount: supabase.removeChannel(channel)
 */

import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// Types
// =============================================================================

/** A shopping Sub-Hub (e.g. "Supermarket", "Camping trip") */
export interface ShoppingList {
  id: string;         // UUID from Supabase
  householdId: string;
  name: string;
  icon?: string;      // Lucide icon name, e.g. "ShoppingCart"
  color?: string;     // Hex color, e.g. "#630606"
  context?: string;   // Detected context key, e.g. "grocery"
  createdAt: string;
  updatedAt: string;
}

/** A single item inside a shopping list */
export interface ShoppingItem {
  id: string;         // UUID from Supabase
  listId: string;
  text: string;
  category?: string;  // Auto-detected, e.g. "Dairy", "Produce"
  quantity?: string;  // Free-text, e.g. "2kg", "x3"
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Internal: DB row shapes (what Supabase returns verbatim)
// =============================================================================

interface DbShoppingList {
  id: string;
  household_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  context: string | null;
  created_at: string;
  updated_at: string;
}

interface DbShoppingItem {
  id: string;
  list_id: string;
  text: string;
  category: string | null;
  quantity: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Internal: Row → App-type mappers
// =============================================================================

function mapList(row: DbShoppingList): ShoppingList {
  return {
    id:          row.id,
    householdId: row.household_id,
    name:        row.name,
    icon:        row.icon        ?? undefined,
    color:       row.color       ?? undefined,
    context:     row.context     ?? undefined,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

function mapItem(row: DbShoppingItem): ShoppingItem {
  return {
    id:          row.id,
    listId:      row.list_id,
    text:        row.text,
    category:    row.category    ?? undefined,
    quantity:    row.quantity    ?? undefined,
    isCompleted: row.is_completed,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

// =============================================================================
// Shopping Lists CRUD
// =============================================================================

/**
 * Fetches all shopping lists for a household, ordered by creation date.
 */
async function fetchLists(householdId: string): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`fetchLists: ${error.message}`);
  return (data as DbShoppingList[]).map(mapList);
}

/**
 * Creates a new shopping list (Sub-Hub) for a household.
 */
async function createList(
  householdId: string,
  name: string,
  icon?: string,
  color?: string,
  context?: string,
): Promise<ShoppingList> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ household_id: householdId, name, icon, color, context })
    .select()
    .single();

  if (error) throw new Error(`createList: ${error.message}`);
  return mapList(data as DbShoppingList);
}

/**
 * Renames a shopping list or updates its icon/color.
 */
async function updateList(
  listId: string,
  patch: Partial<Pick<ShoppingList, 'name' | 'icon' | 'color'>>,
): Promise<ShoppingList> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(patch)
    .eq('id', listId)
    .select()
    .single();

  if (error) throw new Error(`updateList: ${error.message}`);
  return mapList(data as DbShoppingList);
}

/**
 * Permanently deletes a shopping list and all its items (cascade).
 */
async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', listId);

  if (error) throw new Error(`deleteList: ${error.message}`);
}

// =============================================================================
// Shopping Items CRUD
// =============================================================================

/**
 * Fetches all items for a list.
 * Active (not completed) items first, then completed — within each group,
 * ordered by creation date so the list feels stable.
 */
async function fetchItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('list_id', listId)
    .order('is_completed', { ascending: true })
    .order('created_at',   { ascending: true });

  if (error) throw new Error(`fetchItems: ${error.message}`);
  return (data as DbShoppingItem[]).map(mapItem);
}

/**
 * Adds a new item to a shopping list.
 */
async function addItem(
  listId: string,
  text: string,
  category?: string,
  quantity?: string,
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ list_id: listId, text, category, quantity, is_completed: false })
    .select()
    .single();

  if (error) throw new Error(`addItem: ${error.message}`);
  return mapItem(data as DbShoppingItem);
}

/**
 * Toggles the completion state of a shopping item.
 * Pass isCompleted=true to check it off, false to uncheck.
 */
async function toggleItem(itemId: string, isCompleted: boolean): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .update({ is_completed: isCompleted })
    .eq('id', itemId);

  if (error) throw new Error(`toggleItem: ${error.message}`);
}

/**
 * Updates an item's text, category, or quantity.
 */
async function updateItem(
  itemId: string,
  patch: Partial<Pick<ShoppingItem, 'text' | 'category' | 'quantity'>>,
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from('shopping_items')
    .update(patch)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw new Error(`updateItem: ${error.message}`);
  return mapItem(data as DbShoppingItem);
}

/**
 * Deletes a single item from a list.
 */
async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(`deleteItem: ${error.message}`);
}

/**
 * Clears all completed items from a list (the "sweep" action).
 */
async function clearCompletedItems(listId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('list_id', listId)
    .eq('is_completed', true);

  if (error) throw new Error(`clearCompletedItems: ${error.message}`);
}

// =============================================================================
// Realtime Subscriptions
// =============================================================================

/**
 * Subscribes to all item changes within a specific list.
 * Re-fetches the full item list on every INSERT/UPDATE/DELETE so the
 * callback always receives a consistent, sorted snapshot.
 *
 * @example
 * const channel = ShoppingService.subscribeToListItems(listId, setItems);
 * // On component unmount:
 * supabase.removeChannel(channel);
 */
function subscribeToListItems(
  listId: string,
  onUpdate: (items: ShoppingItem[]) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`shopping_items:${listId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'shopping_items',
        filter: `list_id=eq.${listId}`,
      },
      async () => {
        // Re-fetch on any change to get a consistent sorted snapshot
        try {
          const items = await fetchItems(listId);
          onUpdate(items);
        } catch (err) {
          console.error('[Realtime] Failed to refresh items:', err);
        }
      },
    )
    .subscribe();

  return channel;
}

/**
 * Subscribes to list-level changes for a household (new lists, renames, deletes).
 * Re-fetches all lists on any change.
 *
 * @example
 * const channel = ShoppingService.subscribeToLists(householdId, setLists);
 * // On component unmount:
 * supabase.removeChannel(channel);
 */
function subscribeToLists(
  householdId: string,
  onUpdate: (lists: ShoppingList[]) => void,
): RealtimeChannel {
  const channel = supabase
    .channel(`shopping_lists:${householdId}`)
    .on(
      'postgres_changes',
      {
        event:  '*',
        schema: 'public',
        table:  'shopping_lists',
        filter: `household_id=eq.${householdId}`,
      },
      async () => {
        try {
          const lists = await fetchLists(householdId);
          onUpdate(lists);
        } catch (err) {
          console.error('[Realtime] Failed to refresh lists:', err);
        }
      },
    )
    .subscribe();

  return channel;
}

// =============================================================================
// Exported Service Object
// =============================================================================

export const ShoppingService = {
  // Lists
  fetchLists,
  createList,
  updateList,
  deleteList,
  // Items
  fetchItems,
  addItem,
  toggleItem,
  updateItem,
  deleteItem,
  clearCompletedItems,
  // Realtime
  subscribeToListItems,
  subscribeToLists,
};

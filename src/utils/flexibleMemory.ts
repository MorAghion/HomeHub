/**
 * Flexible Memory System
 *
 * V2: Hierarchical ID-based storage with isolated Master Lists per Sub-Hub.
 * Each Sub-Hub has its own Master List stored by ID, not shared by context.
 *
 * localStorage Key Structure:
 * - NEW (V2): master_{subHubId} - Fully isolated, ID-based storage
 * - OLD (V1): homehub-masterlist-{contextKey} - Context-based, shared storage (deprecated)
 *
 * Examples:
 * - V2: master_shopping-hub_groceries, master_shopping-hub_list-1739384920000
 * - V1: homehub-masterlist-camping, homehub-masterlist-grocery (legacy)
 */

import type { MasterListItem } from '../App';
import { detectContext } from './contextMapping';

const MASTER_LIST_PREFIX = 'homehub-masterlist';
const DEFAULT_CONTEXT = 'default';

// =============================================================================
// V2: Hierarchical ID-Based Storage (Current)
// =============================================================================

/**
 * Generates a localStorage key for the Master List based on Sub-Hub ID
 *
 * @param subHubId - The Sub-Hub ID (e.g., "shopping-hub_groceries")
 * @returns The localStorage key (e.g., "master_shopping-hub_groceries")
 */
export function generateMasterListKeyById(subHubId: string): string {
  return `master_${subHubId}`;
}

/**
 * Loads the Master List for a Sub-Hub from localStorage using its ID
 *
 * @param subHubId - The Sub-Hub ID
 * @returns Array of Master List items or empty array
 */
export function loadMasterListById(subHubId: string): MasterListItem[] {
  const key = generateMasterListKeyById(subHubId);
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(`Failed to parse Master List from key "${key}":`, error);
      return [];
    }
  }

  return [];
}

/**
 * Saves the Master List for a Sub-Hub to localStorage using its ID
 *
 * @param subHubId - The Sub-Hub ID
 * @param items - The Master List items to save
 */
export function saveMasterListById(subHubId: string, items: MasterListItem[]): void {
  const key = generateMasterListKeyById(subHubId);
  localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Clears the Master List for a specific Sub-Hub by ID
 *
 * @param subHubId - The Sub-Hub ID to clear
 */
export function clearMasterListById(subHubId: string): void {
  const key = generateMasterListKeyById(subHubId);
  localStorage.removeItem(key);
}

// =============================================================================
// V1: Context-Based Storage (Deprecated - Legacy Support)
// =============================================================================

/**
 * Sanitizes a Sub-Hub name to create a unique, safe localStorage key
 *
 * @deprecated Use ID-based storage instead (V2)
 * @param name - The Sub-Hub name
 * @returns A sanitized key-safe string
 */
function sanitizeForKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50); // Limit length
}

/**
 * Generates a localStorage key for the Master List based on the Sub-Hub's context
 *
 * If the Sub-Hub name matches a known context (e.g., "Camping"), uses that context key.
 * Otherwise, uses a unique key based on the sanitized Sub-Hub name to prevent data leaks.
 *
 * @deprecated Use generateMasterListKeyById() instead (V2)
 * @param subHubName - The name of the Sub-Hub (list)
 * @returns The localStorage key (e.g., "homehub-masterlist-camping" or "homehub-masterlist-custom-my-list")
 */
export function generateMasterListKey(subHubName: string): string {
  const detectedContext = detectContext(subHubName);

  if (detectedContext) {
    // Use the detected context for shared memory (e.g., "camping", "grocery")
    return `${MASTER_LIST_PREFIX}-${detectedContext}`;
  } else {
    // Use a unique key based on the Sub-Hub name to prevent unintended sharing
    const uniqueKey = sanitizeForKey(subHubName);
    return `${MASTER_LIST_PREFIX}-custom-${uniqueKey}`;
  }
}

/**
 * Gets the context that a Sub-Hub belongs to
 *
 * @deprecated Use ID-based storage instead (V2)
 * @param subHubName - The name of the Sub-Hub (list)
 * @returns The context key (e.g., "camping") or a unique custom key
 */
export function getContextForSubHub(subHubName: string): string {
  const detectedContext = detectContext(subHubName);
  if (detectedContext) {
    return detectedContext;
  } else {
    // Return unique identifier for unmatched lists
    return `custom-${sanitizeForKey(subHubName)}`;
  }
}

/**
 * Loads the Master List for a Sub-Hub from localStorage based on its context
 *
 * Returns the saved Master List if it exists in localStorage,
 * otherwise returns an empty array.
 *
 * @deprecated Use loadMasterListById() instead (V2)
 * @param subHubName - The name of the Sub-Hub (list)
 * @returns Array of Master List items from localStorage or empty array
 */
export function loadMasterListByContext(subHubName: string): MasterListItem[] {
  const key = generateMasterListKey(subHubName);
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(`Failed to parse Master List from key "${key}":`, error);
      return [];
    }
  }

  return [];
}

/**
 * Saves the Master List for a Sub-Hub to localStorage based on its context
 *
 * @deprecated Use saveMasterListById() instead (V2)
 * @param subHubName - The name of the Sub-Hub (list)
 * @param items - The Master List items to save
 */
export function saveMasterListByContext(subHubName: string, items: MasterListItem[]): void {
  const key = generateMasterListKey(subHubName);
  localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Gets all stored Master List contexts from localStorage
 *
 * Useful for debugging or displaying which contexts have saved data.
 *
 * @returns Array of context keys that have saved Master Lists
 */
export function getAllStoredContexts(): string[] {
  const contexts: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(MASTER_LIST_PREFIX)) {
      const contextKey = key.replace(`${MASTER_LIST_PREFIX}-`, '');
      contexts.push(contextKey);
    }
  }

  return contexts;
}

/**
 * Clears the Master List for a specific context
 *
 * @deprecated Use clearMasterListById() instead (V2)
 * @param contextKey - The context key to clear (e.g., "camping")
 */
export function clearMasterListForContext(contextKey: string): void {
  const key = `${MASTER_LIST_PREFIX}-${contextKey}`;
  localStorage.removeItem(key);
}

/**
 * Clears all Master Lists from localStorage
 *
 * Use with caution! This removes all saved Master Lists.
 */
export function clearAllMasterLists(): void {
  const contexts = getAllStoredContexts();
  contexts.forEach(context => clearMasterListForContext(context));
}

/**
 * Clears the Master List associated with a specific Sub-Hub name
 * ONLY if no other Sub-Hubs are using the same context
 *
 * Derives the context from the Sub-Hub name and clears that context's Master List.
 * Use this when deleting a Sub-Hub to clean up its associated Master List.
 *
 * @deprecated Use clearMasterListById() instead (V2)
 * @param subHubName - The name of the Sub-Hub being deleted
 * @param remainingSubHubs - Array of remaining Sub-Hub names (to check if context is still in use)
 */
export function clearMasterListForSubHub(subHubName: string, remainingSubHubs: string[]): void {
  const context = getContextForSubHub(subHubName);

  // For custom contexts (unmatched lists), always clear since they're unique
  if (context.startsWith('custom-')) {
    clearMasterListForContext(context);
    return;
  }

  // For shared contexts (matched lists), only clear if no other Sub-Hubs use it
  const contextStillInUse = remainingSubHubs.some(hubName => {
    const hubContext = getContextForSubHub(hubName);
    return hubContext === context;
  });

  // Only clear if no other Sub-Hubs are using this context
  if (!contextStillInUse) {
    clearMasterListForContext(context);
  }
}

/**
 * Checks if a Sub-Hub name would map to an existing context with saved data
 *
 * Use this to detect potential "data leaks" where a new Sub-Hub might inherit
 * old Master List data from localStorage.
 *
 * @deprecated No longer needed with ID-based storage (V2)
 * @param subHubName - The name of the Sub-Hub to check
 * @returns true if the context has existing Master List data
 */
export function hasExistingMasterListData(subHubName: string): boolean {
  const context = detectContext(subHubName) || DEFAULT_CONTEXT;
  const key = `${MASTER_LIST_PREFIX}-${context}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      const items = JSON.parse(saved);
      return Array.isArray(items) && items.length > 0;
    } catch {
      return false;
    }
  }

  return false;
}

// =============================================================================
// Migration (V1 → V2)
// =============================================================================

interface ListInstance {
  id: string;
  name: string;
  items: any[];
}

/**
 * Migrates context-based storage (V1) to hierarchical ID-based storage (V2)
 *
 * Runs once per app. Copies data from old context keys to new ID-based keys.
 * Preserves old keys for rollback safety.
 *
 * @param lists - Record of all current list instances
 */
export function migrateContextBasedStorage(lists: Record<string, ListInstance>): void {
  const MIGRATION_FLAG = 'homehub-migration-v2-complete';

  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return;
  }

  console.log('[Migration V2] Starting hierarchical storage migration...');

  let migrationCount = 0;

  Object.values(lists).forEach(list => {
    // Try to load old context-based data
    const oldKey = generateMasterListKey(list.name);
    const oldData = localStorage.getItem(oldKey);

    if (oldData) {
      try {
        // Validate it's parseable JSON
        JSON.parse(oldData);

        // Save to new hierarchical key
        const newKey = generateMasterListKeyById(list.id);
        localStorage.setItem(newKey, oldData);

        migrationCount++;
        console.log(`[Migration V2] ${oldKey} → ${newKey}`);
      } catch (error) {
        console.error(`[Migration V2] Failed to migrate ${oldKey}:`, error);
      }
    }
  });

  // Mark migration as complete
  localStorage.setItem(MIGRATION_FLAG, 'true');
  console.log(`[Migration V2] Complete! Migrated ${migrationCount} Master Lists.`);
}

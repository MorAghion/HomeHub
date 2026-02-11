/**
 * Flexible Memory System
 *
 * Persists Master Lists in localStorage based on Context.
 * Similar list names (e.g., "Stock" and "Home Stock") share the same Master List,
 * ensuring updates in one reflect in the other.
 *
 * localStorage Key Structure:
 * - Context-based: homehub-masterlist-{contextKey}
 * - Example: homehub-masterlist-camping, homehub-masterlist-grocery
 * - Fallback: homehub-masterlist-default (for lists with no context match)
 */

import type { MasterListItem } from '../App';
import { detectContext } from './contextMapping';

const MASTER_LIST_PREFIX = 'homehub-masterlist';
const DEFAULT_CONTEXT = 'default';

/**
 * Generates a localStorage key for the Master List based on the Sub-Hub's context
 *
 * If the Sub-Hub name matches a known context (e.g., "Camping"), uses that context key.
 * Otherwise, uses the default key.
 *
 * @param subHubName - The name of the Sub-Hub (list)
 * @returns The localStorage key (e.g., "homehub-masterlist-camping")
 */
export function generateMasterListKey(subHubName: string): string {
  const detectedContext = detectContext(subHubName);
  const contextKey = detectedContext || DEFAULT_CONTEXT;
  return `${MASTER_LIST_PREFIX}-${contextKey}`;
}

/**
 * Gets the context that a Sub-Hub belongs to
 *
 * @param subHubName - The name of the Sub-Hub (list)
 * @returns The context key (e.g., "camping") or "default"
 */
export function getContextForSubHub(subHubName: string): string {
  return detectContext(subHubName) || DEFAULT_CONTEXT;
}

/**
 * Loads the Master List for a Sub-Hub from localStorage based on its context
 *
 * Returns the saved Master List if it exists in localStorage,
 * otherwise returns an empty array.
 *
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

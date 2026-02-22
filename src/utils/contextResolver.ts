/**
 * Context Resolver — language-aware single export point
 *
 * All components import from here instead of directly from
 * contextMapping.ts, suggestions.ts, or iconMapping.ts.
 *
 * Exported function signatures are identical to the original files
 * so no component logic needs to change — only the import path.
 */

import i18n from '../i18n/config';

// English originals (do not modify)
import {
  detectContext as detectContextEn,
  getSuggestedContexts as getSuggestedContextsEn,
  getContextItems as getContextItemsEn,
  getContextLabel as getContextLabelEn,
  type ContextItem,
} from './contextMapping';

// Hebrew overrides
import {
  detectContextHe,
  getSuggestedContextsHe,
  getContextItemsHe,
  getContextLabelHe,
} from './he/contextMapping';

// English suggestions (do not modify)
import {
  matchListNameToTemplate as matchListNameToTemplateEn,
  getSuggestedTemplates as getSuggestedTemplatesEn,
  filterMasterItemsByContext as filterMasterItemsByContextEn,
  SUGGESTION_TEMPLATES,
  CATEGORY_FILTERS,
  type SuggestedItem,
  type SuggestionTemplate,
} from './suggestions';

// Hebrew suggestions
import {
  matchListNameToTemplateHe,
  getSuggestedTemplatesHe,
  filterMasterItemsByContextHe,
  SUGGESTION_TEMPLATES_HE,
} from './he/suggestions';

// English icon mapping (do not modify)
import {
  getContextIcon as getContextIconEn,
  getHubIcon,
  getIconByContext,
} from './iconMapping';

import type { LucideIcon } from 'lucide-react';

// Hebrew icon mapping
import { getContextIconHe } from './he/iconMapping';

import type { MasterListItem } from '../types/base';

// Re-export types and passthrough exports
export type { ContextItem, SuggestedItem, SuggestionTemplate };
export type { LucideIcon } from 'lucide-react';
export { getHubIcon, getIconByContext, SUGGESTION_TEMPLATES, CATEGORY_FILTERS, SUGGESTION_TEMPLATES_HE };

// ─── Context Detection ───────────────────────────────────────────────────────

/**
 * Detects the context of a Sub-Hub name.
 * Checks English mapping first, then Hebrew mapping.
 */
export function detectContext(subHubName: string): string | null {
  const enResult = detectContextEn(subHubName);
  if (enResult) return enResult;
  return detectContextHe(subHubName);
}

/**
 * Gets all matching contexts for a Sub-Hub name.
 * Merges English and Hebrew results, deduplicated by contextKey.
 */
export function getSuggestedContexts(subHubName: string): Array<{
  contextKey: string;
  displayLabel: string;
  itemCount: number;
}> {
  const isHebrew = i18n.language === 'he';

  const enResults = getSuggestedContextsEn(subHubName);
  const heResults = getSuggestedContextsHe(subHubName);

  const seen = new Set<string>();
  const merged: Array<{ contextKey: string; displayLabel: string; itemCount: number }> = [];

  // When Hebrew is active, prefer Hebrew display labels for merged results
  const primary = isHebrew ? heResults : enResults;
  const secondary = isHebrew ? enResults : heResults;

  for (const r of [...primary, ...secondary]) {
    if (!seen.has(r.contextKey)) {
      seen.add(r.contextKey);
      merged.push(r);
    }
  }

  return merged;
}

// ─── Context Items & Labels ──────────────────────────────────────────────────

/**
 * Gets items for a context.
 * Returns Hebrew items when app language is Hebrew, English otherwise.
 */
export function getContextItems(contextKey: string): ContextItem[] {
  if (i18n.language === 'he') {
    const heItems = getContextItemsHe(contextKey);
    if (heItems.length > 0) return heItems;
  }
  return getContextItemsEn(contextKey);
}

/**
 * Gets the display label for a context.
 * Returns Hebrew label when app language is Hebrew, English otherwise.
 */
export function getContextLabel(contextKey: string): string {
  if (i18n.language === 'he') {
    const heLabel = getContextLabelHe(contextKey);
    if (heLabel) return heLabel;
  }
  return getContextLabelEn(contextKey);
}

// ─── Icon Mapping ────────────────────────────────────────────────────────────

/**
 * Gets an icon for a Sub-Hub name.
 * Checks Hebrew keywords first (if Hebrew name detected), then English map.
 */
export function getContextIcon(name: string): LucideIcon {
  // Try Hebrew map first — it returns null if no match
  const heIcon = getContextIconHe(name);
  if (heIcon !== null) return heIcon;

  // Fall back to English map (returns LayoutList as default)
  return getContextIconEn(name);
}

// ─── Suggestions ─────────────────────────────────────────────────────────────

/**
 * Matches a list name to a suggestion template key.
 * Checks English first, then Hebrew.
 */
export function matchListNameToTemplate(listName: string): string | null {
  const enMatch = matchListNameToTemplateEn(listName);
  if (enMatch) return enMatch;
  return matchListNameToTemplateHe(listName);
}

/**
 * Returns suggestion templates to show as options.
 * Uses Hebrew templates when language is Hebrew, English otherwise.
 */
export function getSuggestedTemplates(listName: string): SuggestionTemplate[] {
  if (i18n.language === 'he') {
    return getSuggestedTemplatesHe(listName);
  }
  return getSuggestedTemplatesEn(listName);
}

/**
 * Filters master list items by context.
 * Uses Hebrew matching when language is Hebrew, English otherwise.
 */
export function filterMasterItemsByContext(
  listName: string,
  masterItems: MasterListItem[]
): MasterListItem[] {
  if (i18n.language === 'he') {
    // Try Hebrew first; if no match, fall back to English matching
    const heMatch = matchListNameToTemplateHe(listName);
    if (heMatch) {
      return filterMasterItemsByContextHe(listName, masterItems);
    }
  }
  return filterMasterItemsByContextEn(listName, masterItems);
}

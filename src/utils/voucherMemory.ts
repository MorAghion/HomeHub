/**
 * Voucher Memory Management
 *
 * Handles localStorage persistence for voucher sub-hubs using hierarchical IDs.
 * Follows the same pattern as shopping and task memory management.
 */

import type { VoucherItem, VoucherListInstance } from '../types/base';

/**
 * Generate a hierarchical ID for voucher sub-hubs
 * Format: vouchers_[template] (e.g., "vouchers_buyme", "vouchers_movies")
 */
export function generateVoucherSubHubId(templateName: string): string {
  return `vouchers_${templateName.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Load all voucher lists from localStorage
 */
export function loadVoucherLists(): Record<string, VoucherListInstance> {
  const saved = localStorage.getItem('homehub-voucher-lists');
  if (saved) {
    return JSON.parse(saved);
  }
  return {};
}

/**
 * Save all voucher lists to localStorage
 */
export function saveVoucherLists(lists: Record<string, VoucherListInstance>): void {
  localStorage.setItem('homehub-voucher-lists', JSON.stringify(lists));
}

/**
 * Create a new voucher sub-hub
 */
export function createVoucherSubHub(
  templateName: string,
  displayName?: string,
  defaultType?: 'voucher' | 'reservation'
): VoucherListInstance {
  const id = generateVoucherSubHubId(templateName);

  // Find template to get default type if not provided
  const template = VOUCHER_TEMPLATES.find(t => t.id === templateName);
  const type = defaultType ?? template?.defaultType;

  return {
    id,
    name: displayName || templateName,
    defaultType: type,
    items: []
  };
}

/**
 * Get vouchers from a specific sub-hub
 */
export function getVouchersFromSubHub(subHubId: string): VoucherItem[] {
  const lists = loadVoucherLists();
  return lists[subHubId]?.items || [];
}

/**
 * Save vouchers to a specific sub-hub
 */
export function saveVouchersToSubHub(subHubId: string, vouchers: VoucherItem[]): void {
  const lists = loadVoucherLists();
  if (lists[subHubId]) {
    lists[subHubId].items = vouchers;
    saveVoucherLists(lists);
  }
}

/**
 * Generate a unique voucher ID
 */
export function generateVoucherId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Voucher template definitions with default item types
 */
export const VOUCHER_TEMPLATES = [
  {
    id: 'buyme',
    name: 'BuyMe',
    description: 'Gift cards from BuyMe platform',
    icon: '🎁',
    defaultType: 'voucher' as const
  },
  {
    id: 'ontopo',
    name: 'Ontopo',
    description: 'Restaurant reservations',
    icon: '🍽️',
    defaultType: 'reservation' as const
  },
  {
    id: 'movies',
    name: 'Movies & Shows',
    description: 'Cinema tickets and show passes',
    icon: '🎬',
    defaultType: 'reservation' as const
  },
  {
    id: 'shopping',
    name: 'Shopping Vouchers',
    description: 'Retail and grocery vouchers',
    icon: '🛍️',
    defaultType: 'voucher' as const
  },
  {
    id: 'digital',
    name: 'Digital Cards',
    description: 'Digital barcodes and codes',
    icon: '💳',
    defaultType: 'voucher' as const
  },
  {
    id: 'physical',
    name: 'Physical Cards',
    description: 'Photographed physical cards',
    icon: '📸',
    defaultType: undefined  // User choice
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own category',
    icon: '✨',
    defaultType: undefined  // User choice
  }
] as const;

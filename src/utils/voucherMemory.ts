/**
 * Voucher template definitions with default item types.
 * Used by VouchersHub and VoucherList to determine UI behaviour per sub-hub.
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
    defaultType: undefined
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create your own category',
    icon: '✨',
    defaultType: undefined
  }
] as const;

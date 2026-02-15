/**
 * Base Item Interface
 *
 * Foundation interface for all items in the HomeHub system.
 * Provides common properties that all item types should have.
 */
export interface BaseItem {
  id: number;
  name: string;
}

/**
 * Shopping Item
 *
 * Represents an item in a shopping list with completion tracking.
 * Note: Uses 'text' instead of 'name' for backward compatibility.
 */
export interface ShoppingItem extends Omit<BaseItem, 'name'> {
  text: string;  // Equivalent to BaseItem's 'name' - kept for backward compatibility
  completed: boolean;
  category?: string;
}

/**
 * Master List Item
 *
 * Represents a reusable item template in the master list.
 * Note: Uses 'text' instead of 'name' for backward compatibility.
 */
export interface MasterListItem extends Omit<BaseItem, 'name'> {
  text: string;  // Equivalent to BaseItem's 'name' - kept for backward compatibility
  category?: string;
}

/**
 * Task Item
 *
 * Represents a task with scheduling and priority information.
 * Follows the standard BaseItem structure with 'name' property.
 */
export interface Task extends BaseItem {
  dueDate?: string | Date;
  status?: string;
  assignee?: string;
  urgency?: 'Low' | 'Medium' | 'High';
}

/**
 * Duplicate Check
 *
 * Used for handling duplicate item detection in lists.
 */
export interface DuplicateCheck {
  name: string;
  onConfirm: () => void;
}

/**
 * Base Voucher Item (Common Fields)
 *
 * Foundation for both Voucher and Reservation types.
 */
export interface BaseVoucherItem extends BaseItem {
  itemType: 'voucher' | 'reservation';  // Discriminator field
  imageUrl?: string;     // URL or base64 for physical card photos
  notes?: string;        // Additional notes or description
}

/**
 * Voucher Item
 *
 * Represents a voucher or gift card with value and expiry tracking.
 */
export interface Voucher extends BaseVoucherItem {
  itemType: 'voucher';
  value?: string;        // Monetary amount or description (e.g., "₪200", "Double Movie Ticket")
  issuer?: string;       // Entity that provided the voucher (e.g., "BuyMe", "Azrieli")
  expiryDate?: string;   // Expiration date for countdown/alerts
  code?: string;         // Digital code or barcode
}

/**
 * Reservation Item
 *
 * Represents a reservation or event ticket with date/time and location.
 */
export interface Reservation extends BaseVoucherItem {
  itemType: 'reservation';
  eventDate?: string;    // Date of the event/reservation
  time?: string;         // Time of the event/reservation
  address?: string;      // Location/venue address
  code?: string;         // Confirmation code or ticket number
}

/**
 * Union type for all voucher-like items
 */
export type VoucherItem = Voucher | Reservation;

/**
 * List Instance
 *
 * Represents a collection of items (shopping list, task list, etc.)
 */
export interface ListInstance {
  id: string;
  name: string;
  items: ShoppingItem[];  // Can be extended to support Task[] in the future
}

/**
 * Voucher List Instance
 *
 * Represents a collection of vouchers and/or reservations
 */
export interface VoucherListInstance {
  id: string;
  name: string;
  defaultType?: 'voucher' | 'reservation';  // Default item type for this list
  items: VoucherItem[];
}

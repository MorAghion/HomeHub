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
 * List Instance
 *
 * Represents a collection of items (shopping list, task list, etc.)
 */
export interface ListInstance {
  id: string;
  name: string;
  items: ShoppingItem[];  // Can be extended to support Task[] in the future
}

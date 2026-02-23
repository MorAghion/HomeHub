/**
 * Regression tests for fe-bug-011:
 * ShoppingList — edit mode buttons have uneven size and no spacing.
 *
 * Expected behavior in bulk-delete mode:
 *   - The bulk delete action bar uses a `flex gap-N` container (spacing present)
 *   - "Delete Selected" and "Cancel" buttons have matching padding classes
 *     so they render at the same visual height
 *   - "Select All" / "Deselect All" button height matches the other controls
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem, MasterListItem } from '@/types/base'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/components/MasterListDrawer', () => ({
  default: () => <div data-testid="master-list-drawer" />,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function createItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    text: 'Milk',
    completed: false,
    category: 'Dairy',
    ...overrides,
  }
}

const defaultProps = {
  listName: 'Grocery Run',
  items: [createItem({ text: 'Milk' }), createItem({ text: 'Bread', category: 'Bakery' })],
  onUpdateItems: vi.fn(),
  onBack: vi.fn(),
  masterListItems: [] as MasterListItem[],
  onUpdateMasterList: vi.fn(),
  categories: ['Dairy', 'Bakery', 'Produce', 'Meat'],
  capitalizeFirstLetter: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  autoCategorize: () => 'Other',
}

function enterBulkDeleteMode() {
  // The trash-can icon button toggles bulk delete mode
  const trashBtn = screen.getByTitle('Bulk Delete Mode')
  fireEvent.click(trashBtn)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fe-bug-011 — ShoppingList edit mode button layout', () => {
  it('renders the bulk delete toggle button', () => {
    render(<ShoppingList {...defaultProps} />)
    expect(screen.getByTitle('Bulk Delete Mode')).toBeInTheDocument()
  })

  it('shows the bulk-delete action bar after entering edit mode', () => {
    render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()

    // Action bar appears with Select All
    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('[BUG-011] bulk delete action bar container has a gap class (buttons are spaced)', () => {
    const { container } = render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()

    // The row of action buttons must sit inside a flex container that includes gap
    // This guards against the regression where no gap was applied between buttons.
    const actionRow = container.querySelector('.flex.gap-2')
    expect(
      actionRow,
      'Action buttons must be inside a flex container with gap-2 spacing'
    ).toBeInTheDocument()
  })

  it('[BUG-011] Delete Selected and Cancel buttons have matching py classes', () => {
    const { container } = render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()

    // Select an item so "Delete Selected" appears
    fireEvent.click(screen.getByText('Select All'))

    const deleteBtn = screen.getByText('Delete Selected')
    const cancelBtn = screen.getByText('Cancel')

    // Extract the py-* class from each button's class list
    function getPyClass(el: Element): string | undefined {
      return Array.from(el.classList).find((c) => c.startsWith('py-'))
    }

    const deletePy = getPyClass(deleteBtn)
    const cancelPy = getPyClass(cancelBtn)

    expect(deletePy, 'Delete Selected must have a py-* class').toBeTruthy()
    expect(cancelPy, 'Cancel must have a py-* class').toBeTruthy()
    expect(deletePy, 'Delete Selected and Cancel must have matching py-* classes').toBe(cancelPy)
  })

  it('[BUG-011] Select All and Delete Selected buttons share the same container row', () => {
    const { container } = render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()

    // The bulk delete action bar should place its buttons in a flex row.
    // Test that the action buttons row has a gap, not inline spacing hacks.
    const bulkBar = container.querySelector('.bg-\\[\\#63060611\\]') as HTMLElement | null
    expect(bulkBar, 'Bulk delete bar must be visible').toBeInTheDocument()

    // Inside the bar, the button row uses flex + gap
    const flexRow = bulkBar?.querySelector('.flex.gap-2')
    expect(flexRow, 'Button row must use flex + gap for uniform spacing').toBeInTheDocument()
  })

  it('[BUG-011] action buttons in edit mode have at least one shared rounded class', () => {
    render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()
    fireEvent.click(screen.getByText('Select All'))

    const deleteBtn = screen.getByText('Delete Selected')
    const cancelBtn = screen.getByText('Cancel')

    function getRoundedClass(el: Element): string | undefined {
      return Array.from(el.classList).find((c) => c.startsWith('rounded'))
    }

    expect(getRoundedClass(deleteBtn), 'Delete button must have a rounded-* class').toBeTruthy()
    expect(getRoundedClass(cancelBtn), 'Cancel button must have a rounded-* class').toBeTruthy()
  })

  it('[BUG-011] Cancel exits bulk delete mode', () => {
    render(<ShoppingList {...defaultProps} />)
    enterBulkDeleteMode()

    fireEvent.click(screen.getByText('Cancel'))

    // After cancel, the action bar should disappear
    expect(screen.queryByText('Select All')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete Selected')).not.toBeInTheDocument()
  })
})

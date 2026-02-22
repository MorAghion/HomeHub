import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem } from '@/types/base'

// ShoppingList renders MasterListDrawer which imports contextResolver
vi.mock('@/utils/contextResolver', () => ({
  getSuggestedContexts: vi.fn(() => []),
  getContextItems: vi.fn(() => []),
  detectContext: vi.fn(() => null),
  getContextLabel: vi.fn(() => ''),
  getHubIcon: vi.fn(),
  getIconByContext: vi.fn(),
  matchListNameToTemplate: vi.fn(() => null),
  getSuggestedTemplates: vi.fn(() => []),
  filterMasterItemsByContext: vi.fn(() => []),
  SUGGESTION_TEMPLATES: {},
  CATEGORY_FILTERS: {},
  SUGGESTION_TEMPLATES_HE: {},
}))

const defaultProps = {
  listName: 'Weekly Shop',
  items: [] as ShoppingItem[],
  onUpdateItems: vi.fn(),
  onBack: vi.fn(),
  masterListItems: [],
  onUpdateMasterList: vi.fn(),
  categories: ['Dairy', 'Pantry', 'Other'],
  capitalizeFirstLetter: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  autoCategorize: vi.fn(() => 'Dairy'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ActiveList — item display', () => {
  it('renders list name as heading', () => {
    render(<ShoppingList {...defaultProps} />)
    expect(screen.getByText('Weekly Shop')).toBeInTheDocument()
  })

  it('renders existing items', () => {
    const items: ShoppingItem[] = [
      { id: '1', text: 'Milk', completed: false, category: 'Dairy' },
      { id: '2', text: 'Bread', completed: false, category: 'Pantry' },
    ]
    render(<ShoppingList {...defaultProps} items={items} />)
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('shows empty state message when no items', () => {
    render(<ShoppingList {...defaultProps} />)
    expect(screen.getByText(/Your shopping list is empty/i)).toBeInTheDocument()
  })
})

describe('ActiveList — add item', () => {
  it('adds an item by typing and submitting', () => {
    render(<ShoppingList {...defaultProps} />)
    const input = screen.getByPlaceholderText(/add/i)
    fireEvent.change(input, { target: { value: 'eggs' } })
    fireEvent.submit(input.closest('form')!)
    expect(defaultProps.onUpdateItems).toHaveBeenCalledOnce()
    const [updatedItems] = defaultProps.onUpdateItems.mock.calls[0]
    expect(updatedItems[0].text).toBe('Eggs') // capitalised
    expect(updatedItems[0].completed).toBe(false)
  })

  it('does not add empty items', () => {
    render(<ShoppingList {...defaultProps} />)
    const input = screen.getByPlaceholderText(/add/i)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.submit(input.closest('form')!)
    expect(defaultProps.onUpdateItems).not.toHaveBeenCalled()
  })

  it('shows duplicate confirmation when item already exists', () => {
    const items: ShoppingItem[] = [{ id: '1', text: 'Milk', completed: false }]
    render(<ShoppingList {...defaultProps} items={items} />)
    const input = screen.getByPlaceholderText(/add/i)
    fireEvent.change(input, { target: { value: 'milk' } })
    fireEvent.submit(input.closest('form')!)
    // Duplicate modal shown
    expect(screen.getByText('Item Already Exists')).toBeInTheDocument()
    expect(defaultProps.onUpdateItems).not.toHaveBeenCalled()
  })
})

describe('ActiveList — toggle completion', () => {
  it('clicking item text toggles completed state', () => {
    const items: ShoppingItem[] = [
      { id: '1', text: 'Milk', completed: false, category: 'Dairy' },
    ]
    render(<ShoppingList {...defaultProps} items={items} />)
    // Clicking the item text span triggers toggleItem
    fireEvent.click(screen.getByText('Milk'))
    const [updated] = defaultProps.onUpdateItems.mock.calls[0]
    expect(updated[0].completed).toBe(true)
  })
})

describe('ActiveList — sort order (active on top, completed at bottom)', () => {
  it('uncompleted items appear before completed items within each category', () => {
    const items: ShoppingItem[] = [
      { id: '1', text: 'Milk', completed: true, category: 'Dairy' },
      { id: '2', text: 'Yogurt', completed: false, category: 'Dairy' },
    ]
    render(<ShoppingList {...defaultProps} items={items} />)
    const itemEls = screen.getAllByText(/Milk|Yogurt/)
    // Yogurt (active) should come before Milk (completed) in the DOM
    const yogurtIdx = itemEls.findIndex(el => el.textContent === 'Yogurt')
    const milkIdx = itemEls.findIndex(el => el.textContent === 'Milk')
    expect(yogurtIdx).toBeLessThan(milkIdx)
  })
})

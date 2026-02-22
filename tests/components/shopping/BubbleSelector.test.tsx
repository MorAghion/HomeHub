import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MasterListDrawer from '@/components/MasterListDrawer'
import type { MasterListItem } from '@/types/base'

// Mock contextResolver to avoid i18n / Hebrew file dependencies
vi.mock('@/utils/contextResolver', () => ({
  getSuggestedContexts: vi.fn(),
  getContextItems: vi.fn(),
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

import { getSuggestedContexts, getContextItems } from '@/utils/contextResolver'

const mockGetSuggestedContexts = vi.mocked(getSuggestedContexts)
const mockGetContextItems = vi.mocked(getContextItems)

const CAMPING_CONTEXT = {
  contextKey: 'camping',
  displayLabel: 'Camping Supplies',
  itemCount: 20,
}

const CAMPING_ITEMS = [
  { name: 'Tent', listCategory: 'Camping' },
  { name: 'Sleeping Bag', listCategory: 'Camping' },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  masterListItems: [] as MasterListItem[],
  onAddToActiveList: vi.fn(),
  onAddToMasterList: vi.fn(),
  onUpdateMasterList: vi.fn(),
  onUpdateMasterItem: vi.fn(),
  onDeleteMasterItem: vi.fn(),
  onAddAllFromMasterList: vi.fn(),
  categories: ['Camping', 'Other'],
  capitalizeFirstLetter: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  autoCategorize: vi.fn(() => 'Other'),
  currentListName: 'Camping Trip',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BubbleSelector — empty master list (Quick Setup state)', () => {
  beforeEach(() => {
    mockGetSuggestedContexts.mockReturnValue([CAMPING_CONTEXT])
    mockGetContextItems.mockReturnValue(CAMPING_ITEMS)
  })

  it('renders Quick Setup header when master list is empty', () => {
    render(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Quick Setup')).toBeInTheDocument()
  })

  it('renders suggestion bubble with context displayLabel', () => {
    render(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Camping Supplies')).toBeInTheDocument()
  })

  it('renders Keep Empty button', () => {
    render(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Keep Empty')).toBeInTheDocument()
  })

  it('clicking a context bubble calls onUpdateMasterList with context items', () => {
    render(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Camping Supplies'))
    expect(defaultProps.onUpdateMasterList).toHaveBeenCalledOnce()
    const updatedList: MasterListItem[] = defaultProps.onUpdateMasterList.mock.calls[0][0]
    const names = updatedList.map((i: MasterListItem) => i.text)
    expect(names).toContain('Tent')
    expect(names).toContain('Sleeping Bag')
  })

  it('clicking Keep Empty switches to edit mode (shows add input)', () => {
    render(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Keep Empty'))
    expect(screen.getByPlaceholderText('Add to master list...')).toBeInTheDocument()
  })

  it('renders multiple bubbles when multiple contexts match', () => {
    mockGetSuggestedContexts.mockReturnValue([
      CAMPING_CONTEXT,
      { contextKey: 'stock', displayLabel: 'Stock Supplies', itemCount: 15 },
    ])
    render(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Camping Supplies')).toBeInTheDocument()
    expect(screen.getByText('Stock Supplies')).toBeInTheDocument()
  })

  it('shows no bubbles when no contexts match', () => {
    mockGetSuggestedContexts.mockReturnValue([])
    render(<MasterListDrawer {...defaultProps} />)
    // Quick Setup header still renders, but no bubble buttons
    expect(screen.queryByTitle(/Add \d+ items/)).not.toBeInTheDocument()
  })
})

describe('BubbleSelector — with items (Quick Add Templates section)', () => {
  const existingItems: MasterListItem[] = [
    { id: '1', text: 'Tent', category: 'Camping' },
  ]

  beforeEach(() => {
    mockGetSuggestedContexts.mockReturnValue([CAMPING_CONTEXT])
    mockGetContextItems.mockReturnValue(CAMPING_ITEMS)
  })

  it('shows Quick Add from Templates section when items exist', () => {
    render(<MasterListDrawer {...defaultProps} masterListItems={existingItems} />)
    expect(screen.getByText('Quick Add from Templates')).toBeInTheDocument()
  })

  it('renders context bubble in the templates section', () => {
    render(<MasterListDrawer {...defaultProps} masterListItems={existingItems} />)
    // The label appears in the templates section
    expect(screen.getAllByText('Camping Supplies').length).toBeGreaterThanOrEqual(1)
  })
})

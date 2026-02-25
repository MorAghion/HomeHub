import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithI18n } from '../../helpers/renderWithI18n'
import MasterListDrawer from '@/components/MasterListDrawer'
import type { MasterListItem } from '@/types/base'

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

const ITEMS: MasterListItem[] = [
  { id: '1', text: 'Bread', category: 'Pantry' },
  { id: '2', text: 'Milk', category: 'Dairy' },
  { id: '3', text: 'Eggs', category: 'Dairy' },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  masterListItems: ITEMS,
  onAddToActiveList: vi.fn(),
  onAddToMasterList: vi.fn(),
  onUpdateMasterList: vi.fn(),
  onUpdateMasterItem: vi.fn(),
  onDeleteMasterItem: vi.fn(),
  onAddAllFromMasterList: vi.fn(),
  categories: ['Pantry', 'Dairy', 'Other'],
  capitalizeFirstLetter: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  autoCategorize: vi.fn(() => 'Other'),
  currentListName: 'Weekly Shop',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MasterList — item display', () => {
  it('renders Master List heading', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Master List')).toBeInTheDocument()
  })

  it('renders all master list items', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Eggs')).toBeInTheDocument()
  })

  it('groups items under their category headings', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByText('Pantry')).toBeInTheDocument()
    expect(screen.getByText('Dairy')).toBeInTheDocument()
  })

  it('clicking an item calls onAddToActiveList with that item', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Bread'))
    expect(defaultProps.onAddToActiveList).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Bread' })
    )
  })

  it('Select All button calls onAddAllFromMasterList', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Select All'))
    expect(defaultProps.onAddAllFromMasterList).toHaveBeenCalledOnce()
  })
})

describe('MasterList — edit mode', () => {
  it('clicking Edit toggles to edit mode', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Edit'))
    expect(screen.getByPlaceholderText('Add to master list...')).toBeInTheDocument()
  })

  it('submitting add form calls onAddToMasterList', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    fireEvent.click(screen.getByText('Edit'))
    const input = screen.getByPlaceholderText('Add to master list...')
    fireEvent.change(input, { target: { value: 'Cheese' } })
    fireEvent.submit(input.closest('form')!)
    expect(defaultProps.onAddToMasterList).toHaveBeenCalledWith('Cheese', expect.any(String))
  })
})

describe('MasterList — search', () => {
  it('renders search input when items exist', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument()
  })

  it('filters items by search query', () => {
    renderWithI18n(<MasterListDrawer {...defaultProps} />)
    const search = screen.getByPlaceholderText('Search items...')
    fireEvent.change(search, { target: { value: 'Bread' } })
    expect(screen.getByText('Bread')).toBeInTheDocument()
    expect(screen.queryByText('Milk')).not.toBeInTheDocument()
  })
})

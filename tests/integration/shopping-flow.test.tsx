import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import ShoppingList from '@/components/ShoppingList'
import type { ShoppingItem, MasterListItem } from '@/types/base'

vi.mock('react-i18next', async () => {
  const { default: i18n } = await import('@/i18n/config')
  return {
    useTranslation: (ns?: string | string[]) => ({
      t: (key: string, opts?: Record<string, unknown>) => {
        const defaultNs = Array.isArray(ns) ? ns[0] : (ns ?? 'common')
        return i18n.t(key, { ns: defaultNs, ...(opts ?? {}) } as never) as string
      },
      i18n,
    }),
    initReactI18next: { type: '3rdParty', init: () => {} },
  }
})

// Mock contextResolver (used by MasterListDrawer child)
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

// Stateful wrapper to simulate real app state
function ShoppingListWrapper({
  initialItems = [],
  initialMasterItems = [],
}: {
  initialItems?: ShoppingItem[]
  initialMasterItems?: MasterListItem[]
}) {
  const [items, setItems] = useState<ShoppingItem[]>(initialItems)
  const [masterItems, setMasterItems] = useState<MasterListItem[]>(initialMasterItems)

  const autoCategorize = (name: string) => {
    if (/milk|cheese|yogurt|butter/i.test(name)) return 'Dairy'
    if (/bread|rice|pasta/i.test(name)) return 'Pantry'
    return 'Other'
  }

  return (
    <ShoppingList
      listName="Test List"
      items={items}
      onUpdateItems={setItems}
      onBack={vi.fn()}
      masterListItems={masterItems}
      onUpdateMasterList={setMasterItems}
      categories={['Dairy', 'Pantry', 'Other']}
      capitalizeFirstLetter={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
      autoCategorize={autoCategorize}
    />
  )
}

function addItem(inputPlaceholder: RegExp, value: string) {
  const input = screen.getByPlaceholderText(inputPlaceholder)
  fireEvent.change(input, { target: { value } })
  fireEvent.submit(input.closest('form')!)
}

describe('Shopping Hub — integration flows', () => {
  it('create item → appears in list', () => {
    render(<ShoppingListWrapper />)
    addItem(/add/i, 'milk')
    expect(screen.getByText('Milk')).toBeInTheDocument()
  })

  it('create two items → both appear', () => {
    render(<ShoppingListWrapper />)
    addItem(/add/i, 'milk')
    addItem(/add/i, 'bread')
    expect(screen.getByText('Milk')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('create item → click to toggle complete → shows strikethrough style', () => {
    render(<ShoppingListWrapper />)
    addItem(/add/i, 'eggs')
    // Click the item text to toggle it
    fireEvent.click(screen.getByText('Eggs'))
    // Completed item gets line-through class
    expect(screen.getByText('Eggs').className).toContain('line-through')
  })

  it('duplicate item → shows confirmation modal → confirm adds it', () => {
    render(<ShoppingListWrapper initialItems={[{ id: '1', text: 'Milk', completed: false }]} />)
    addItem(/add/i, 'milk')
    expect(screen.getByText('Item Already Exists')).toBeInTheDocument()
    // Confirm adds the duplicate
    fireEvent.click(screen.getByText('Yes'))
    expect(screen.getAllByText('Milk').length).toBeGreaterThanOrEqual(2)
  })

  it('duplicate item → shows confirmation modal → cancel does not add it', () => {
    render(<ShoppingListWrapper initialItems={[{ id: '1', text: 'Milk', completed: false }]} />)
    addItem(/add/i, 'milk')
    fireEvent.click(screen.getByText('No'))
    expect(screen.getAllByText('Milk')).toHaveLength(1)
  })
})

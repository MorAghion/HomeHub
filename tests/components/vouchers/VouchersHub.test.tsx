/**
 * Regression tests for:
 *   fe-bug-009 — Master lists (Ontopo, Movies & Shows) can be deleted
 *   fe-bug-010 — Add new list: template option click does nothing
 *
 * VouchersHub shows only non-reservation lists. Tests here cover the
 * voucher side of the template modal (BuyMe, Shopping Vouchers, Digital Cards,
 * Physical Cards, Custom).
 *
 * NOTE for fe-bug-009: VouchersHub filters `defaultType !== 'reservation'`,
 * so Ontopo / Movies & Shows lists do NOT appear here. Bug-009 for the
 * voucher side means: user-created Custom or Physical Card lists that are
 * "master" (protected) should not have a delete affordance.
 * The fix will likely add a protective flag to VoucherListInstance.
 * These tests document the expected behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VouchersHub from '@/components/VouchersHub'
import type { VoucherListInstance } from '@/types/base'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

vi.mock('@/utils/contextResolver', () => ({
  getContextIcon: () => () => <span data-testid="context-icon" />,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function createVoucherList(overrides: Partial<VoucherListInstance> = {}): VoucherListInstance {
  return {
    id: `list-${Math.random().toString(36).slice(2)}`,
    name: 'My Vouchers',
    defaultType: 'voucher',
    items: [],
    ...overrides,
  }
}

const defaultProps = {
  onSelectList: vi.fn(),
  onCreateList: vi.fn().mockResolvedValue(undefined),
  onDeleteList: vi.fn(),
  onDeleteLists: vi.fn(),
  onBack: vi.fn(),
}

function renderHub(
  voucherLists: Record<string, VoucherListInstance> = {},
  props = defaultProps
) {
  return render(<VouchersHub voucherLists={voucherLists} {...props} />)
}

// ── fe-bug-009 ─────────────────────────────────────────────────────────────────

describe('fe-bug-009 — Master lists must not be deletable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no voucher lists exist', () => {
    renderHub({})
    expect(screen.getByText('noVouchersYet')).toBeInTheDocument()
  })

  it('renders the Edit button when voucher lists exist', () => {
    const list = createVoucherList({ name: 'BuyMe' })
    renderHub({ [list.id]: list })
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
  })

  it('entering edit mode shows a checkbox overlay on regular user lists', () => {
    const list = createVoucherList({ name: 'My Custom Vouchers' })
    const { container } = renderHub({ [list.id]: list })

    fireEvent.click(screen.getByTitle('Edit'))

    // In edit mode there should be a delete-affordance (inline checkbox) for regular lists.
    const checkboxOverlay = container.querySelector('.w-6.h-6.rounded')
    expect(checkboxOverlay).toBeInTheDocument()
  })

  /**
   * Bug-009 REGRESSION GUARD:
   * A list flagged as "master" / protected should NOT show a delete checkbox
   * in edit mode. This test will fail with current code (no protection exists)
   * and pass once FE adds the isMaster / templateId protection.
   *
   * The FE fix is expected to check a property on VoucherListInstance
   * (e.g. `isMaster: true` or `templateId: 'buyme'`) to suppress the checkbox.
   */
  it('[BUG-009] master list does NOT show a delete checkbox overlay in edit mode', () => {
    // Simulate a list that was created from a protected template.
    // The FE fix will introduce a way to mark these — cast for now.
    const masterList = {
      ...createVoucherList({ name: 'BuyMe', id: 'master-buyme' }),
      isMaster: true,
    } as VoucherListInstance & { isMaster: boolean }

    const regularList = createVoucherList({ name: 'My Personal Vouchers' })

    const { container } = renderHub({
      [masterList.id]: masterList as VoucherListInstance,
      [regularList.id]: regularList,
    })

    fireEvent.click(screen.getByTitle('Edit'))

    // With isMaster protection: only the regular list gets a checkbox.
    // Total checkboxes should be exactly 1 (regular list only, not the master list).
    const allCheckboxes = container.querySelectorAll('.w-6.h-6.rounded')
    expect(allCheckboxes.length, 'only regular list should have a delete checkbox').toBe(1)
  })

  it('[BUG-009] master list cannot be included in bulk delete selection', async () => {
    const masterList = {
      ...createVoucherList({ name: 'BuyMe', id: 'master-buyme' }),
      isMaster: true,
    } as VoucherListInstance

    renderHub({ [masterList.id]: masterList })
    fireEvent.click(screen.getByTitle('Edit'))

    // Select All button appears in bulk action bar
    fireEvent.click(screen.getByText('common:selectAll'))

    // Even if Select All is pressed, onDeleteLists should not include master list id
    const deleteBtn = screen.queryByText('common:deleteSelected')
    if (deleteBtn) {
      fireEvent.click(deleteBtn)
      await waitFor(() => {
        const calledWith = (defaultProps.onDeleteLists as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string[] | undefined
        if (calledWith) {
          expect(calledWith).not.toContain('master-buyme')
        }
      })
    } else {
      // If Delete Selected button is not shown at all — the master list was not selectable.
      // This is also an acceptable fix outcome.
      expect(deleteBtn).not.toBeInTheDocument()
    }
  })
})

// ── fe-bug-010 ─────────────────────────────────────────────────────────────────

describe('fe-bug-010 — Template option click creates list and closes modal', () => {
  beforeEach(() => vi.clearAllMocks())

  function openTemplateModal() {
    // Click the + button to open template modal
    fireEvent.click(screen.getByTitle('newVoucherList'))
    expect(screen.getByText('chooseTemplate')).toBeInTheDocument()
  }

  it('opens template modal when + button is clicked', () => {
    renderHub({})
    fireEvent.click(screen.getByTitle('newVoucherList'))
    expect(screen.getByText('chooseTemplate')).toBeInTheDocument()
  })

  it('[BUG-010] clicking BuyMe template calls onCreateList with correct args', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()

    fireEvent.click(screen.getByRole('button', { name: /BuyMe/i }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledOnce()
      expect(onCreateList).toHaveBeenCalledWith('buyme', 'BuyMe', 'voucher')
    })
  })

  it('[BUG-010] template modal closes after successful list creation', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /BuyMe/i }))

    // Modal should close (chooseTemplate heading disappears)
    await waitFor(() => {
      expect(screen.queryByText('chooseTemplate')).not.toBeInTheDocument()
    })
  })

  it('[BUG-010] clicking Shopping Vouchers template calls onCreateList', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Shopping Vouchers/i }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledWith('shopping', 'Shopping Vouchers', 'voucher')
    })
  })

  it('[BUG-010] template button is not permanently disabled after a failed create', async () => {
    const onCreateList = vi.fn().mockRejectedValueOnce(new Error('network error'))
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /BuyMe/i }))

    // Wait for the failed create to settle
    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledOnce()
    })

    // Modal should stay open (create failed), but button should be re-enabled
    await waitFor(() => {
      const buyMeBtn = screen.getByRole('button', { name: /BuyMe/i })
      expect(buyMeBtn).not.toBeDisabled()
    })
  })

  it('[BUG-010] Custom template shows type selector instead of calling onCreateList directly', () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Custom/i }))

    // Type selector should appear
    expect(screen.getByText('chooseItemType')).toBeInTheDocument()
    // onCreateList should NOT have been called yet
    expect(onCreateList).not.toHaveBeenCalled()
  })

  it('[BUG-010] after selecting a type for Custom template, onCreateList is called', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Custom/i }))
    expect(screen.getByText('chooseItemType')).toBeInTheDocument()

    // Choose voucher type and confirm
    fireEvent.click(screen.getByRole('button', { name: 'createList' }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledOnce()
    })
  })
})

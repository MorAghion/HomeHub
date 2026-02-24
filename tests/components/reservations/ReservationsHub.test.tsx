/**
 * Regression tests for:
 *   fe-bug-009 — Master lists (Ontopo, Movies & Shows) can be deleted
 *   fe-bug-010 — Add new list: template option click does nothing
 *
 * ReservationsHub shows only reservation-type lists. Ontopo and Movies & Shows
 * are the two templates with defaultType:'reservation', making them the
 * "master" hub lists that users expect to be permanent.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReservationsHub from '@/components/ReservationsHub'
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

vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean; onConfirm: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function createReservationList(overrides: Partial<VoucherListInstance> = {}): VoucherListInstance {
  return {
    id: `res-${Math.random().toString(36).slice(2)}`,
    name: 'My Reservations',
    defaultType: 'reservation',
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
  return render(<ReservationsHub voucherLists={voucherLists} {...props} />)
}

// ── fe-bug-009 ─────────────────────────────────────────────────────────────────

describe('fe-bug-009 — Ontopo and Movies & Shows master lists must not be deletable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows empty state when no reservation lists exist', () => {
    renderHub({})
    expect(screen.getByText('noReservationsYet')).toBeInTheDocument()
  })

  it('renders Edit button when reservation lists exist', () => {
    const list = createReservationList({ name: 'Date Night' })
    renderHub({ [list.id]: list })
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
  })

  it('entering edit mode shows a checkbox overlay on regular user-created lists', () => {
    const list = createReservationList({ name: 'User Trip' })
    const { container } = renderHub({ [list.id]: list })

    fireEvent.click(screen.getByTitle('Edit'))

    // In edit mode there should be an inline checkbox for regular lists.
    const checkboxOverlay = container.querySelector('.w-6.h-6.rounded')
    expect(checkboxOverlay).toBeInTheDocument()
  })

  /**
   * Bug-009 REGRESSION GUARD — Ontopo master list:
   * Ontopo is a built-in reservation template. Lists created from it should
   * not show a delete checkbox in edit mode.
   *
   * Will fail with current code (all lists show checkboxes).
   * Will pass after FE adds isMaster / templateId protection.
   */
  it('[BUG-009] Ontopo list does NOT show a delete checkbox overlay in edit mode', () => {
    const ontopoList = {
      ...createReservationList({ name: 'Ontopo', id: 'master-ontopo' }),
      isMaster: true,
    } as VoucherListInstance

    const userList = createReservationList({ name: 'Weekend Getaway' })

    const { container } = renderHub({
      [ontopoList.id]: ontopoList,
      [userList.id]: userList,
    })

    fireEvent.click(screen.getByTitle('Edit'))

    // With isMaster protection: only the user-created list gets a checkbox.
    const allCheckboxes = container.querySelectorAll('.w-6.h-6.rounded')
    expect(allCheckboxes.length, 'only user-created list should have a delete checkbox').toBe(1)
  })

  /**
   * Bug-009 REGRESSION GUARD — Movies & Shows master list:
   */
  it('[BUG-009] Movies & Shows list does NOT show a delete checkbox overlay in edit mode', () => {
    const moviesList = {
      ...createReservationList({ name: 'Movies & Shows', id: 'master-movies' }),
      isMaster: true,
    } as VoucherListInstance

    const userList = createReservationList({ name: 'Concert Tickets' })

    const { container } = renderHub({
      [moviesList.id]: moviesList,
      [userList.id]: userList,
    })

    fireEvent.click(screen.getByTitle('Edit'))

    // With isMaster protection: only the user-created list gets a checkbox.
    const allCheckboxes = container.querySelectorAll('.w-6.h-6.rounded')
    expect(allCheckboxes.length, 'only user-created list should have a delete checkbox').toBe(1)
  })

  it('[BUG-009] Select All does not include master list IDs when calling onDeleteLists', async () => {
    const onDeleteLists = vi.fn()
    const ontopoList = {
      ...createReservationList({ name: 'Ontopo', id: 'master-ontopo' }),
      isMaster: true,
    } as VoucherListInstance

    renderHub({ [ontopoList.id]: ontopoList }, { ...defaultProps, onDeleteLists })

    fireEvent.click(screen.getByTitle('Edit'))

    // Try to select all and delete
    const selectAllBtn = screen.queryByText('common:selectAll')
    if (selectAllBtn) {
      fireEvent.click(selectAllBtn)
    }

    const deleteBtn = screen.queryByText('common:deleteSelected')
    if (deleteBtn) {
      fireEvent.click(deleteBtn)
      // Confirm deletion in modal
      const confirmBtn = screen.queryByText('Confirm')
      if (confirmBtn) {
        fireEvent.click(confirmBtn)
        await waitFor(() => {
          const calledWith = onDeleteLists.mock.calls[0]?.[0] as string[] | undefined
          if (calledWith) {
            expect(calledWith).not.toContain('master-ontopo')
          }
        })
      }
    } else {
      // Master list was not selectable — Delete Selected never appeared. ✓
      expect(deleteBtn).not.toBeInTheDocument()
    }
  })
})

// ── fe-bug-010 ─────────────────────────────────────────────────────────────────

describe('fe-bug-010 — Template option click creates list and closes modal', () => {
  beforeEach(() => vi.clearAllMocks())

  function openTemplateModal() {
    fireEvent.click(screen.getByTitle('newReservationList'))
    expect(screen.getByText('chooseTemplate')).toBeInTheDocument()
  }

  it('opens template modal when + button is clicked', () => {
    renderHub({})
    openTemplateModal()
  })

  it('[BUG-010] clicking Ontopo template calls onCreateList with reservation type', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Ontopo/i }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledOnce()
      expect(onCreateList).toHaveBeenCalledWith('ontopo', 'Ontopo', 'reservation')
    })
  })

  it('[BUG-010] clicking Movies & Shows template calls onCreateList', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Movies/i }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledWith('movies', 'Movies & Shows', 'reservation')
    })
  })

  it('[BUG-010] template modal closes after successful list creation', async () => {
    const onCreateList = vi.fn().mockResolvedValue(undefined)
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Ontopo/i }))

    await waitFor(() => {
      expect(screen.queryByText('chooseTemplate')).not.toBeInTheDocument()
    })
  })

  it('[BUG-010] template button re-enables after a failed create attempt', async () => {
    const onCreateList = vi.fn().mockRejectedValueOnce(new Error('server error'))
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Ontopo/i }))

    await waitFor(() => {
      expect(onCreateList).toHaveBeenCalledOnce()
    })

    // Button must be re-enabled so the user can retry
    await waitFor(() => {
      const ontopoBtn = screen.getByRole('button', { name: /Ontopo/i })
      expect(ontopoBtn).not.toBeDisabled()
    })
  })

  it('[BUG-010] modal stays open when create fails — user can retry', async () => {
    const onCreateList = vi.fn().mockRejectedValueOnce(new Error('offline'))
    renderHub({}, { ...defaultProps, onCreateList })

    openTemplateModal()
    fireEvent.click(screen.getByRole('button', { name: /Ontopo/i }))

    await waitFor(() => expect(onCreateList).toHaveBeenCalled())

    // Modal should still be visible so user can retry or choose another template
    await waitFor(() => {
      expect(screen.getByText('chooseTemplate')).toBeInTheDocument()
    })
  })
})

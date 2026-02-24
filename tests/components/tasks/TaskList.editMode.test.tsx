/**
 * Regression tests for fe-bug-011:
 * HomeTasks (TaskList) — edit mode buttons have uneven size and no spacing.
 *
 * Expected behavior in bulk-edit mode:
 *   - Each row of action buttons uses a `flex gap-2` container
 *   - All buttons in a row have matching py-* classes (uniform height)
 *   - "Select All" and "Clear Completed" are on the same row with equal flex-1
 *   - "Check Selected" and "Delete Selected" are on the same row with equal flex-1
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskList from '@/components/TaskList'
import type { Task } from '@/types/base'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean; onConfirm: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel Modal</button>
      </div>
    ) : null,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

let idCounter = 0
function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${++idCounter}`,
    name: 'Do laundry',
    status: 'Not Started',
    urgency: 'Medium',
    dueDate: undefined,
    assignee: undefined,
    ...overrides,
  }
}

const defaultProps = {
  listName: 'Weekly Chores',
  listId: 'list-001',
  isUrgentView: false,
  tasks: [
    createTask({ name: 'Clean bathroom' }),
    createTask({ name: 'Take out trash' }),
  ],
  onUpdateTasks: vi.fn(),
  onBack: vi.fn(),
  onNavigateToSource: vi.fn(),
  onUpdateUrgentTask: vi.fn(),
  masterListTasks: [] as Task[],
  onUpdateMasterList: vi.fn(),
  highlightedTaskId: null,
  onClearHighlight: vi.fn(),
}

function enterBulkEditMode() {
  fireEvent.click(screen.getByTitle('Edit'))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('fe-bug-011 — TaskList edit mode button layout', () => {
  beforeEach(() => {
    idCounter = 0
    vi.clearAllMocks()
  })

  it('renders the Edit (pencil) button when tasks exist', () => {
    render(<TaskList {...defaultProps} />)
    expect(screen.getByTitle('Edit')).toBeInTheDocument()
  })

  it('shows the bulk-edit action bar after clicking Edit', () => {
    render(<TaskList {...defaultProps} />)
    enterBulkEditMode()
    expect(screen.getByText('Select All')).toBeInTheDocument()
  })

  it('[BUG-011] first row of action buttons uses flex + gap-2 (Select All row)', () => {
    const { container } = render(<TaskList {...defaultProps} />)
    enterBulkEditMode()

    // The bulk edit bar: bg-[#63060611] rounded-xl
    const bulkBar = container.querySelector('.bg-\\[\\#63060611\\]') as HTMLElement | null
    expect(bulkBar, 'Bulk edit bar must be visible').toBeInTheDocument()

    // Inside the bar, the first row (Select All + Clear Completed) must use flex gap
    const flexRows = bulkBar?.querySelectorAll('.flex.gap-2')
    expect(
      flexRows?.length,
      'At least one flex gap-2 row must be present in the bulk edit bar'
    ).toBeGreaterThan(0)
  })

  it('[BUG-011] Select All and Clear Completed buttons have matching py classes', () => {
    const tasks = [
      createTask({ name: 'Task A', status: 'Completed' }),
      createTask({ name: 'Task B', status: 'Not Started' }),
    ]

    render(<TaskList {...defaultProps} tasks={tasks} />)
    enterBulkEditMode()

    const selectAllBtn = screen.getByText('Select All')
    const clearCompletedBtn = screen.getByText(/Clear Completed/)

    function getPyClass(el: Element): string | undefined {
      return Array.from(el.classList).find((c) => c.startsWith('py-'))
    }

    const selectAllPy = getPyClass(selectAllBtn)
    const clearPy = getPyClass(clearCompletedBtn)

    expect(selectAllPy, 'Select All must have a py-* class').toBeTruthy()
    expect(clearPy, 'Clear Completed must have a py-* class').toBeTruthy()
    expect(
      selectAllPy,
      'Select All and Clear Completed must have matching py-* classes (uniform height)'
    ).toBe(clearPy)
  })

  it('[BUG-011] Check Selected and Delete Selected buttons have matching py classes', () => {
    render(<TaskList {...defaultProps} />)
    enterBulkEditMode()

    // Select all tasks so row 2 (Check Selected + Delete Selected) appears
    fireEvent.click(screen.getByText('Select All'))

    const checkBtn = screen.getByText(/Check Selected/)
    const deleteBtn = screen.getByText('Delete Selected')

    function getPyClass(el: Element): string | undefined {
      return Array.from(el.classList).find((c) => c.startsWith('py-'))
    }

    const checkPy = getPyClass(checkBtn)
    const deletePy = getPyClass(deleteBtn)

    expect(checkPy, 'Check Selected must have a py-* class').toBeTruthy()
    expect(deletePy, 'Delete Selected must have a py-* class').toBeTruthy()
    expect(
      checkPy,
      'Check Selected and Delete Selected must have matching py-* classes (uniform height)'
    ).toBe(deletePy)
  })

  it('[BUG-011] second action row (Check + Delete) uses flex gap-2', () => {
    const { container } = render(<TaskList {...defaultProps} />)
    enterBulkEditMode()
    fireEvent.click(screen.getByText('Select All'))

    const bulkBar = container.querySelector('.bg-\\[\\#63060611\\]') as HTMLElement | null
    const flexRows = bulkBar?.querySelectorAll('.flex.gap-2')
    // Row 1 (Select All) and Row 2 (Check + Delete) should both use flex gap-2
    expect(
      flexRows?.length,
      'Both action rows must use flex gap-2 for consistent spacing'
    ).toBeGreaterThanOrEqual(2)
  })

  it('[BUG-011] all action buttons use flex-1 so they share width equally', () => {
    const tasks = [
      createTask({ name: 'Task A', status: 'Completed' }),
      createTask({ name: 'Task B' }),
    ]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    enterBulkEditMode()
    fireEvent.click(screen.getByText('Select All'))

    const actionBtns = [
      screen.getByText('Deselect All'),  // After clicking Select All, button shows Deselect All
      screen.getByText(/Clear Completed/),
      screen.getByText(/Check Selected/),
      screen.getByText('Delete Selected'),
    ]

    for (const btn of actionBtns) {
      expect(
        btn.classList.contains('flex-1'),
        `Button "${btn.textContent?.trim()}" must have flex-1 for equal-width layout`
      ).toBe(true)
    }
  })

  it('Edit button toggles to Done (✓) checkmark when in edit mode', () => {
    render(<TaskList {...defaultProps} />)
    enterBulkEditMode()
    expect(screen.getByTitle('Done')).toBeInTheDocument()
  })

  it('exiting edit mode hides the bulk edit action bar', () => {
    render(<TaskList {...defaultProps} />)
    enterBulkEditMode()
    expect(screen.getByText('Select All')).toBeInTheDocument()

    // Click Done to exit edit mode
    fireEvent.click(screen.getByTitle('Done'))
    expect(screen.queryByText('Select All')).not.toBeInTheDocument()
  })
})

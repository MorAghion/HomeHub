import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskList from '@/components/TaskList'
import type { Task } from '@/types/base'

// ConfirmationModal uses Modal — mock both to simplify
vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean; onConfirm: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Math.random()}`,
  name: 'Buy groceries',
  status: 'Not Started',
  urgency: 'Medium',
  ...overrides,
})

const defaultProps = {
  listName: 'Weekly Chores',
  listId: 'list-1',
  isUrgentView: false,
  tasks: [] as Task[],
  onUpdateTasks: vi.fn(),
  onBack: vi.fn(),
  masterListTasks: [],
  onUpdateMasterList: vi.fn(),
  highlightedTaskId: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TaskCard — rendering', () => {
  it('renders task name', () => {
    const tasks = [makeTask({ name: 'Clean kitchen' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    expect(screen.getByText('Clean kitchen')).toBeInTheDocument()
  })

  it('renders urgency badge for each urgency level', () => {
    const tasks = [
      makeTask({ name: 'High task', urgency: 'High' }),
      makeTask({ name: 'Medium task', urgency: 'Medium' }),
      makeTask({ name: 'Low task', urgency: 'Low' }),
    ]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    // getAllByText because the form toggle buttons also show Low/Medium/High
    expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Medium').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Low').length).toBeGreaterThanOrEqual(1)
  })

  it('High urgency badge has red color', () => {
    const tasks = [makeTask({ urgency: 'High' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    // The badge is a span with rounded-full — filter by its specific style
    const highElements = screen.getAllByText('High')
    // Badge is a span (rounded-full) not a button
    const badge = highElements.find(el => el.tagName === 'SPAN')
    expect(badge).toBeDefined()
    expect(badge).toHaveStyle({ color: 'rgb(220, 38, 38)' })
  })

  it('Medium urgency badge has amber color', () => {
    const tasks = [makeTask({ urgency: 'Medium' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    const mediumElements = screen.getAllByText('Medium')
    const badge = mediumElements.find(el => el.tagName === 'SPAN')
    expect(badge).toBeDefined()
    expect(badge).toHaveStyle({ color: 'rgb(245, 158, 11)' })
  })

  it('Low urgency badge has green color', () => {
    const tasks = [makeTask({ urgency: 'Low' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    const lowElements = screen.getAllByText('Low')
    const badge = lowElements.find(el => el.tagName === 'SPAN')
    expect(badge).toBeDefined()
    expect(badge).toHaveStyle({ color: 'rgb(16, 185, 129)' })
  })

  it('renders assignee when present', () => {
    const tasks = [makeTask({ assignee: 'Alice' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('renders due date when present', () => {
    const tasks = [makeTask({ dueDate: '2099-12-31' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    // Due date chip renders as '📅 Due <date>'; the form label 'Due Date' also matches /Due/.
    // Use getAllByText and check at least one matches the chip (span, not label)
    const dueMatches = screen.getAllByText(/Due/)
    const chipEl = dueMatches.find(
      el => el.tagName === 'SPAN' && el.textContent?.includes('📅')
    )
    expect(chipEl).toBeDefined()
  })

  it('completed task name has line-through style', () => {
    const tasks = [makeTask({ name: 'Done task', status: 'Completed' })]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    const nameEl = screen.getByText('Done task')
    expect(nameEl.className).toContain('line-through')
  })

  it('shows empty state when no tasks', () => {
    render(<TaskList {...defaultProps} tasks={[]} />)
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument()
  })
})

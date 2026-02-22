import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskList from '@/components/TaskList'
import type { Task } from '@/types/base'

vi.mock('@/components/ConfirmationModal', () => ({
  default: ({ isOpen, onConfirm, onClose }: { isOpen: boolean; onConfirm: () => void; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

// Urgent tasks have sourceSubHubId + sourceSubHubName set
type UrgentTask = Task & { sourceSubHubId?: string; sourceSubHubName?: string }

const makeUrgentTask = (overrides: Partial<UrgentTask> = {}): UrgentTask => ({
  id: `task-${Math.random()}`,
  name: 'Fix the leak',
  status: 'Not Started',
  urgency: 'High',
  sourceSubHubId: 'sub-hub-1',
  sourceSubHubName: 'Kitchen',
  ...overrides,
})

const defaultProps = {
  listName: 'Urgent Tasks',
  listId: 'urgent',
  isUrgentView: true,
  tasks: [] as UrgentTask[],
  onUpdateTasks: vi.fn(),
  onBack: vi.fn(),
  masterListTasks: [],
  onUpdateMasterList: vi.fn(),
  highlightedTaskId: null,
  onUpdateUrgentTask: vi.fn(),
  onNavigateToSource: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('UrgentTasks — display', () => {
  it('renders the urgent view heading', () => {
    render(<TaskList {...defaultProps} tasks={[makeUrgentTask()]} />)
    expect(screen.getByText('Urgent Tasks')).toBeInTheDocument()
  })

  it('shows "Aggregated from all task lists" subtitle in urgent view', () => {
    render(<TaskList {...defaultProps} tasks={[makeUrgentTask()]} />)
    expect(screen.getByText(/Aggregated from all task lists/i)).toBeInTheDocument()
  })

  it('renders urgent task names', () => {
    const tasks = [
      makeUrgentTask({ name: 'Fix the sink' }),
      makeUrgentTask({ name: 'Pay bills' }),
    ]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    expect(screen.getByText('Fix the sink')).toBeInTheDocument()
    expect(screen.getByText('Pay bills')).toBeInTheDocument()
  })

  it('shows empty state message when no urgent tasks', () => {
    render(<TaskList {...defaultProps} tasks={[]} />)
    expect(screen.getByText(/no urgent tasks/i)).toBeInTheDocument()
  })

  it('shows source sub-hub name as clickable link', () => {
    render(<TaskList {...defaultProps} tasks={[makeUrgentTask({ sourceSubHubName: 'Kitchen' })]} />)
    expect(screen.getByText(/Kitchen/)).toBeInTheDocument()
  })
})

describe('UrgentTasks — interactions', () => {
  it('does NOT show bulk edit button in urgent view', () => {
    const tasks = [makeUrgentTask()]
    render(<TaskList {...defaultProps} tasks={tasks} />)
    // Pencil edit mode button should not appear in urgent view
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
  })

  it('does NOT render add task form in urgent view', () => {
    render(<TaskList {...defaultProps} tasks={[makeUrgentTask()]} />)
    expect(screen.queryByPlaceholderText('Add a new task...')).not.toBeInTheDocument()
  })

  it('toggling a task in urgent view calls onUpdateUrgentTask', () => {
    const task = makeUrgentTask({ id: 'urgent-task-1', sourceSubHubId: 'sub-hub-1' })
    render(<TaskList {...defaultProps} tasks={[task]} />)
    // Click the completion square button
    const completionBtn = screen.getByTitle('Mark complete')
    fireEvent.click(completionBtn)
    expect(defaultProps.onUpdateUrgentTask).toHaveBeenCalledWith('sub-hub-1', 'urgent-task-1')
  })

  it('clicking source sub-hub name calls onNavigateToSource', () => {
    const task = makeUrgentTask({ sourceSubHubId: 'sub-hub-1', sourceSubHubName: 'Kitchen' })
    render(<TaskList {...defaultProps} tasks={[task]} />)
    fireEvent.click(screen.getByText(/Kitchen/))
    expect(defaultProps.onNavigateToSource).toHaveBeenCalledWith('sub-hub-1', task.id)
  })
})

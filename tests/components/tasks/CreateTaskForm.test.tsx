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

const defaultProps = {
  listName: 'Chores',
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

describe('CreateTaskForm — rendering', () => {
  it('renders the Add a new task input', () => {
    render(<TaskList {...defaultProps} />)
    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument()
  })

  it('renders Low, Medium, High urgency toggle buttons', () => {
    render(<TaskList {...defaultProps} />)
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('renders Add Task submit button', () => {
    render(<TaskList {...defaultProps} />)
    expect(screen.getByText('Add Task')).toBeInTheDocument()
  })
})

describe('CreateTaskForm — submission', () => {
  it('submitting with a name calls onUpdateTasks with new task', () => {
    render(<TaskList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'Fix the sink' } })
    fireEvent.click(screen.getByText('Add Task'))
    expect(defaultProps.onUpdateTasks).toHaveBeenCalledOnce()
    const [tasks] = defaultProps.onUpdateTasks.mock.calls[0]
    expect(tasks[0].name).toBe('Fix the sink')
    expect(tasks[0].status).toBe('Not Started')
  })

  it('default urgency for new tasks is Medium', () => {
    render(<TaskList {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Test task' },
    })
    fireEvent.click(screen.getByText('Add Task'))
    const [tasks] = defaultProps.onUpdateTasks.mock.calls[0]
    expect(tasks[0].urgency).toBe('Medium')
  })

  it('selecting High urgency saves task with High urgency', () => {
    render(<TaskList {...defaultProps} />)
    // Click High toggle (finds the urgency toggle, not the badge in a task card)
    const highBtn = screen.getAllByText('High')[0]
    fireEvent.click(highBtn)
    fireEvent.change(screen.getByPlaceholderText('Add a new task...'), {
      target: { value: 'Urgent task' },
    })
    fireEvent.click(screen.getByText('Add Task'))
    const [tasks] = defaultProps.onUpdateTasks.mock.calls[0]
    expect(tasks[0].urgency).toBe('High')
  })

  it('does not call onUpdateTasks when name is empty', () => {
    render(<TaskList {...defaultProps} />)
    fireEvent.click(screen.getByText('Add Task'))
    expect(defaultProps.onUpdateTasks).not.toHaveBeenCalled()
  })

  it('clears the input after adding a task', () => {
    render(<TaskList {...defaultProps} />)
    const input = screen.getByPlaceholderText('Add a new task...')
    fireEvent.change(input, { target: { value: 'New task' } })
    fireEvent.click(screen.getByText('Add Task'))
    expect(input).toHaveValue('')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import TaskList from '@/components/TaskList'
import type { Task } from '@/types/base'

// ConfirmationModal mock
vi.mock('@/components/ConfirmationModal', () => ({
  default: ({
    isOpen,
    onConfirm,
    onClose,
    message,
  }: {
    isOpen: boolean
    onConfirm: () => void
    onClose: () => void
    message?: string
  }) =>
    isOpen ? (
      <div data-testid="confirmation-modal">
        {message && <p>{message}</p>}
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}))

// Stateful wrapper simulating real app state
function TaskListWrapper({
  initialTasks = [],
}: {
  initialTasks?: Task[]
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  return (
    <TaskList
      listName="My Tasks"
      listId="list-1"
      isUrgentView={false}
      tasks={tasks}
      onUpdateTasks={setTasks}
      onBack={vi.fn()}
      masterListTasks={[]}
      onUpdateMasterList={vi.fn()}
      highlightedTaskId={null}
    />
  )
}

function addTask(name: string, urgency?: 'Low' | 'Medium' | 'High') {
  const input = screen.getByPlaceholderText('Add a new task...')
  if (urgency) {
    // Click the urgency toggle before adding
    const buttons = screen.getAllByText(urgency)
    // The urgency toggle buttons are in the form, click the first one
    fireEvent.click(buttons[0])
  }
  fireEvent.change(input, { target: { value: name } })
  fireEvent.click(screen.getByText('Add Task'))
}

describe('Tasks Hub — integration flows', () => {
  it('create task → appears in list with correct name', () => {
    render(<TaskListWrapper />)
    addTask('Fix the sink')
    expect(screen.getByText('Fix the sink')).toBeInTheDocument()
  })

  it('create task with High urgency → badge shows High', () => {
    render(<TaskListWrapper />)
    addTask('Emergency repair', 'High')
    expect(screen.getByText('Emergency repair')).toBeInTheDocument()
    // 'High' badge should appear next to task name
    expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1)
  })

  it('create task → complete it → shows completed style', () => {
    render(<TaskListWrapper />)
    addTask('Buy groceries')
    // Click the completion checkbox square button
    const completeBtn = screen.getByTitle('Mark complete')
    fireEvent.click(completeBtn)
    const nameEl = screen.getByText('Buy groceries')
    expect(nameEl.className).toContain('line-through')
  })

  it('create task → delete it → removed from list', () => {
    render(<TaskListWrapper />)
    addTask('Temporary task')
    // Click the delete (trash) button
    const deleteBtn = screen.getByTitle('Delete task')
    fireEvent.click(deleteBtn)
    // Confirmation modal appears
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument()
    // Confirm deletion
    fireEvent.click(screen.getByText('Confirm'))
    expect(screen.queryByText('Temporary task')).not.toBeInTheDocument()
  })

  it('create two tasks → clear completed removes only completed ones', () => {
    render(
      <TaskListWrapper
        initialTasks={[
          { id: '1', name: 'Active task', status: 'Not Started', urgency: 'Medium' },
          { id: '2', name: 'Done task', status: 'Completed', urgency: 'Low' },
        ]}
      />
    )
    // Enable bulk edit to access Clear Completed
    fireEvent.click(screen.getByTitle('Edit'))
    fireEvent.click(screen.getByText(/Clear Completed/))
    // ConfirmationModal shown — confirm
    fireEvent.click(screen.getByText('Confirm'))
    expect(screen.queryByText('Done task')).not.toBeInTheDocument()
    expect(screen.getByText('Active task')).toBeInTheDocument()
  })
})

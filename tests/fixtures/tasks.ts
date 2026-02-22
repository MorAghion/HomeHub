import type { Task, TaskListInstance } from '@/types/base'

let counter = 0
const nextId = () => `mock-task-${++counter}`

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: nextId(),
    name: 'Clean the kitchen',
    status: 'todo',
    urgency: 'Medium',
    dueDate: '2026-03-01',
    assignee: undefined,
    ...overrides,
  }
}

export function createMockTaskListInstance(
  overrides: Partial<TaskListInstance> = {}
): TaskListInstance {
  return {
    id: nextId(),
    name: 'Weekly Chores',
    tasks: [createMockTask(), createMockTask({ name: 'Vacuum', urgency: 'Low' })],
    ...overrides,
  }
}

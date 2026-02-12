/**
 * Task Memory System
 *
 * ID-based storage with isolated Master Lists per Task Sub-Hub.
 * Each Task Sub-Hub has its own Master List stored by ID.
 *
 * localStorage Key Structure:
 * - task-master_{subHubId} - Fully isolated, ID-based storage
 *
 * Examples:
 * - task-master_home-tasks_urgent
 * - task-master_home-tasks_list-1739384920000
 */

import type { Task } from '../types/base';

/**
 * Generates a localStorage key for the Task Master List based on Sub-Hub ID
 *
 * @param subHubId - The Sub-Hub ID (e.g., "home-tasks_urgent")
 * @returns The localStorage key (e.g., "task-master_home-tasks_urgent")
 */
export function generateTaskMasterListKeyById(subHubId: string): string {
  return `task-master_${subHubId}`;
}

/**
 * Loads Master List items by Sub-Hub ID
 *
 * @param subHubId - The Sub-Hub ID
 * @returns Array of Task items or empty array if not found
 */
export function loadTaskMasterListById(subHubId: string): Task[] {
  const key = generateTaskMasterListKeyById(subHubId);
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error(`Failed to parse Task Master List from key "${key}":`, error);
      return [];
    }
  }

  return [];
}

/**
 * Saves Master List items by Sub-Hub ID
 *
 * @param subHubId - The Sub-Hub ID
 * @param items - Array of Task items to save
 */
export function saveTaskMasterListById(subHubId: string, items: Task[]): void {
  const key = generateTaskMasterListKeyById(subHubId);
  localStorage.setItem(key, JSON.stringify(items));
}

/**
 * Clears Master List items by Sub-Hub ID
 *
 * @param subHubId - The Sub-Hub ID
 */
export function clearTaskMasterListById(subHubId: string): void {
  const key = generateTaskMasterListKeyById(subHubId);
  localStorage.removeItem(key);
}

/**
 * Interface for Task Sub-Hub
 */
export interface TaskListInstance {
  id: string;
  name: string;
  tasks: Task[];
}

/**
 * Checks if a task is urgent based on criteria:
 * - Due date is within 5 days from now
 * - OR urgency is set to 'High'
 *
 * @param task - The task to check
 * @returns true if task meets urgent criteria
 */
export function isTaskUrgent(task: Task): boolean {
  // Check urgency level
  if (task.urgency === 'High') {
    return true;
  }

  // Check due date
  if (task.dueDate) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Urgent if due within 5 days (or overdue)
    if (diffDays <= 5) {
      return true;
    }
  }

  return false;
}

/**
 * Aggregates urgent tasks from all task sub-hubs
 *
 * @param taskLists - Record of all task sub-hubs
 * @returns Array of urgent tasks with their source sub-hub ID
 */
export function getUrgentTasks(
  taskLists: Record<string, TaskListInstance>
): Array<Task & { sourceSubHubId: string; sourceSubHubName: string }> {
  const urgentTasks: Array<Task & { sourceSubHubId: string; sourceSubHubName: string }> = [];

  // Iterate through all task sub-hubs (except the urgent hub itself)
  Object.values(taskLists).forEach(list => {
    if (list.id === 'home-tasks_urgent') {
      return; // Skip the urgent hub itself
    }

    // Check each task in the sub-hub
    list.tasks.forEach(task => {
      if (isTaskUrgent(task)) {
        urgentTasks.push({
          ...task,
          sourceSubHubId: list.id,
          sourceSubHubName: list.name
        });
      }
    });
  });

  // Sort by due date (earliest first), then by urgency
  urgentTasks.sort((a, b) => {
    // If both have due dates, sort by date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    // If only one has a due date, prioritize it
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // If no due dates, sort by urgency
    const urgencyOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 3;
    const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 3;
    return aUrgency - bUrgency;
  });

  return urgentTasks;
}

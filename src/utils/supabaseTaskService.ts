/**
 * Supabase Task Service
 *
 * Replaces localStorage-based task storage with Supabase.
 * Handles task lists (Sub-Hubs), active tasks, and task master items.
 *
 * Field mapping (App ↔ DB):
 *   Task.name     ↔  tasks.text
 *   Task.urgency  ↔  tasks.priority
 *   Task.dueDate  ↔  tasks.due_date
 */

import { supabase } from '../supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Task, TaskListInstance } from '../types/base';

// =============================================================================
// Types
// =============================================================================

export interface TaskList {
  id: string;
  householdId: string;
  name: string;
}

export interface TaskRecord {
  id: string;
  listId: string;
  name: string;
  status: string;
  urgency?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignee?: string;
  notes?: string;
}

export interface TaskMasterItem {
  id: string;
  listId: string;
  name: string;
  status: string;
  urgency?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  assignee?: string;
}

// =============================================================================
// Internal: DB row shapes
// =============================================================================

interface DbTaskList {
  id: string;
  household_id: string;
  name: string;
}

interface DbTask {
  id: string;
  list_id: string;
  text: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  assignee: string | null;
  notes: string | null;
}

interface DbTaskMasterItem {
  id: string;
  list_id: string;
  name: string;
  status: string;
  urgency: string | null;
  due_date: string | null;
  assignee: string | null;
}

// =============================================================================
// Internal: Mappers
// =============================================================================

function mapTaskList(row: DbTaskList): TaskList {
  return { id: row.id, householdId: row.household_id, name: row.name };
}

function mapTask(row: DbTask): TaskRecord {
  return {
    id:       row.id,
    listId:   row.list_id,
    name:     row.text,
    status:   row.status,
    urgency:  (row.priority as 'Low' | 'Medium' | 'High') ?? undefined,
    dueDate:  row.due_date ?? undefined,
    assignee: row.assignee ?? undefined,
    notes:    row.notes ?? undefined,
  };
}

function mapMasterItem(row: DbTaskMasterItem): TaskMasterItem {
  return {
    id:       row.id,
    listId:   row.list_id,
    name:     row.name,
    status:   row.status,
    urgency:  (row.urgency as 'Low' | 'Medium' | 'High') ?? undefined,
    dueDate:  row.due_date ?? undefined,
    assignee: row.assignee ?? undefined,
  };
}

// =============================================================================
// Task Lists CRUD
// =============================================================================

async function fetchLists(householdId: string): Promise<TaskList[]> {
  const { data, error } = await supabase
    .from('task_lists')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`fetchLists: ${error.message}`);
  return (data as DbTaskList[]).map(mapTaskList);
}

async function createList(householdId: string, name: string): Promise<TaskList> {
  const { data, error } = await supabase
    .from('task_lists')
    .insert({ household_id: householdId, name })
    .select()
    .single();

  if (error) throw new Error(`createList: ${error.message}`);
  return mapTaskList(data as DbTaskList);
}

async function updateList(listId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('task_lists')
    .update({ name })
    .eq('id', listId);

  if (error) throw new Error(`updateList: ${error.message}`);
}

async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase
    .from('task_lists')
    .delete()
    .eq('id', listId);

  if (error) throw new Error(`deleteList: ${error.message}`);
}

// =============================================================================
// Tasks CRUD
// =============================================================================

async function fetchTasks(listId: string): Promise<TaskRecord[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`fetchTasks: ${error.message}`);
  return (data as DbTask[]).map(mapTask);
}

async function upsertTask(
  listId: string,
  id: string,
  task: Omit<TaskRecord, 'id' | 'listId'>,
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .upsert({
      id,
      list_id:  listId,
      text:     task.name,
      status:   task.status,
      priority: task.urgency ?? null,
      due_date: task.dueDate ?? null,
      assignee: task.assignee ?? null,
      notes:    task.notes ?? null,
    });

  if (error) throw new Error(`upsertTask: ${error.message}`);
}

async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw new Error(`deleteTask: ${error.message}`);
}

// =============================================================================
// Task Master Items CRUD
// =============================================================================

async function fetchMasterItems(listId: string): Promise<TaskMasterItem[]> {
  const { data, error } = await supabase
    .from('task_master_items')
    .select('*')
    .eq('list_id', listId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`fetchMasterItems: ${error.message}`);
  return (data as DbTaskMasterItem[]).map(mapMasterItem);
}

async function upsertMasterItem(
  listId: string,
  id: string,
  item: Omit<TaskMasterItem, 'id' | 'listId'>,
): Promise<void> {
  const { error } = await supabase
    .from('task_master_items')
    .upsert({
      id,
      list_id:  listId,
      name:     item.name,
      status:   item.status,
      urgency:  item.urgency ?? null,
      due_date: item.dueDate ?? null,
      assignee: item.assignee ?? null,
    });

  if (error) throw new Error(`upsertMasterItem: ${error.message}`);
}

async function deleteMasterItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('task_master_items')
    .delete()
    .eq('id', itemId);

  if (error) throw new Error(`deleteMasterItem: ${error.message}`);
}

// =============================================================================
// Realtime Subscriptions
// =============================================================================

function subscribeToLists(
  householdId: string,
  onUpdate: () => void,
): RealtimeChannel {
  return supabase
    .channel(`task_lists:${householdId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'task_lists',
        filter: `household_id=eq.${householdId}` },
      onUpdate,
    )
    .subscribe();
}

function subscribeToTasks(
  listId: string,
  onUpdate: (tasks: TaskRecord[]) => void,
): RealtimeChannel {
  return supabase
    .channel(`tasks:${listId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks',
        filter: `list_id=eq.${listId}` },
      async () => {
        try {
          const tasks = await fetchTasks(listId);
          onUpdate(tasks);
        } catch (err) {
          console.error('[Task Realtime] Failed to refresh tasks:', err);
        }
      },
    )
    .subscribe();
}

// =============================================================================
// Task Urgency Helpers
// =============================================================================

export function isTaskUrgent(task: Task): boolean {
  if (task.urgency === 'High') return true;
  if (task.dueDate) {
    const diffDays = Math.ceil(
      (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 5) return true;
  }
  return false;
}

export function getUrgentTasks(
  taskLists: Record<string, TaskListInstance>
): Array<Task & { sourceSubHubId: string; sourceSubHubName: string }> {
  const urgent: Array<Task & { sourceSubHubId: string; sourceSubHubName: string }> = [];

  Object.values(taskLists).forEach((list) => {
    if (list.id === 'home-tasks_urgent') return;
    list.tasks.forEach((task) => {
      if (isTaskUrgent(task)) {
        urgent.push({ ...task, sourceSubHubId: list.id, sourceSubHubName: list.name });
      }
    });
  });

  urgent.sort((a, b) => {
    if (a.dueDate && b.dueDate)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    const order = { High: 0, Medium: 1, Low: 2 };
    return (order[a.urgency as keyof typeof order] ?? 3) - (order[b.urgency as keyof typeof order] ?? 3);
  });

  return urgent;
}

// =============================================================================
// Exported Service
// =============================================================================

export const TaskService = {
  fetchLists,
  createList,
  updateList,
  deleteList,
  fetchTasks,
  upsertTask,
  deleteTask,
  fetchMasterItems,
  upsertMasterItem,
  deleteMasterItem,
  subscribeToLists,
  subscribeToTasks,
};

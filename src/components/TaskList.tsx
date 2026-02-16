import { useState, useRef, useEffect } from 'react';
import type { Task } from '../types/base';
import ConfirmationModal from './ConfirmationModal';

interface TaskListProps {
  listName: string;
  listId: string;
  isUrgentView: boolean;
  tasks: Array<Task & { sourceSubHubId?: string; sourceSubHubName?: string }>;
  onUpdateTasks: (tasks: Task[]) => void;
  onBack: () => void;
  onNavigateToSource?: (sourceSubHubId: string, taskId: number) => void;
  onUpdateUrgentTask?: (sourceSubHubId: string, taskId: number) => void;
  masterListTasks: Task[];
  onUpdateMasterList: (tasks: Task[]) => void;
  highlightedTaskId?: number | null;
  onClearHighlight?: () => void;
}

function TaskList({
  listName,
  listId: _listId,
  isUrgentView,
  tasks,
  onUpdateTasks,
  onBack,
  onNavigateToSource,
  onUpdateUrgentTask,
  masterListTasks: _masterListTasks,
  onUpdateMasterList: _onUpdateMasterList,
  highlightedTaskId,
  onClearHighlight,
}: TaskListProps) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskUrgency, setNewTaskUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editUrgency, setEditUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedTasksForDeletion, setSelectedTasksForDeletion] = useState<Set<number>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk' | 'completed';
    taskId?: number;
  } | null>(null);

  // Ref for task elements (for flashlight effect)
  const taskRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Flashlight effect when navigating from Urgent view
  useEffect(() => {
    if (highlightedTaskId && taskRefs.current[highlightedTaskId]) {
      const element = taskRefs.current[highlightedTaskId];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('flashlight-highlight');

      const timeout = setTimeout(() => {
        element.classList.remove('flashlight-highlight');
        onClearHighlight?.();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [highlightedTaskId, onClearHighlight]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: Task = {
      id: Date.now(),
      name: newTaskName.trim(),
      status: 'Not Started',
      dueDate: newTaskDueDate || undefined,
      urgency: newTaskUrgency,
    };

    onUpdateTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskDueDate('');
    setNewTaskUrgency('Medium');
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditName(task.name);
    setEditStatus(task.status || 'Not Started');
    setEditDueDate(task.dueDate ? String(task.dueDate) : '');
    setEditAssignee(task.assignee || '');
    setEditUrgency(task.urgency || 'Medium');
  };

  const saveEdit = () => {
    if (editingId === null) return;

    const updatedTasks = tasks.map(task =>
      task.id === editingId
        ? {
            ...task,
            name: editName.trim(),
            status: editStatus,
            dueDate: editDueDate || undefined,
            assignee: editAssignee.trim() || undefined,
            urgency: editUrgency,
          }
        : task
    );

    onUpdateTasks(updatedTasks);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const toggleComplete = (id: number) => {
    // If in urgent view, find the task's source and update it there
    if (isUrgentView && onUpdateUrgentTask) {
      const task = tasks.find(t => t.id === id);
      if (task && task.sourceSubHubId) {
        onUpdateUrgentTask(task.sourceSubHubId, id);
        return;
      }
    }

    // Otherwise, update tasks normally
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const newStatus = task.status === 'Completed' ? 'In Progress' : 'Completed';
        return { ...task, status: newStatus };
      }
      return task;
    });
    onUpdateTasks(updatedTasks);
  };

  const deleteSingleTask = (id: number) => {
    onUpdateTasks(tasks.filter(task => task.id !== id));
    setDeleteConfirmation(null);
  };

  const toggleTaskSelection = (taskId: number) => {
    const newSelected = new Set(selectedTasksForDeletion);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasksForDeletion(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTasksForDeletion.size === tasks.length) {
      setSelectedTasksForDeletion(new Set());
    } else {
      setSelectedTasksForDeletion(new Set(tasks.map(task => task.id)));
    }
  };

  const deleteSelectedTasks = () => {
    onUpdateTasks(tasks.filter(task => !selectedTasksForDeletion.has(task.id)));
    setSelectedTasksForDeletion(new Set());
    setDeleteConfirmation(null);
    setIsBulkDeleteMode(false);
  };

  const deleteCompletedTasks = () => {
    const completedIds = tasks
      .filter(task => task.status === 'Completed')
      .map(task => task.id);

    onUpdateTasks(tasks.filter(task => !completedIds.includes(task.id)));
    setDeleteConfirmation(null);
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'High':
        return '#DC2626';
      case 'Medium':
        return '#F59E0B';
      case 'Low':
        return '#10B981';
      default:
        return '#8E806A';
    }
  };

  const formatDueDate = (dueDate?: string | Date) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: '#DC2626' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: '#DC2626' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: '#F59E0B' };
    } else if (diffDays <= 5) {
      return { text: `Due in ${diffDays}d`, color: '#F59E0B' };
    } else {
      return { text: `Due ${date.toLocaleDateString()}`, color: '#8E806A' };
    }
  };

  return (
    <div className="w-full px-6 py-8 overflow-x-hidden" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity"
            >
              ←
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>
                {listName}
              </h1>
              {isUrgentView && (
                <p className="text-sm mt-1" style={{ color: '#8E806A' }}>
                  Aggregated from all task lists
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {!isUrgentView && tasks.length > 0 && (
              <button
                onClick={() => {
                  setIsBulkDeleteMode(!isBulkDeleteMode);
                  if (isBulkDeleteMode) {
                    setSelectedTasksForDeletion(new Set());
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isBulkDeleteMode ? '#630606' : 'transparent',
                  color: isBulkDeleteMode ? 'white' : '#630606',
                  border: isBulkDeleteMode ? 'none' : '1px solid #63060633'
                }}
              >
                {isBulkDeleteMode ? 'Done' : 'Edit'}
              </button>
            )}
            {!isUrgentView && tasks.filter(t => t.status === 'Completed').length > 0 && (
              <button
                onClick={() => setDeleteConfirmation({ type: 'completed' })}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                Clear Completed
              </button>
            )}
          </div>
        </div>

        {/* Bulk Delete Actions */}
        {isBulkDeleteMode && (
          <div className="flex items-center justify-between p-3 bg-[#63060611] rounded-xl">
            <div className="flex items-center gap-3">
              {selectedTasksForDeletion.size > 0 && (
                <span className="text-sm font-medium" style={{ color: '#630606' }}>
                  {selectedTasksForDeletion.size} selected
                </span>
              )}
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedTasksForDeletion.size === tasks.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              {selectedTasksForDeletion.size > 0 && (
                <button
                  onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ backgroundColor: '#630606' }}
                >
                  Delete Selected
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Add New Task Form */}
        {!isUrgentView && (
          <form onSubmit={addTask} className="bg-white p-6 rounded-2xl shadow-sm mb-6">
            <div className="flex flex-col gap-3">
              {/* Task Name Input */}
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Add a new task..."
                className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors"
                style={{ borderColor: '#8E806A33' }}
              />

              {/* Date, Urgency, and Button Row */}
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="flex-1 px-3 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors text-sm"
                  style={{ borderColor: '#8E806A33' }}
                />
                <select
                  value={newTaskUrgency}
                  onChange={(e) => setNewTaskUrgency(e.target.value as 'Low' | 'Medium' | 'High')}
                  className="px-3 py-3 rounded-lg border-2 focus:outline-none focus:border-[#630606] transition-colors text-sm"
                  style={{ borderColor: '#8E806A33' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Med</option>
                  <option value="High">High</option>
                </select>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: '#630606' }}
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="bg-white/70 p-12 rounded-2xl text-center">
              <p className="text-lg" style={{ color: '#8E806A', opacity: 0.7 }}>
                {isUrgentView ? 'No urgent tasks' : 'No tasks yet'}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                ref={(el) => taskRefs.current[task.id] = el}
                className="bg-white p-4 rounded-xl shadow-sm transition-all hover:shadow-md"
                style={{ border: isBulkDeleteMode && selectedTasksForDeletion.has(task.id) ? '2px solid #630606' : '1px solid transparent' }}
              >
                {editingId === task.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-[#630606]"
                      style={{ borderColor: '#8E806A33' }}
                    />
                    <div className="grid grid-cols-4 gap-3">
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-3 py-2 rounded-lg border-2"
                        style={{ borderColor: '#8E806A33' }}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                      </select>
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="px-3 py-2 rounded-lg border-2"
                        style={{ borderColor: '#8E806A33' }}
                      />
                      <input
                        type="text"
                        value={editAssignee}
                        onChange={(e) => setEditAssignee(e.target.value)}
                        placeholder="Assignee"
                        className="px-3 py-2 rounded-lg border-2"
                        style={{ borderColor: '#8E806A33' }}
                      />
                      <select
                        value={editUrgency}
                        onChange={(e) => setEditUrgency(e.target.value as 'Low' | 'Medium' | 'High')}
                        className="px-3 py-2 rounded-lg border-2"
                        style={{ borderColor: '#8E806A33' }}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: '#630606' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                        style={{ color: '#630606' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center gap-6">
                    {isBulkDeleteMode && !isUrgentView ? (
                      <div
                        onClick={() => toggleTaskSelection(task.id)}
                        className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                        style={{
                          borderColor: selectedTasksForDeletion.has(task.id) ? '#630606' : '#8E806A33',
                          backgroundColor: selectedTasksForDeletion.has(task.id) ? '#630606' : 'transparent',
                        }}
                      >
                        {selectedTasksForDeletion.has(task.id) && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer hover:border-[#630606] flex-shrink-0"
                        style={{
                          borderColor: task.status === 'Completed' ? '#630606' : '#8E806A33',
                          backgroundColor: task.status === 'Completed' ? '#630606' : 'transparent',
                        }}
                      >
                        {task.status === 'Completed' && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </button>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span
                          className={`text-lg font-medium ${
                            task.status === 'Completed' ? 'line-through opacity-50' : ''
                          }`}
                          style={{ color: '#630606' }}
                        >
                          {task.name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getUrgencyColor(task.urgency)}22`,
                            color: getUrgencyColor(task.urgency)
                          }}
                        >
                          {task.urgency || 'Medium'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm" style={{ color: '#8E806A' }}>
                        {task.status && (
                          <span className="flex items-center gap-1">
                            <span className="opacity-70">Status:</span>
                            <span className="font-medium">{task.status}</span>
                          </span>
                        )}
                        {task.dueDate && formatDueDate(task.dueDate) && (
                          <span
                            className="flex items-center gap-1 font-medium"
                            style={{ color: formatDueDate(task.dueDate)?.color }}
                          >
                            📅 {formatDueDate(task.dueDate)?.text}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <span className="opacity-70">Assignee:</span>
                            <span className="font-medium">{task.assignee}</span>
                          </span>
                        )}
                        {isUrgentView && task.sourceSubHubName && (
                          <button
                            onClick={() => onNavigateToSource?.(task.sourceSubHubId!, task.id)}
                            className="flex items-center gap-1 hover:underline"
                            style={{ color: '#630606' }}
                          >
                            📂 {task.sourceSubHubName}
                          </button>
                        )}
                      </div>
                    </div>

                    {!isBulkDeleteMode && !isUrgentView && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(task)}
                          className="p-2 hover:bg-[#8E806A11] rounded-lg transition-colors"
                          style={{ color: '#8E806A' }}
                          title="Edit task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmation({ type: 'single', taskId: task.id })}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          style={{ color: '#630606' }}
                          title="Delete task"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation?.type === 'bulk') {
            deleteSelectedTasks();
          } else if (deleteConfirmation?.type === 'completed') {
            deleteCompletedTasks();
          } else if (deleteConfirmation?.taskId) {
            deleteSingleTask(deleteConfirmation.taskId);
          }
        }}
        title={
          deleteConfirmation?.type === 'bulk'
            ? 'Delete Selected Tasks?'
            : deleteConfirmation?.type === 'completed'
            ? 'Clear Completed Tasks?'
            : 'Delete Task?'
        }
        message={
          deleteConfirmation?.type === 'bulk'
            ? `Are you sure you want to delete ${selectedTasksForDeletion.size} task${selectedTasksForDeletion.size !== 1 ? 's' : ''}?`
            : deleteConfirmation?.type === 'completed'
            ? `Are you sure you want to delete ${tasks.filter(t => t.status === 'Completed').length} completed task${tasks.filter(t => t.status === 'Completed').length !== 1 ? 's' : ''}?`
            : 'Are you sure you want to delete this task?'
        }
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}

export default TaskList;

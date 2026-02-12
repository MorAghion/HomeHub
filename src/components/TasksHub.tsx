import { useState } from 'react';
import InputModal from './InputModal';
import ConfirmationModal from './ConfirmationModal';
import type { TaskListInstance } from '../utils/taskMemory';

interface TasksHubProps {
  taskLists: Record<string, TaskListInstance>;
  urgentTaskCount: number;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onEditList: (listId: string, newName: string) => void;
  onDeleteList: (listId: string) => void;
  onDeleteLists: (listIds: string[]) => void;
  onBack: () => void;
}

function TasksHub({
  taskLists,
  urgentTaskCount,
  onSelectList,
  onCreateList,
  onEditList,
  onDeleteList,
  onDeleteLists,
  onBack,
}: TasksHubProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedListsForDeletion, setSelectedListsForDeletion] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'single' | 'bulk';
    listId?: string;
  } | null>(null);

  // Filter out urgent tasks from the editable lists
  const editableLists = Object.values(taskLists).filter(list => list.id !== 'home-tasks_urgent');
  const listArray = Object.values(taskLists);

  const toggleListSelection = (listId: string) => {
    const newSelected = new Set(selectedListsForDeletion);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedListsForDeletion(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedListsForDeletion.size === editableLists.length) {
      setSelectedListsForDeletion(new Set());
    } else {
      setSelectedListsForDeletion(new Set(editableLists.map(list => list.id)));
    }
  };

  const handleDeleteSelected = () => {
    onDeleteLists(Array.from(selectedListsForDeletion));
    setSelectedListsForDeletion(new Set());
    setDeleteConfirmation(null);
    setIsEditMode(false);
  };

  const handleDeleteSingle = (listId: string) => {
    onDeleteList(listId);
    setDeleteConfirmation(null);
  };

  const handleEditList = (newName: string) => {
    if (editingListId) {
      onEditList(editingListId, newName);
      setEditingListId(null);
    }
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setSelectedListsForDeletion(new Set());
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-2xl hover:opacity-50 transition-opacity"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>
              Home Tasks
            </h1>
          </div>

          {/* Edit Mode Toggle */}
          {editableLists.length > 0 && (
            <button
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (isEditMode) {
                  cancelEditMode();
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isEditMode ? '#630606' : 'transparent',
                color: isEditMode ? 'white' : '#630606',
                border: isEditMode ? 'none' : '1px solid #63060633'
              }}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          )}
        </div>

        {/* Bulk Delete Actions */}
        {isEditMode && (
          <div className="flex items-center justify-between p-3 bg-[#63060611] rounded-xl mb-4">
            <div className="flex items-center gap-3">
              {selectedListsForDeletion.size > 0 && (
                <span className="text-sm font-medium" style={{ color: '#630606' }}>
                  {selectedListsForDeletion.size} selected
                </span>
              )}
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white transition-colors"
                style={{ color: '#630606', border: '1px solid #63060633' }}
              >
                {selectedListsForDeletion.size === editableLists.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              {selectedListsForDeletion.size > 0 && (
                <button
                  onClick={() => setDeleteConfirmation({ type: 'bulk' })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                  style={{ backgroundColor: '#630606' }}
                >
                  Delete Selected
                </button>
              )}
              <button
                onClick={cancelEditMode}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                style={{ color: '#630606' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Urgent Tasks Sub-Hub (Always first, read-only) */}
          <div
            onClick={() => !isEditMode && onSelectList('home-tasks_urgent')}
            className={`bg-gradient-to-br from-[#630606] to-[#8b0000] p-6 rounded-2xl shadow-md transition-all ${
              !isEditMode ? 'hover:shadow-lg cursor-pointer active:scale-[0.98]' : 'opacity-70'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">🔥</span>
              {urgentTaskCount > 0 && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#FFD700' }}
                >
                  {urgentTaskCount}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold mb-1 text-white">
              Urgent Tasks
            </h2>
            <p className="text-sm text-white opacity-80">
              High priority & due soon
            </p>
          </div>

          {/* Existing Task Lists */}
          {listArray.filter(list => list.id !== 'home-tasks_urgent').map((list) => (
            <div
              key={list.id}
              className="bg-white p-6 rounded-2xl shadow-sm transition-all hover:shadow-md relative"
              style={{ border: isEditMode && selectedListsForDeletion.has(list.id) ? '2px solid #630606' : '1px solid transparent' }}
            >
              {isEditMode ? (
                // Edit Mode
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div
                    onClick={() => toggleListSelection(list.id)}
                    className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer flex-shrink-0 mt-1"
                    style={{
                      borderColor: selectedListsForDeletion.has(list.id) ? '#630606' : '#8E806A33',
                      backgroundColor: selectedListsForDeletion.has(list.id) ? '#630606' : 'transparent',
                    }}
                  >
                    {selectedListsForDeletion.has(list.id) && (
                      <span className="text-white text-xs font-bold">✓</span>
                    )}
                  </div>

                  <div className="flex-1" onClick={() => toggleListSelection(list.id)}>
                    <span className="text-3xl mb-3 block">📋</span>
                    <h2 className="text-xl font-semibold mb-1" style={{ color: '#630606' }}>
                      {list.name}
                    </h2>
                    <p className="text-sm" style={{ color: '#8E806A', opacity: 0.7 }}>
                      {list.tasks.length} task{list.tasks.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setEditingListId(list.id)}
                      className="p-2 hover:bg-[#8E806A11] rounded-lg transition-colors"
                      style={{ color: '#8E806A' }}
                      title="Edit name"
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
                      onClick={() => setDeleteConfirmation({ type: 'single', listId: list.id })}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      style={{ color: '#630606' }}
                      title="Delete list"
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
                </div>
              ) : (
                // View Mode
                <button
                  onClick={() => onSelectList(list.id)}
                  className="w-full text-left"
                >
                  <span className="text-3xl mb-3 block">📋</span>
                  <h2 className="text-xl font-semibold mb-1" style={{ color: '#630606' }}>
                    {list.name}
                  </h2>
                  <p className="text-sm" style={{ color: '#8E806A', opacity: 0.7 }}>
                    {list.tasks.length} task{list.tasks.length !== 1 ? 's' : ''}
                  </p>
                </button>
              )}
            </div>
          ))}

          {/* Create New List Button */}
          {!isEditMode && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white/70 p-6 rounded-2xl shadow-sm text-left hover:bg-white hover:shadow-md transition-all active:scale-[0.98] border border-dashed flex flex-col items-center justify-center"
              style={{ borderColor: '#8E806A33' }}
            >
              <span className="text-4xl mb-3">+</span>
              <h2 className="text-lg font-semibold" style={{ color: '#630606' }}>
                Create New Task List
              </h2>
              <p className="text-xs mt-2" style={{ color: '#8E806A', opacity: 0.6 }}>
                Add a custom task list
              </p>
            </button>
          )}
        </div>
      </main>

      {/* Create List Modal */}
      <InputModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={onCreateList}
        title="Create New Task List"
        placeholder="Enter list name..."
        submitText="Create"
      />

      {/* Edit List Modal */}
      <InputModal
        isOpen={editingListId !== null}
        onClose={() => setEditingListId(null)}
        onSubmit={handleEditList}
        title="Edit List Name"
        placeholder="Enter new name..."
        initialValue={editingListId ? taskLists[editingListId]?.name || '' : ''}
        submitText="Save"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation !== null}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={() => {
          if (deleteConfirmation?.type === 'bulk') {
            handleDeleteSelected();
          } else if (deleteConfirmation?.listId) {
            handleDeleteSingle(deleteConfirmation.listId);
          }
        }}
        title={deleteConfirmation?.type === 'bulk' ? 'Delete Selected Lists?' : 'Delete List?'}
        message={
          deleteConfirmation?.type === 'bulk'
            ? `Are you sure you want to delete ${selectedListsForDeletion.size} list${selectedListsForDeletion.size !== 1 ? 's' : ''}? This will also clear their Master Lists.`
            : deleteConfirmation?.listId
            ? `Are you sure you want to delete "${taskLists[deleteConfirmation.listId]?.name}"? This will also clear its Master List.`
            : ''
        }
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}

export default TasksHub;

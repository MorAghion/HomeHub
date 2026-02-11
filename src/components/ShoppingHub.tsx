interface ListInstance {
  id: string;
  name: string;
  items: Array<{ id: number; text: string; completed: boolean; category?: string }>;
}

interface ShoppingHubProps {
  lists: Record<string, ListInstance>;
  onSelectList: (listId: string) => void;
  onCreateList: (name: string) => void;
  onBack: () => void;
}

function ShoppingHub({ lists, onSelectList, onCreateList, onBack }: ShoppingHubProps) {
  const handleCreateNewList = () => {
    const name = prompt('Enter list name:', '');
    if (name && name.trim()) {
      onCreateList(name);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={onBack}
            className="text-2xl hover:opacity-50 transition-opacity"
          >
            ←
          </button>
          <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>
            Shopping Lists
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Existing Lists */}
          {Object.values(lists).map((list) => (
            <button
              key={list.id}
              onClick={() => onSelectList(list.id)}
              className="bg-white p-6 rounded-2xl shadow-sm text-left hover:shadow-md transition-all active:scale-[0.98] flex flex-col border border-transparent"
            >
              <span className="text-3xl mb-3">📝</span>
              <h2 className="text-xl font-semibold mb-1" style={{ color: '#630606' }}>
                {list.name}
              </h2>
              <p className="text-sm" style={{ color: '#8E806A', opacity: 0.7 }}>
                {list.items.length} item{list.items.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}

          {/* Create New List Button */}
          <button
            onClick={handleCreateNewList}
            className="bg-white/70 p-6 rounded-2xl shadow-sm text-left hover:bg-white hover:shadow-md transition-all active:scale-[0.98] border border-dashed flex flex-col items-center justify-center"
            style={{ borderColor: '#8E806A33' }}
          >
            <span className="text-4xl mb-3">+</span>
            <h2 className="text-lg font-semibold" style={{ color: '#630606' }}>
              Create New List
            </h2>
            <p className="text-xs mt-2" style={{ color: '#8E806A', opacity: 0.6 }}>
              Add a custom shopping list
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}

export default ShoppingHub;

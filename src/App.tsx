import { useState, useEffect } from 'react'

interface ShoppingItem {
  id: number;
  text: string;
  completed: boolean;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'shopping'>('dashboard');
  
  // טעינת הנתונים מהזיכרון של הדפדפן בעת העלייה
  const [items, setItems] = useState<ShoppingItem[]>(() => {
    const saved = localStorage.getItem('homehub-items');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Milk', completed: false },
      { id: 2, text: 'Eggs', completed: false },
    ];
  });

  const [newItem, setNewItem] = useState('');

  // שמירה אוטומטית בכל פעם שהרשימה משתנה
  useEffect(() => {
    localStorage.setItem('homehub-items', JSON.stringify(items));
  }, [items]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setItems([{ id: Date.now(), text: newItem, completed: false }, ...items]);
    setNewItem('');
  };

  const toggleItem = (id: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };


  // --- מסך רשימת קניות ---
  if (currentScreen === 'shopping') {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
        <header className="mb-8 max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentScreen('dashboard')} 
              className="text-2xl hover:opacity-50 transition-opacity"
            >
              ←
            </button>
            <h1 className="text-3xl font-bold" style={{ color: '#630606' }}>Shopping List</h1>
          </div>
          <span className="text-sm font-medium" style={{ color: '#8E806A' }}>
            {items.filter(i => !i.completed).length} items left
          </span>
        </header>

        <main className="max-w-4xl mx-auto">
          {/* שדה הוספה */}
          <form onSubmit={addItem} className="mb-8">
            <input 
              type="text" 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add something to the list..."
              className="w-full p-5 rounded-3xl border-none shadow-sm focus:ring-2 focus:ring-[#8E806A44] outline-none text-lg"
              style={{ color: '#8E806A' }}
            />
          </form>

          {/* הצגת הפריטים */}
          <div className="space-y-3">
            {items.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="bg-white p-5 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
              >
                {/* הצ'קבוקס בבורדו */}
                <div 
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                  style={{ 
                    borderColor: item.completed ? '#630606' : '#8E806A33',
                    backgroundColor: item.completed ? '#630606' : 'transparent'
                  }}
                >
                  {item.completed && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                
                <span 
                  className={`text-lg transition-all ${item.completed ? 'line-through opacity-40 italic' : ''}`} 
                  style={{ color: '#8E806A' }}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  // --- מסך דאשבורד (בית) ---
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F2E7' }}>
      <header className="mb-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#630606' }}>HomeHub</h1>
        <p className="text-lg mt-2" style={{ color: '#8E806A', opacity: 0.8 }}>Welcome home, Mor.</p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <button 
          onClick={() => setCurrentScreen('shopping')} 
          className="bg-white p-10 rounded-[40px] shadow-sm text-left hover:shadow-md transition-all active:scale-[0.95] flex flex-col border border-transparent"
        >
          <span className="text-4xl mb-4">🛒</span>
          <h2 className="text-2xl font-semibold" style={{ color: '#8E806A' }}>Shopping List</h2>
          <p className="text-sm mt-1" style={{ color: '#8E806A', opacity: 0.6 }}>Check what's missing in the pantry</p>
        </button>

        <button className="bg-white p-10 rounded-[40px] shadow-sm text-left opacity-80 flex flex-col border border-transparent">
          <span className="text-3xl mb-4 grayscale">🏠</span>
          <h2 className="text-2xl font-semibold" style={{ color: '#8E806A' }}>Home Tasks</h2>
          <p className="text-sm mt-1" style={{ color: '#8E806A', opacity: 0.6 }}>Coming soon...</p>
        </button>

        <div className="bg-white/50 p-10 rounded-[40px] border border-dashed border-[#8E806A33] flex flex-col relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-[#8E806A11] px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold" style={{ color: '#8E806A' }}>
            Soon
          </div>
          <span className="text-3xl mb-4 grayscale opacity-50">🎟️</span>
          <h2 className="text-2xl font-semibold opacity-40" style={{ color: '#8E806A' }}>Vouchers</h2>
          <p className="text-sm mt-1 opacity-30" style={{ color: '#8E806A' }}>Future rewards & surprises</p>
        </div>
      </main>
    </div>
  )
}

export default App
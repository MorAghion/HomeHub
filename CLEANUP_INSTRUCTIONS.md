# Cleanup Instructions

## Step 1: Clear Corrupted localStorage Data

Open your browser's DevTools (F12) and run this in the Console:

```javascript
// Clear all HomeHub localStorage data
Object.keys(localStorage)
  .filter(key => key.startsWith('homehub'))
  .forEach(key => localStorage.removeItem(key));

console.log('✅ HomeHub localStorage cleared');
```

Or use this one-liner:
```javascript
Object.keys(localStorage).filter(k=>k.startsWith('homehub')).forEach(k=>localStorage.removeItem(k))
```

## Step 2: Restart Dev Server

```bash
cd /Users/mora/AI_Learning/HomeHub
npm run dev
```

## Step 3: Test the Fix

1. Create "Groceries" list
2. Open Master List → Add items: "Milk", "Eggs"
3. Go back to Shopping Hub
4. Create "Party" list
5. Open Master List → Should be EMPTY (no grocery items!)
6. Add "Balloons" to Party
7. Go back and open "Groceries" again
8. Master List should show "Milk", "Eggs" (not balloons!)

## Alternative: Hard Refresh

If the fix still doesn't work after clearing localStorage:
- Chrome/Edge: `Ctrl+Shift+Delete` or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files" + "Cookies and site data"
- Or just hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R` (Mac)

## Verify Fix is Applied

Check the file `src/App.tsx` around line 36-37 should have:
```typescript
// Ref to track if we're in the middle of loading a new context
const isLoadingContextRef = useRef(false);
```

If you don't see this, the changes weren't saved properly.

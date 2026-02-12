# HomeHub Technical Context (v1.0)

## 🏗️ Hierarchy & Logic
- **Hub:** Domain (e.g., Shopping & Gear)
- **Sub-Hub:** Specific destination list (e.g., Supermarket, Camping)
- **Context:** Derived from Sub-Hub name (e.g., "Camping Trip" -> Context: `Camping`)
- **Master List:** Template storage in localStorage using context-based keys.
- **Active List:** Current session items.

## ✨ Feature Requirements: Smart Suggestions
1. **Mapping:** Keywords link Sub-Hub names to context-specific item sets.
2. **UI (Bubbles):** - Shown in center when Master List is empty.
   - Style: `bg-[#630606]/10`, `border-[#630606]`, `text-[#630606]`.
   - "Keep Empty" Bubble: `border-dashed`.
3. **Behavior:** Clicking a bubble triggers a **Smart Merge** (adds items to Master List, no duplicates).

## 🏷️ List-Categories
Items must be sorted into:
- `Dairy`, `Meat`, `Fish`, `Pantry`, `Vegetables`, `Fruit`, `Cleaning`, `Pharma & Hygiene`.
- **New:** `Documents & Money` (for critical travel/finance items).
- **Fallback:** `Other`.

## 🎨 Visual Specs
- Primary Color: `#630606` (Burgundy).
- Background: `#F5F2E7` (Taupe/Cream).
- Animations: Smooth transitions (duration-300).
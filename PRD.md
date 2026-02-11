# HomeHub - Product Requirements Document (PRD)

**Document Version**: 1.1
**Last Updated**: 2026-02-10
**Author**: Senior Software Architect
**Status**: Approved - In Development

---

## Project Overview

**HomeHub** is a shared household management application designed to reduce cognitive load for partners managing a household together. Instead of overwhelming to-do lists and scattered information, HomeHub provides a clean, minimalist dashboard with intuitive "Parent Cards" that organize household responsibilities into digestible, manageable chunks.

---

## Project Vision

Traditional household management apps overwhelm users with endless lists and notifications. HomeHub takes a different approach: it reduces mental burden by presenting information in a calm, organized manner. The app focuses on what matters most, when it matters most, without creating anxiety or decision fatigue.

### Core Philosophy
- **Reduce, Don't Add** - Minimize cognitive load, not increase it
- **Calm Technology** - Information appears when needed, not constantly demanding attention
- **Partnership-First** - Built for couples/partners sharing household responsibilities
- **Progressive Disclosure** - Show high-level overview first, details on demand

---

## Target Users

- **Primary**: Couples/partners living together who want to share household management
- **Age Range**: 25-45 years old
- **Tech Savviness**: Comfortable with modern apps but value simplicity
- **Pain Points**:
  - Overwhelmed by traditional task apps
  - Tired of mental burden of remembering everything
  - Frustrated by lack of real-time sync with partner
  - Decision fatigue from too many notifications

---

## Design Requirements

### Visual Design
- **Style**: Minimalist, clean, uncluttered
- **Color Palette**:
  - Primary: Taupe (#8B7E74)
  - Secondary: Cream (#F5F5DC)
  - Accent: Muted Sage Green (#8A9A8B)
  - Background: Soft whites and creams
  - Text: Dark gray (#2D2D2D) for readability

### Color Usage Guide:
- **Taupe**: Primary UI elements, borders, inactive states
- **Cream**: Backgrounds, cards, soft surfaces
- **Muted Sage Green**: Success states, completed items, calm indicators
- **Darker variants**: Hover states, active elements

### User Experience (UX)
- **Navigation**: Card-based dashboard as home screen
- **Interaction**: Click/tap a "Parent Card" to dive into details
- **Transitions**: Smooth, gentle animations - nothing jarring or anxiety-inducing
- **Mobile-First**: Optimized for mobile devices (primary use case)
- **Accessibility**: WCAG 2.1 AA compliant
- **Touch Targets**: Minimum 44x44px for all interactive elements

### User Flow
1. **Home Screen**: Dashboard with Parent Cards (Shopping List, Home Tasks, etc.)
2. **Card Click**: Smooth transition to detail view
3. **Detail View**: Full functionality for that category (add items, check off, categorize)
4. **Back Navigation**: Easy return to dashboard

---

## MVP Scope (Phase 1)

### Feature 1: Shopping List
**Priority**: HIGH (Fast delivery required)
**Purpose**: Shared grocery/shopping list with real-time sync

**Functionality**:
- Add shopping items with simple text input
- Check off items as purchased
- Real-time sync between partners (changes appear instantly)
- Simple categorization (optional: Produce, Dairy, etc.)
- Clear completed items manually or auto-archive after 24 hours
- Drag to reorder items

**User Stories**:
- As a user, I want to add items to the shopping list so my partner sees them immediately
- As a user, I want to check off items I've purchased so my partner knows what's been bought
- As a user, I want to see changes my partner makes in real-time to avoid duplicate purchases
- As a user, I want to quickly add items without leaving the dashboard

**UI Components**:
- Shopping List Card (Dashboard)
- Shopping List Detail View
- Add Item Input (with auto-focus)
- Checkbox + Item Text
- Delete/Archive button

---

### Feature 2: Home Management (Tasks)
**Priority**: MEDIUM
**Purpose**: Household tasks organized by urgency

**Functionality**:
- Three categories: **Urgent**, **Soon**, **Someday**
- Add tasks with title and optional notes
- Assign to self, partner, or "either"
- Move tasks between categories (drag or menu)
- Mark tasks as complete
- Archive completed tasks

**Task Categories**:
- **Urgent**: Needs attention within 24-48 hours (amber/warm indicator)
- **Soon**: Needs attention within a week (neutral indicator)
- **Someday**: No immediate deadline (sage green/calm indicator)

**User Stories**:
- As a user, I want to categorize tasks by urgency so I can prioritize effectively
- As a user, I want to assign tasks to my partner so they know what needs their attention
- As a user, I want to see all household tasks in one place without feeling overwhelmed
- As a user, I want to move tasks between categories as priorities change

**UI Components**:
- Home Tasks Card (Dashboard)
- Tasks Detail View with 3 columns (Urgent/Soon/Someday)
- Add Task Modal/Form
- Task Card with assignment indicator
- Move/Edit/Complete actions

---

## Out of Scope (Future Phases)

The following features are **NOT** part of MVP:
- Calendar/scheduling integration
- Budget tracking
- Recipe management
- Pet care tracking
- Push notifications/reminders
- User authentication (Phase 2)
- Multiple household support
- File attachments
- Task recurrence/repeating tasks
- Task comments/discussion
- Task history/audit log

---

## Technical Considerations

### Key Requirements
1. **Real-time Sync**: Changes must appear instantly for all users (<100ms latency)
2. **Offline Support**: App should work offline and sync when reconnected
3. **Mobile-First**: Responsive design, mobile as primary platform
4. **Fast Load Times**: < 2 seconds initial load
5. **Cross-Platform**: Web app accessible on iOS, Android, and desktop browsers
6. **Scalability**: Architecture should support future features without major refactoring

### Performance Targets
- **First Contentful Paint (FCP)**: < 1.5s
- **Time to Interactive (TTI)**: < 3s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

---

## Data Model (Preliminary)

### ShoppingItem
```typescript
{
  id: uuid,
  text: string,
  completed: boolean,
  category?: string,
  order: number,
  createdAt: timestamp,
  createdBy: userId,
  completedAt?: timestamp,
  householdId: uuid
}
```

### Task
```typescript
{
  id: uuid,
  title: string,
  notes?: string,
  urgency: "urgent" | "soon" | "someday",
  assignedTo?: userId,
  completed: boolean,
  order: number,
  createdAt: timestamp,
  createdBy: userId,
  completedAt?: timestamp,
  householdId: uuid
}
```

### User (Phase 2)
```typescript
{
  id: uuid,
  name: string,
  email: string,
  householdId: uuid,
  createdAt: timestamp
}
```

### Household (Phase 2)
```typescript
{
  id: uuid,
  name: string,
  shareCode: string,  // For easy sharing
  createdAt: timestamp
}
```

---

## Success Metrics

### MVP Success Criteria:
- [ ] Users can add shopping items and see real-time updates
- [ ] Users can manage household tasks across three urgency categories
- [ ] Mobile-responsive design works on iOS and Android
- [ ] Page load time < 2 seconds
- [ ] Zero data loss during offline/online transitions
- [ ] Clean, minimalist UI matches design requirements
- [ ] Lighthouse score > 90 across all metrics

### Future KPIs (Post-MVP):
- **Engagement**: Average sessions per week (target: 5+)
- **Feature Adoption**: % of users actively using both features (target: 80%)
- **Partnership Usage**: % of households with 2+ active users (target: 70%)
- **Retention**:
  - 7-day retention: 60%
  - 30-day retention: 40%
  - 90-day retention: 25%
- **Performance**: < 0.5% error rate

---

## Development Phases

### Phase 1: MVP (Current - Fast Track)
**Timeline**: 4-6 weeks
**Priority**: Dashboard + Shopping List first, then Tasks

**Week 1-2**:
- Project setup and infrastructure
- Dashboard with Parent Cards
- Shopping List (full functionality)
- Real-time sync implementation

**Week 3-4**:
- Home Management Tasks feature
- Drag-and-drop between categories
- Polish and animations

**Week 5-6**:
- Testing and bug fixes
- Performance optimization
- Beta testing with real users

### Phase 2: Enhanced MVP (Future)
**Timeline**: 4-6 weeks after Phase 1

Features:
- User authentication (email/password or Google OAuth)
- Multiple household support
- Push notifications for urgent tasks
- Task assignment notifications
- User profiles and preferences

### Phase 3: Feature Expansion (Future)
**Timeline**: 8-12 weeks after Phase 2

Features:
- Calendar integration
- Recurring tasks
- Budget tracking
- Recipe management
- Meal planning
- Shopping list templates

---

## Tech Stack

**Frontend**: React 18 + TypeScript + Vite
**Styling**: Tailwind CSS (custom theme)
**Database**: Supabase (PostgreSQL + Realtime)
**State Management**: Zustand + React Query
**Routing**: React Router 6
**Hosting**: Vercel
**Testing**: Vitest + Testing Library

See [TECH_STACK.md](./TECH_STACK.md) for detailed rationale.

---

## User Interface Mockups (Conceptual)

### Dashboard View:
```
┌─────────────────────────────────┐
│         HomeHub 🏠              │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │   🛒 Shopping List      │   │
│  │   3 items remaining     │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │   ✓ Home Tasks          │   │
│  │   2 urgent, 5 soon      │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Shopping List Detail:
```
┌─────────────────────────────────┐
│  ← Shopping List                │
├─────────────────────────────────┤
│  + Add item...                  │
├─────────────────────────────────┤
│  ☐ Milk                         │
│  ☐ Bread                        │
│  ☑ Eggs                    [×]  │
└─────────────────────────────────┘
```

---

## Questions & Decisions

### ✅ Resolved:
1. **Authentication Strategy**: Delayed to Phase 2, use simple household ID sharing for MVP
2. **Offline Strategy**: Optimistic updates with conflict resolution
3. **Hosting**: Vercel (approved)
4. **Tech Stack**: Vite + React + Tailwind + Supabase + Vercel (approved)
5. **Color Palette**: Taupe, Cream, Muted Sage Green (updated from Burgundy)

### ⏳ Pending:
1. **Shopping List Categories**: Should we include pre-defined categories or let users add custom ones?
2. **Task Notes**: Modal or inline editing for task notes?
3. **Completed Items**: Archive immediately or show for X hours first?

---

## Risks & Mitigation

### Risk 1: Real-time Sync Complexity
**Impact**: High
**Mitigation**:
- Use Supabase's proven real-time infrastructure
- Implement optimistic updates for instant UI feedback
- Add conflict resolution for simultaneous edits

### Risk 2: Mobile Performance
**Impact**: Medium
**Mitigation**:
- Code splitting by route
- Lazy load components
- Optimize bundle size (< 200KB gzipped)

### Risk 3: Scope Creep
**Impact**: High (timeline risk)
**Mitigation**:
- Strict adherence to MVP scope
- "Phase 2" list for feature requests
- Regular stakeholder alignment

---

## Appendix

### Design Inspiration:
- Things 3 (task management simplicity)
- Linear (minimalist, fast, beautiful)
- Height (calm colors, smooth animations)

### Technical References:
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [React Query Best Practices](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com)

---

**Document Status**: Approved - Active Development
**Next Review**: Post-MVP Launch


# HomeHub - Product Requirements Document (PRD)

**Document Version**: 1.2
**Last Updated**: 2026-02-10
**Status**: Approved - In Development

---

## Project Overview
**HomeHub** is a shared household management application designed to reduce cognitive load for partners. It provides a clean, minimalist dashboard to organize household responsibilities into digestible chunks.

---

## Design & Style Guidelines
- **Core Philosophy**: Minimalist, calm, and functional.
- **Color Palette**: 
  - **Primary**: Burgundy (#630606) - used for headers, icons, and primary actions.
  - **Secondary**: Taupe (#8E806A).
  - **Background**: Cream/Light Sand.
- **UI Components**: Flat design, minimal cards, and smooth transitions (duration-300).

---

## Feature Module: Shopping List (MVP)

### 1. Grouped View & Organization
- **Categorization**: Items are automatically grouped under bold Burgundy headers.
- **Standard Categories**: Dairy, Meat, Fish, Pantry, Vegetables, Fruit, Cleaning, Pharma & Hygiene.
- **Sorting Logic**: Active items appear at the top of their category; completed (checked) items automatically move to the bottom of the category list.

### 2. MasterList (Pre-defined Items)
- **Concept**: A "bank" of common household items for quick addition.
- **UI**: A sliding Drawer (sliding from left) accessed via a list-icon in the top-left corner.
- **Functionality**:
    - Click an item to add it to the active list.
    - **Edit Mode**: A toggle to add, edit, or delete items and categories within the MasterList.
    - **Bulk Add**: A "Select All" button to add all MasterList items to the active list at once.
- **Persistence**: Saved in localStorage.

### 3. Smart Features
- **Auto-Categorization**: Local logic that suggests a category based on the item name (e.g., "Milk" -> "Dairy"). Defaults to "Pantry".
- **Duplicate Prevention**: Case-insensitive check when adding items.
    - **Confirmation UI**: A popup dialog asking: "<Item> is already in the list. Add it anyway?"
- **Auto-Capitalization**: The first letter of any added item is automatically capitalized.

### 4. Bulk Actions (Active List)
- **Bulk Delete Mode**:
    - Triggered by an "Edit" or "Trash" icon.
    - UI changes from circular checkmarks to selection squares.
    - Features "Delete Selected" and "Cancel" buttons.
- **Clear All**: Option to wipe the active list after a shopping trip.

---

## Tech Stack
1. **Frontend**: React (Vite) + TypeScript.
2. **Styling**: Tailwind CSS.
3. **State Management**: React Hooks + LocalStorage (Current).
4. **Deployment**: Vercel.

---

## Appendix
- **Design Inspiration**: Things 3 (simplicity), Linear (speed).
- **Current Focus**: Perfecting the Shopping List UX before moving to Home Tasks.

**Document Status**: Approved - Active Development


## 🎯 Product Vision: HomeHub
A minimalist, high-efficiency home management app designed to reduce cognitive load through smart automation, intuitive hierarchy, and rapid action.

---

## 🏗️ System Architecture & Hierarchy

### 1. Level 1: Main Dashboard (Parent Hubs)
* **Concept:** High-level categories of home life.
* **Initial Hubs:** `Shopping List`, `Home Tasks` (Coming Soon).
* **Customization:** Users can add new Parent Hubs with custom icons/names.

### 2. Level 2: Sub-Hubs (The Selection Layer)
* **Concept:** Breaking down large categories into focused contexts.
* **Shopping Sub-Hubs:** * `Groceries` (Default)
    * `General Household` (Default - bulbs, batteries, etc.)
    * `Custom Sub-Lists` (User-defined, e.g., "Camping", "Party").

### 3. Level 3: Active List Template (The Engine)
* **Core Logic:** All sub-lists inherit a unified template.
* **Auto-Categorization:** Items are automatically grouped (Dairy, Pantry, etc.) based on a smart keyword engine.
* **Duplicate Prevention:** Alerts user if an item already exists in the active list.

---

## ✨ Key Features & Interactions

### 🚀 Smart Master List (Context-Aware)
* **On List Creation:** When a user names a new sub-list (e.g., "Pharmacy"), the system suggests a "Starter Pack".
* **The "Bubbles" Interface:** Rounded chips appear in the Master List Drawer:
    * `[Suggested Items for "X"]`: Fills the master list with relevant defaults.
    * `[Blank Slate]`: Keeps the list empty for full manual control.
* **Persistence:** Once populated, the Master List for that specific sub-hub is fully editable and saved locally.

### 🛠️ Bulk Actions (Efficiency Tools)
* **Bulk Delete Mode:** Toggle to select multiple items for removal.
* **Select All:** One-click selection of all items within the active list.
* **Clear All:** Deep-clean the list after a shopping trip.

### 🔍 Search & Quick Add
* **Global Master Search:** Search within the Master List Drawer to find and "inject" items into the active list.

---

## 🎨 Design Language (The Vibe)
* **Color Palette:** Deep Burgundy (#630606), Taupe/Cream (#F5F2E7), Soft Grey.
* **Feel:** Tactile, smooth transitions, high contrast for readability, minimal clutter.
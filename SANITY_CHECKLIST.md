# HomeHub — Manual Sanity Checklist

**Version:** Phase 0.2
**Purpose:** Pre-release regression testing across all target devices and hubs.
**Who:** Any tester (developer or non-developer). Follow each step literally.
**How to mark:** Replace `[ ]` with `[x]` when a check passes, or `[F]` when it fails.
Add a brief note after `[F]` items describing the actual behaviour.

---

## Device Coverage Matrix

Run this checklist on **each** of the following devices/environments:

| # | Device / Browser | Screen Size | Notes |
|---|-----------------|-------------|-------|
| 1 | iPhone SE (3rd gen) | 375 × 667 | Smallest supported phone |
| 2 | iPhone 14 / 15 | 390 × 844 | Primary iOS target |
| 3 | Pixel 7 / Android 13+ | 412 × 915 | Primary Android target |
| 4 | iPad (9th gen or later) | 820 × 1180 | Tablet layout |
| 5 | Desktop — Chrome | ≥ 1280 wide | Windowed |
| 6 | Desktop — Firefox | ≥ 1280 wide | Cross-browser parity |

> **Tip:** Use Chrome DevTools Device Toolbar for quick phone/tablet simulation on desktop.

---

## Environment Setup

Before starting:
- [ ] Local dev server is running: `npm run dev`
- [ ] Local Supabase is running: `supabase start`
- [ ] A test household exists with at least one member
- [ ] Test data seeded (or created manually): 1 shopping list, 1 task list, 1 voucher, 1 reservation

---

## 1. Authentication

### 1.1 Sign-In Flow

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Open app while signed out | Auth screen appears immediately (no spinner/delay) | [ ] |
| 2 | Enter valid email + password → tap Sign In | Button shows "Signing in…" briefly, then dashboard loads | [ ] |
| 3 | Enter invalid password → tap Sign In | Button resets to "Sign In", error message appears | [ ] |
| 4 | Leave fields empty → tap Sign In | Browser validation blocks submit (no network call) | [ ] |
| 5 | Sign Up with a new email | Button shows "Creating account…", resets, success message shown | [ ] |
| 6 | Join Household with a code | Button shows "Joining…", resets after response | [ ] |
| 7 | Sign out via Settings | Returned to auth screen; no cached data visible | [ ] |

---

## 2. Shopping Hub

### 2.1 Sub-Hub Navigation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Tap Shopping icon in bottom nav | Shopping Hub section scrolls into view | [ ] |
| 2 | Tap on a shopping sub-hub card | ShoppingList opens for that list | [ ] |
| 3 | Tap ← back button | Returns to hub overview | [ ] |

### 2.2 Active List — Adding Items

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 4 | Type "milk" in Add field → submit | Item "Milk" appears at top of Dairy category (capitalised, auto-categorised) | [ ] |
| 5 | Type "milk" again → submit | "Item Already Exists" modal appears; original count unchanged | [ ] |
| 6 | Confirm the duplicate in modal | Second "Milk" is added (duplicate allowed after confirmation) | [ ] |
| 7 | Cancel duplicate modal | No new item added | [ ] |
| 8 | Tap item text to toggle complete | Item moves to bottom of category with strikethrough | [ ] |
| 9 | Tap completed item again | Item unchecked, moves back to top of category | [ ] |
| 10 | Tap "Clear Completed (N)" button | All completed items removed; active items remain | [ ] |

### 2.3 Master List Drawer

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 11 | Tap the list icon / Master List button | Drawer slides in from the left (LTR) | [ ] |
| 12 | Backdrop tapping closes drawer | Drawer closes | [ ] |
| 13 | Empty master list — see suggestion bubbles | Context bubbles shown (e.g., "Grocery List", "Stock Supplies") based on list name | [ ] |
| 14 | Tap a context bubble | Items from that template are added to master list (no duplicates) | [ ] |
| 15 | Tap "Keep Empty" | Enters edit mode; add input appears | [ ] |
| 16 | Add an item via edit mode | Item appears in master list, grouped by category | [ ] |
| 17 | Tap a master list item | Item added to active list (slides in at top) | [ ] |
| 18 | Tap "Select All" | All master list items added to active list | [ ] |
| 19 | Search for an item in master list | Only matching items shown | [ ] |
| 20 | Search for a non-existent item | "Item not found. Add it?" prompt appears | [ ] |

### 2.4 Auto-Categorisation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 21 | Add "Chicken" | Categorised under Meat | [ ] |
| 22 | Add "Shampoo" | Categorised under Pharma & Hygiene | [ ] |
| 23 | Add "Widget XYZ" | Categorised under Other | [ ] |

---

## 3. Tasks Hub

### 3.1 Sub-Hub Navigation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Tap Tasks icon in bottom nav | Tasks Hub section scrolls into view | [ ] |
| 2 | Tap a task list card | TaskList opens for that list | [ ] |
| 3 | Tap ← back button | Returns to hub overview | [ ] |

### 3.2 Creating Tasks

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 4 | Type task name → tap "Add Task" | Task appears in list with Medium urgency badge (default) | [ ] |
| 5 | Select "High" priority → add task | Task badge is red (High) | [ ] |
| 6 | Select "Low" priority → add task | Task badge is green (Low) | [ ] |
| 7 | Leave name empty → tap "Add Task" | No task added | [ ] |
| 8 | Set a due date → add task | "📅 Due …" chip appears on task card | [ ] |
| 9 | Set an assignee → add task | "👤 Name" chip appears on task card | [ ] |

### 3.3 Managing Tasks

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 10 | Tap the completion square on a task | Task shows strikethrough; opacity reduced | [ ] |
| 11 | Tap completed task again | Task unchecked; strikethrough removed | [ ] |
| 12 | Tap edit (pencil) icon on a task | Inline edit form appears with current values | [ ] |
| 13 | Edit task name + Save | Name updated in list | [ ] |
| 14 | Edit task → Cancel | No changes saved | [ ] |
| 15 | Tap delete (trash) icon on a task | Confirmation modal appears | [ ] |
| 16 | Confirm delete | Task removed from list | [ ] |
| 17 | Cancel delete | Task remains | [ ] |

### 3.4 Bulk Edit Mode

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 18 | Tap the ✎ Edit button (header, tasks ≥ 1) | Bulk edit panel appears; selection circles visible on tasks | [ ] |
| 19 | Tap a task circle to select it | Task highlighted with burgundy border | [ ] |
| 20 | Tap "Select All" | All tasks selected | [ ] |
| 21 | Tap "✓ Check Selected" | Selected tasks marked Completed | [ ] |
| 22 | Tap "Delete Selected" → Confirm | Selected tasks removed | [ ] |
| 23 | Tap "Clear Completed (N)" → Confirm | All completed tasks removed; active remain | [ ] |

### 3.5 Urgent Tasks Aggregation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 24 | Create a High-urgency task in any list | Task appears in Urgent Tasks aggregated view | [ ] |
| 25 | Open Urgent Tasks view | Shows "Aggregated from all task lists" subtitle | [ ] |
| 26 | Tap source sub-hub name on an urgent task | Navigates to that list; task is highlighted (flashlight effect for ~3s) | [ ] |

---

## 4. Vouchers Hub

### 4.1 Sub-Hub Navigation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Tap Vouchers icon in bottom nav | Vouchers Hub section scrolls into view | [ ] |
| 2 | Tap a voucher list card | VoucherList opens (grid view) | [ ] |
| 3 | Tap ← back button | Returns to hub overview | [ ] |

### 4.2 Voucher Cards

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 4 | View a voucher card | Shows: name, issuer, value, expiry | [ ] |
| 5 | Expiry within 7 days | Badge shows red "X days left" | [ ] |
| 6 | Expiry today | Badge shows "Expires Today" (red) | [ ] |
| 7 | Expired voucher | Badge shows "Expired" in red | [ ] |
| 8 | Tap "Copy Code" on a voucher | Code copied to clipboard; "Copied!" shown for 2s | [ ] |
| 9 | Voucher with URL code | "Open Original" link shown instead of Copy | [ ] |
| 10 | Voucher with image → tap image area | Image modal opens full-screen | [ ] |
| 11 | Tap X on image modal | Modal closes | [ ] |

### 4.3 Create / Edit Voucher

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 12 | Tap "+" or Add button | Voucher form opens | [ ] |
| 13 | Voucher list type → form shows: value, issuer, expiry fields | Reservation fields hidden | [ ] |
| 14 | Fill form → Submit | Voucher appears in grid | [ ] |
| 15 | Leave name empty → Submit | Name validation blocks submit | [ ] |
| 16 | Tap edit on an existing voucher | Form pre-fills with current values | [ ] |
| 17 | Edit and save | Card updated in grid | [ ] |
| 18 | Tap delete → Confirm | Voucher removed from grid | [ ] |
| 19 | Upload an image | Image preview shown in form | [ ] |
| 20 | Remove image | Image preview cleared | [ ] |

---

## 5. Reservations Hub

### 5.1 Reservation Cards

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Reservation list type → form shows: event date, time, address fields | Voucher fields hidden | [ ] |
| 2 | View a reservation card | Shows: name, "📅 Reservation" label, event date, address | [ ] |
| 3 | Event date = today | Shows "Today" label | [ ] |
| 4 | Event date = tomorrow | Shows "Tomorrow" label | [ ] |
| 5 | Event date in future | Shows formatted date (e.g., "Mar 15 at 7:30 PM") | [ ] |
| 6 | Reservation with no time | Date shown without time | [ ] |
| 7 | Tap edit → update name → save | Card name updated | [ ] |
| 8 | Multi-select (edit mode) → delete multiple | Selected reservations removed | [ ] |

---

## 6. Settings

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Open Settings screen | Language options visible | [ ] |
| 2 | Tap "English" | UI language set to English (if already English, no change) | [ ] |
| 3 | Tap "עברית" | UI switches to Hebrew; see RTL checklist below | [ ] |
| 4 | Switch back to English | UI returns to LTR English | [ ] |

---

## 7. Cross-Cutting Concerns

### 7.1 Bottom Navigation

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Tap Shopping icon | Shopping Hub highlighted; scrolls into view | [ ] |
| 2 | Tap Tasks icon | Tasks Hub highlighted; scrolls into view | [ ] |
| 3 | Tap Vouchers icon | Vouchers Hub highlighted; scrolls into view | [ ] |
| 4 | Active icon is visually distinct (burgundy) | Correct icon highlighted | [ ] |

### 7.2 Responsive Layout

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Phone portrait (375px) — Shopping list | Items readable; no horizontal overflow | [ ] |
| 2 | Phone portrait — Task list | Urgency badge + task name fit on one line or wrap cleanly | [ ] |
| 3 | Phone portrait — Voucher grid | Cards in 1-column layout; image fits | [ ] |
| 4 | Tablet (820px) — Voucher grid | Cards in 2+ column layout | [ ] |
| 5 | Desktop — Master List Drawer | Drawer width ≤ 384px; does not cover entire screen | [ ] |
| 6 | Keyboard visible (mobile) — add forms | Input not hidden behind keyboard | [ ] |

### 7.3 i18n / RTL (Hebrew Mode)

Switch to Hebrew in Settings before running these checks.

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | `html` element `dir` attribute | `dir="rtl"` visible in DevTools | [ ] |
| 2 | Shopping hub text | Hebrew strings shown; no English strings visible (except brand names) | [ ] |
| 3 | Tasks hub text | Hebrew strings shown | [ ] |
| 4 | Vouchers hub text | Hebrew strings shown | [ ] |
| 5 | Settings screen text | Hebrew strings shown | [ ] |
| 6 | Back button (←) direction | Button still functional; layout mirrored | [ ] |
| 7 | Master List Drawer slide direction | Drawer slides in from RIGHT (correct for RTL) | [ ] |
| 8 | Voucher card — "Remove image" button position | Appears at top-left (top-end in RTL) | [ ] |
| 9 | VouchersHub edit mode — checkboxes | Checkboxes appear at top-left (top-end in RTL) | [ ] |
| 10 | Switch back to English | `dir="ltr"` restored; layout returns to LTR | [ ] |

### 7.4 LTR Regression Check (English)

Run with language = English after RTL testing.

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Shopping list layout | Items left-aligned; no visual anomalies | [ ] |
| 2 | Task list layout | Urgency badges, dates, actions correctly positioned | [ ] |
| 3 | Voucher grid layout | Cards correctly aligned; image at top | [ ] |
| 4 | Master List Drawer | Slides from LEFT (correct for LTR) | [ ] |
| 5 | Modals (delete, duplicate, image) | Centred; buttons left-to-right | [ ] |

### 7.5 Offline / Network Resilience

| # | Check | Expected Result | Pass/Fail |
|---|-------|----------------|-----------|
| 1 | Open app with network disabled | Previously cached data visible; no crash | [ ] |
| 2 | Add item while offline | UI updates locally; queued for sync | [ ] |
| 3 | Restore network | Changes synced to Supabase; no data loss | [ ] |

---

## 8. Visual Regression Snapshots

Take a screenshot at each step and compare against the baseline screenshots in `docs/screenshots/`.

| Screen | LTR Baseline | RTL Baseline |
|--------|-------------|-------------|
| Shopping list (with items, 1 completed) | [ ] matches | [ ] matches |
| Task list (Low + Medium + High tasks) | [ ] matches | [ ] matches |
| Voucher grid (3+ vouchers, 1 expired) | [ ] matches | [ ] matches |
| Master List Drawer (with items) | [ ] matches | [ ] matches |
| Reservation card | [ ] matches | [ ] matches |
| Delete confirmation modal | [ ] matches | N/A |
| Auth screen | [ ] matches | [ ] matches |

> **Note:** Baseline screenshots are captured from the last approved release.
> If no baselines exist yet, capture them now and store in `docs/screenshots/`.

---

## Sign-Off

| Tester | Device | Date | Overall Result |
|--------|--------|------|----------------|
| | | | PASS / FAIL |
| | | | PASS / FAIL |
| | | | PASS / FAIL |

**Release Decision:** [ ] Approved for deployment  / [ ] Blocked — see failing items above

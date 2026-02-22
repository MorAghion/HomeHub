# HomeHub — Technical Execution Plan

## Phase 0 → V2.0 | February 2026

---

## 1. Document Purpose

This document serves as the single source of truth for all development work from the current MVP through V2.0 release. It is designed to be consumed both by the developer (you) and by Claude Code agents executing tasks. Every section includes acceptance criteria, dependencies, and agent-assignable task breakdowns.

---

## 2. Current State Summary

| Dimension | Status |
|-----------|--------|
| Framework | React (Vite) + TypeScript + Tailwind CSS |
| Backend | Supabase (Auth, Postgres DB, Storage) |
| Users | Multi-user with household concept |
| Persistence | localStorage + Supabase (hybrid) |
| Hubs Built | Shopping & Gear, Home Tasks, Vouchers & Reservations |
| Known Issues | Vouchers/Reservations dynamic card rendering is unstable |
| Tests | None |
| i18n | None (English only) |
| Deployment | Web-based, not responsive, no PWA |

---

## 3. Execution Phases Overview

```
Phase 0: Stabilization & Foundation     (Pre-V2)
  ├── 0.1  Vouchers / Bookings Separation
  ├── 0.2  Test Suite (e2e, unit, manual/sanity)
  ├── 0.3  Gmail OAuth Integration
  ├── 0.4  Hebrew Localization (i18n)
  └── 0.5  Responsive + PWA Foundation

Phase 1: V2.0 Feature Development
  ├── 1.1  Bill Management (Gmail ingestion → Tasks Hub)
  ├── 1.2  Shared Calendar & Deadlines Carousel
  ├── 1.3  Push Notifications
  ├── 1.4  WhatsApp Agent (LLM + Function Calling)
  └── 1.5  Native PWA Finalization
```

---

## 4. Dependency Map

```
0.1 Vouchers Refactor ──────────────┐
                                     ├──→ 0.2 Test Suite ──→ ALL V2 work
0.3 Gmail OAuth ────────────────────┤
                                     │
0.4 i18n ───────────────────────────┘
                                     
0.5 Responsive + PWA Foundation ────────→ 1.5 PWA Finalization

0.3 Gmail OAuth ────────────────────────→ 1.1 Bill Management
0.1 Vouchers Refactor ─────────────────→ 1.2 Calendar Carousel (shows voucher expiry)
1.5 PWA (Service Worker) ─────────────→ 1.3 Push Notifications
1.1 Bill Management ───────────────────→ 1.3 Push Notifications (bill alerts)
Supabase backend ──────────────────────→ 1.4 WhatsApp Agent
```

---

## 5. Phase 0 — Detailed Task Breakdown

### 0.1 Vouchers / Bookings Separation

**Goal:** Decouple the polymorphic Voucher/Reservation model into two distinct data models with static card templates, eliminating rendering instability.

**Tasks:**

1. **Data Model Split**
   - Create separate Supabase tables: `vouchers` and `reservations`
   - Voucher fields: `id`, `name`, `value`, `issuer`, `expiry_date`, `code`, `image_url`, `notes`, `household_id`, `created_by`, `created_at`
   - Reservation fields: `id`, `name`, `event_date`, `time`, `address`, `image_url`, `notes`, `household_id`, `created_by`, `created_at`
   - Write migration script from current polymorphic table
   - Add RLS policies for household-level access

2. **Static Card Components**
   - Replace dynamic card renderer with `VoucherCard.tsx` (shows: name, value, issuer, expiry)
   - Create `ReservationCard.tsx` (shows: name, date/time, address)
   - Each card has: photo icon (if image attached), copy/link icon, modal for full details
   - Remove all conditional rendering logic that was causing instability

3. **Sub-Hub Type Assignment**
   - On Sub-Hub creation, user selects type: Voucher or Reservation
   - Default mapping: Ontopo → Reservation, BuyMe → Voucher, etc.
   - Store type on the sub-hub record, not derived at runtime

4. **Form Separation**
   - `CreateVoucherForm.tsx` with fields: name, value, issuer, expiry, code, image, notes
   - `CreateReservationForm.tsx` with fields: name, event date, time, address, image, notes
   - Smart Paste: URL detection routes to correct form type

**Acceptance Criteria:**
- Zero dynamic type-checking in card rendering
- Both card types render correctly in grid view
- Existing data migrated without loss
- Modal detail view works for both types
- Create flow correctly routes to typed form

---

### 0.2 Comprehensive Test Suite

**Goal:** Establish full test coverage before any V2 work begins.

**Architecture:**

| Layer | Tool | Scope |
|-------|------|-------|
| Unit Tests | Vitest | Utility functions, hooks, context logic, categorization engine |
| Component Tests | Vitest + React Testing Library | All card components, forms, modals, bubbles |
| Integration Tests | Vitest + RTL | Hub flows, list management, CRUD operations |
| E2E Tests | Playwright | Full user journeys across all hubs |
| Manual/Sanity | Checklist document | Pre-release regression checklist |

**Tasks:**

1. **Test Infrastructure Setup**
   - Install and configure Vitest, React Testing Library, Playwright
   - Create test utilities: mock Supabase client, mock localStorage, test fixtures
   - Set up CI-compatible test scripts in `package.json`
   - Create `tests/` directory structure mirroring `src/`

2. **Unit Tests (Target: 80%+ coverage on logic)**
   - Context engine: keyword matching, context detection
   - Auto-categorization: item → category mapping
   - Smart Merge: duplicate prevention logic
   - Voucher/Reservation data transformations
   - Utility functions (date formatting, ID generation, etc.)

3. **Component Tests**
   - VoucherCard, ReservationCard render correctly with props
   - BubbleSelector: shows correct suggestions per context
   - MasterList / ActiveList: add, remove, toggle, sort
   - Forms: validation, submission, error states
   - Modals: open, close, confirm actions

4. **E2E Tests (Playwright)**
   - Shopping Hub: create sub-hub → select bubbles → manage master list → activate items → check off
   - Home Tasks: create task → set urgency → verify urgent aggregation → deep-link flashlight
   - Vouchers: create voucher → view in grid → open modal → verify data
   - Reservations: create reservation → view in grid → open modal → verify data
   - Cross-hub: navigate between all hubs, verify data persistence

5. **Manual Sanity Checklist**
   - Create `SANITY_CHECKLIST.md` with device-specific checks
   - Cover: iOS Safari, Android Chrome, Desktop Chrome/Firefox
   - Include visual regression checks for both card types

**Acceptance Criteria:**
- All tests pass in CI
- Unit coverage >80% on business logic
- E2E covers all critical user journeys
- Sanity checklist document created and versioned

---

### 0.3 Gmail OAuth Integration

**Goal:** Replace current independent OAuth with standard Gmail OAuth 2.0, scoped to metadata-only read access.

**Tasks:**

1. **OAuth Flow Implementation**
   - Register app in Google Cloud Console
   - Request scopes: `gmail.readonly` (minimum viable)
   - Implement OAuth 2.0 authorization code flow
   - Store refresh tokens securely in Supabase (encrypted)
   - Build token refresh logic with error handling

2. **Connection UI**
   - Settings screen: "Connect Gmail" button
   - Single-click authorization flow (Google consent screen)
   - Connection status indicator: Connected / Not Connected
   - Disconnect option with confirmation

3. **Email Access Layer**
   - Supabase Edge Function: `gmail-fetch` — fetches email metadata using stored tokens
   - Rate limiting and error handling for Gmail API quotas
   - Abstract email client interface (to support Outlook later)

**Acceptance Criteria:**
- User can connect Gmail with one click
- Tokens stored securely, refresh automatically
- Email metadata accessible via Edge Function
- Connection status visible in Settings
- Disconnect works cleanly

---

### 0.4 Hebrew Localization (i18n)

**Goal:** Full RTL Hebrew language support throughout the application.

**Tasks:**

1. **i18n Framework Setup**
   - Install and configure `react-i18next` + `i18next`
   - Create namespace structure: `common.json`, `shopping.json`, `tasks.json`, `vouchers.json`, `settings.json`
   - Extract all hardcoded strings into translation keys
   - Language toggle in Settings (English / Hebrew)

2. **RTL Layout Support**
   - Add `dir="rtl"` attribute toggling on `<html>` element
   - Audit all Tailwind classes for RTL compatibility (use logical properties: `ms-`, `me-`, `ps-`, `pe-` instead of `ml-`, `mr-`, `pl-`, `pr-`)
   - Fix any absolute positioning that breaks in RTL
   - Test all components in RTL mode

3. **Content Translation**
   - Translate all UI strings to Hebrew
   - Translate context engine keywords and category names
   - Translate bubble labels and starter pack item names
   - Translate all error messages and confirmation dialogs

4. **RTL-Specific Testing**
   - Add RTL variant to E2E test suite
   - Visual check all card layouts, forms, modals in RTL
   - Verify animations work correctly in RTL

**Acceptance Criteria:**
- Language toggle works without page reload
- All UI strings translated
- RTL layout renders correctly across all views
- No hardcoded strings remain in components
- Context engine works with Hebrew keywords

---

### 0.5 Responsive Design + PWA Foundation

**Goal:** Fix responsive issues across devices and lay the PWA groundwork for V2.

**Tasks:**

1. **Responsive Audit & Fix**
   - Test on: iPhone SE, iPhone 14, Pixel 7, iPad, Desktop
   - Fix breakpoints: establish consistent mobile/tablet/desktop breakpoints
   - Fix grid layouts: cards should reflow correctly at all widths
   - Fix touch targets: minimum 44x44px for all interactive elements
   - Fix font scaling: use `clamp()` or responsive typography scale
   - Fix overflow issues: no horizontal scroll on any device

2. **PWA Manifest & Icons**
   - Create `manifest.json` with app name, icons (192px, 512px), theme color (#630606), background color (#F5F2E7)
   - Display mode: `standalone`
   - Add `<link rel="manifest">` and meta tags for iOS
   - Create splash screens for iOS

3. **Service Worker (Basic)**
   - Register service worker via Vite PWA plugin (`vite-plugin-pwa`)
   - Cache strategy: app shell (precache), API calls (network-first)
   - Offline fallback page
   - This is the foundation — full offline + push comes in V2

**Acceptance Criteria:**
- App renders correctly on all target devices
- No horizontal overflow on any screen size
- App installable to home screen (Android + iOS)
- Standalone mode works (no browser chrome)
- Basic offline fallback page shows when disconnected

---

## 6. Phase 1 — V2.0 Feature Development

### 1.1 Bill Management

**Goal:** Automated bill ingestion from Gmail into a dedicated "Bills" list in Home Tasks Hub.

**Depends on:** 0.3 Gmail OAuth

**Architecture:**
```
Gmail API → Supabase Edge Function (scan/extract) → LLM Agent (classify + extract) → Bills list in Tasks Hub
```

**Tasks:**

1. **Initial Scan Engine**
   - Edge Function: `bill-scanner` — performs 90-day retroactive scan
   - LLM analysis of sender patterns and subject lines to identify billing vendors
   - Return: list of detected vendors with sample subjects and confidence scores

2. **Review Screen**
   - Vendor list with Approve/Reject per vendor
   - Sample subject lines per vendor for user confidence
   - "Add Vendor Manually" button
   - Confirmation saves approved vendor list to Supabase

3. **Bill Data Extraction**
   - Edge Function: `bill-extractor` — processes approved vendor emails
   - LLM extracts: amount, due date, billing period, payment link
   - PDF handling: store in Supabase Storage, attach link to task
   - Vision/OCR fallback for complex PDFs
   - Validation: cross-check amounts against vendor history, flag outliers

4. **Deduplication Engine**
   - Composite key: `vendor_name + billing_period`
   - On new email: check existing tasks → update if match, create if new
   - Handle reminder emails gracefully (update, don't duplicate)

5. **Task Card Integration**
   - Bills list in Home Tasks Hub with activation icon ("Smart AI" icon)
   - Opt-in modal: description, disclaimer, authorize button
   - Task cards show: vendor icon, amount, due date inline
   - Quick actions: "Pay Now" (deep link), "View Invoice" (PDF from storage)

**Acceptance Criteria:**
- 90-day scan identifies common Israeli bill vendors (electricity, water, arnona, internet)
- User approves/rejects vendors with full control
- Bill amounts and due dates extracted accurately
- No duplicate tasks from reminder emails
- "Pay Now" deep links to vendor portal
- PDF invoices viewable from task card

---

### 1.2 Shared Calendar & Deadlines Carousel

**Goal:** Top-of-dashboard carousel showing upcoming bills, expiring vouchers, urgent tasks, and personal calendar events.

**Depends on:** 0.1 Vouchers Refactor, 1.1 Bill Management

**Tasks:**

1. **Carousel Component**
   - Horizontal scrollable carousel at top of Home Hub
   - Card types: Bills, Vouchers, Tasks Badge, Personal Calendar
   - Swipeable on mobile, arrow navigation on desktop
   - Visual distinction: "Home" label vs "Personal" label per card

2. **Data Aggregation**
   - Query open bills with upcoming due dates
   - Query vouchers approaching expiry (within 30 days)
   - Count urgent tasks across all sub-hubs
   - Each card links to its source (deep link to relevant hub/item)

3. **Google Calendar Integration (Optional Opt-in)**
   - OAuth connection to Google Calendar API (read-only)
   - Show Today + Tomorrow events only
   - Privacy: personal events rendered locally only, never shared with household
   - Settings: toggle calendar connection on/off

**Acceptance Criteria:**
- Carousel renders at top of Home Hub
- Bills, vouchers, tasks aggregated correctly
- Google Calendar events show for authenticated user only
- "Home" vs "Personal" labels clearly visible
- Cards deep-link to source items

---

### 1.3 Push Notifications

**Goal:** Real-time contextual alerts with privacy-preserving lock screen content.

**Depends on:** 0.5 PWA (Service Worker), 1.1 Bill Management

**Tasks:**

1. **Web Push Infrastructure**
   - Implement Web Push API via service worker
   - Supabase Edge Function: `push-dispatcher` — sends notifications
   - Store push subscriptions per user in Supabase
   - Handle subscription lifecycle (subscribe, unsubscribe, refresh)

2. **Notification Content & Privacy**
   - Lock screen: generic text only ("A new household bill has arrived")
   - In-app: full details (amount, vendor, due date)
   - Quick action buttons: "Pay Now" (bills), "View Tasks" (tasks), "Redeem" (vouchers)

3. **Settings & Controls**
   - Quiet Hours: configurable time window (no notifications delivered)
   - Queue: notifications during quiet hours delivered in batch when window ends
   - Category toggles: Bills, Tasks, Vouchers — independent on/off
   - Daily digest: morning summary at 08:00 (user-configurable)

4. **Notification Triggers**
   - New bill detected → bill notification
   - Task marked urgent → urgent task notification
   - Voucher expiring within 7 days → voucher reminder
   - Daily 08:00 → urgent tasks summary digest

**Acceptance Criteria:**
- Push notifications delivered on Android Chrome and iOS Safari (PWA installed)
- Lock screen shows privacy-safe generic text
- Quick actions deep-link to correct items
- Quiet hours respected, queued notifications delivered after
- Category toggles work independently
- Daily digest fires at configured time

---

### 1.4 WhatsApp Agent

**Goal:** LLM-powered bot in household WhatsApp group that detects intent and manages lists.

**Depends on:** Supabase backend, all hubs stable

**Architecture:**
```
WhatsApp Business API → Webhook → Supabase Edge Function → LLM (Claude API) with Function Calling → HomeHub DB
```

**Tasks:**

1. **WhatsApp Business API Setup**
   - Register WhatsApp Business account
   - Configure webhook endpoint (Supabase Edge Function: `whatsapp-webhook`)
   - Message receiving and sending via API

2. **LLM Agent with Function Calling**
   - Tools: `search_lists()`, `add_item_to_list()`, `create_new_list()`
   - Context: agent scans existing list names before routing
   - Intent classification: grocery item → Shopping Hub, action item → Tasks Hub, voucher/booking → suggest manual upload
   - Ambiguity handling: if >1 matching list, present disambiguation prompt

3. **Confirmation Loop**
   - Stage A: Execute + confirm with [Confirm] / [Cancel] buttons
   - Stage B: On cancel → offer redirect to different list
   - Stage C: Resolve (execute redirect or abandon)

4. **Onboarding Flow**
   - Settings: "Connect Home to WhatsApp" button
   - Deep link to 1-on-1 chat with agent
   - Agent sends welcome + group creation invite link
   - On group creation webhook → celebratory welcome message to all members

5. **Safety & Privacy**
   - Sensitive keyword detection (password, credit card, PIN) → proactive reminder
   - Voice note rejection with friendly message
   - Media acknowledgment without processing
   - Agent personality: 60% friendly / 40% formal

**Acceptance Criteria:**
- Agent responds to text messages in group within 5 seconds
- Correct intent classification for grocery vs task items
- Confirmation loop works end-to-end
- Ambiguity triggers disambiguation prompt
- Onboarding creates group successfully
- Sensitive data detection triggers privacy reminder
- Voice notes and media handled gracefully

---

### 1.5 Native PWA Finalization

**Goal:** Complete the PWA experience with full offline capability, background sync, and platform parity.

**Depends on:** 0.5 PWA Foundation

**Tasks:**

1. **Advanced Service Worker**
   - Full offline support: cached app shell + data
   - Background sync: queue mutations when offline, sync when reconnected
   - Cache versioning and update notifications ("New version available")

2. **Platform Parity**
   - Test and fix iOS Safari PWA quirks (viewport, status bar, gestures)
   - Android: verify all features work in standalone mode
   - Splash screen animations on both platforms

3. **Performance Optimization**
   - Code splitting by hub (lazy load Shopping, Tasks, Vouchers)
   - Image optimization (WebP, lazy loading, Supabase image transforms)
   - Target: Lighthouse PWA score >90, Performance score >85

**Acceptance Criteria:**
- App works fully offline (read mode at minimum)
- Background sync queues and replays mutations
- Lighthouse PWA >90, Performance >85
- iOS and Android feature parity
- Update notification prompts user to refresh

---

## 7. Multi-Agent Workflow Guide

This section teaches you how to use multiple Claude Code agents to parallelize development.

### 7.1 Concept

Instead of one Claude Code session doing everything sequentially, you create specialized agents with focused responsibilities. Each agent gets its own context and instructions via a `CLAUDE.md` file and task-specific prompts.

### 7.2 Recommended Agent Structure for HomeHub

| Agent Role | Responsibility | Works On |
|------------|---------------|----------|
| **Architect** | Schema changes, data model, migrations, Edge Functions | Supabase, `src/lib/`, `supabase/` |
| **Frontend** | Components, pages, styling, responsive, animations | `src/components/`, `src/pages/` |
| **Integration** | OAuth, APIs, WhatsApp, Gmail, Google Calendar | `src/lib/api/`, `supabase/functions/` |
| **QA** | Tests, coverage, sanity checklist, bug verification | `tests/`, `e2e/` |

### 7.3 How to Use Multi-Agent in Practice

**Step 1: Create a CLAUDE.md in your repo root**

This file gives every agent shared context about the project. See Section 8 for the full template.

**Step 2: Create task files per agent**

For each task, create a markdown file that the agent reads first:

```
/tasks/
  0.1-vouchers-refactor.md
  0.2-test-suite.md
  0.3-gmail-oauth.md
  ...
```

Each task file contains: goal, specific files to touch, acceptance criteria, and constraints.

**Step 3: Run agents in parallel (where dependencies allow)**

```bash
# Terminal 1 — Architect agent
claude-code "Read /tasks/0.1-vouchers-refactor.md and execute the data model split"

# Terminal 2 — QA agent  
claude-code "Read /tasks/0.2-test-suite.md and set up the test infrastructure"

# Terminal 3 — Frontend agent
claude-code "Read /tasks/0.5-responsive-fix.md and audit all breakpoints"
```

**Step 4: Merge and verify**

After each agent completes, review changes, run the full test suite, and merge.

### 7.4 Parallelization Map

```
PARALLEL GROUP A (can run simultaneously):
  - 0.1 Vouchers Refactor (Architect + Frontend)
  - 0.4 i18n Setup (Frontend)
  - 0.5 Responsive Audit (Frontend)

SEQUENTIAL (must wait):
  - 0.2 Test Suite → after 0.1 completes
  - 0.3 Gmail OAuth → can start anytime but blocks 1.1

PARALLEL GROUP B (V2, after Phase 0):
  - 1.1 Bill Management (Architect + Integration)
  - 1.2 Calendar Carousel (Frontend)
  - 1.5 PWA Finalization (Frontend)

SEQUENTIAL (V2):
  - 1.3 Push Notifications → after 1.1 + 1.5
  - 1.4 WhatsApp Agent → after all hubs stable
```

---

## 8. CLAUDE.md Template

Place this file in your repository root. Every Claude Code agent reads it automatically.

```markdown
# CLAUDE.md — HomeHub Project Context

## Project Overview
HomeHub is a shared household management PWA built with React (Vite) + TypeScript + Tailwind CSS, backed by Supabase (Auth, Postgres, Storage, Edge Functions).

## Architecture
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions)
- **State:** Supabase for persistent data, localStorage for offline cache
- **Styling:** Tailwind with custom palette — Primary: #630606 (Burgundy), Background: #F5F2E7 (Cream)

## Hierarchy
- Hub (domain) → Sub-Hub (specific list) → Master List (template) + Active List (session)
- Context engine maps Sub-Hub names to starter packs via keyword matching

## Key Directories
- src/components/ — Reusable UI components
- src/pages/ — Route-level page components
- src/lib/ — Business logic, utilities, Supabase client
- src/hooks/ — Custom React hooks
- src/i18n/ — Translation files (en/, he/)
- supabase/functions/ — Edge Functions
- supabase/migrations/ — Database migrations
- tests/ — Unit and component tests (Vitest)
- e2e/ — End-to-end tests (Playwright)

## Conventions
- All components are functional with hooks
- Use TypeScript strict mode
- Tailwind for all styling (no CSS files)
- RTL support: use logical properties (ms-, me-, ps-, pe-) not directional (ml-, mr-)
- All user-facing strings go through i18n (react-i18next)
- Supabase RLS policies enforce household-level access

## Data Models
- Vouchers: id, name, value, issuer, expiry_date, code, image_url, notes, household_id
- Reservations: id, name, event_date, time, address, image_url, notes, household_id
- Bills: id, vendor_name, amount, due_date, billing_period, payment_link, pdf_url, status, household_id
- Tasks: id, title, description, urgency, status, assignee_id, sub_hub_id, household_id

## Testing
- Unit/Component: Vitest + React Testing Library
- E2E: Playwright
- Run: npm test (unit), npm run test:e2e (playwright)

## DO NOT
- Do not use inline styles
- Do not hardcode strings (use i18n keys)
- Do not use ml-/mr-/pl-/pr- (use ms-/me-/ps-/pe- for RTL)
- Do not store sensitive tokens in localStorage
- Do not skip TypeScript types (no `any`)
```

---

## 9. Milestone Timeline (Suggested)

| Milestone | Tasks | Est. Duration | Gate |
|-----------|-------|---------------|------|
| M0: Stabilize | 0.1 Vouchers + 0.5 Responsive | 1-2 weeks | Cards render correctly on all devices |
| M1: Test & i18n | 0.2 Tests + 0.4 Hebrew | 1-2 weeks | All tests green, Hebrew works |
| M2: Gmail | 0.3 Gmail OAuth | 1 week | Gmail connected, emails accessible |
| M3: Bills | 1.1 Bill Management | 2-3 weeks | Bills auto-extracted and displayed |
| M4: Calendar + PWA | 1.2 Carousel + 1.5 PWA | 2 weeks | Carousel live, app installable |
| M5: Notifications | 1.3 Push Notifications | 1-2 weeks | Notifications delivered on all platforms |
| M6: WhatsApp | 1.4 WhatsApp Agent | 2-3 weeks | Agent responds in group, manages lists |

**Total estimated: 10-15 weeks**

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gmail API quota limits | Bill scanning throttled | Batch scans during off-peak, cache results |
| WhatsApp Business API cost/approval | Agent launch delayed | Start with sandbox/test number, apply early |
| iOS PWA push notification limitations | Notifications not delivered on iOS | Verify iOS 16.4+ support, fallback to in-app |
| LLM extraction accuracy for Hebrew bills | Wrong amounts extracted | Vendor-specific validation + human review flag |
| Multi-agent merge conflicts | Code breakage | Clear file ownership per agent, frequent merges |
| Scope creep from V2 features | Timeline slips | Strict acceptance criteria per milestone |

---

*Document generated: February 2026*
*For use with Claude Code multi-agent workflow*

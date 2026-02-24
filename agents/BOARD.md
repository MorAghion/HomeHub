# 📋 HomeHub Agent Board

**Last updated:** 2026-02-24 20:00 UTC
**Current Phase:** 0.x Bug Wave — fe-bug-015 fixed (PR open), qa-009 CI pipeline added


---

## 🌊 Wave Tracker

| Wave | Tasks | Agents | Status | Started | Completed | Notes |
|------|-------|--------|--------|---------|-----------|-------|
| Wave 1 | arch-001, qa-001, fe-007 | 🏗️🧪🎨 | ✅ Done | 2026-02-22 14:00 | 2026-02-22 16:45 | All parallel, 3 critical foundations |
| Wave 2 | fe-001 → fe-002 → fe-003, arch-002, fe-005, fe-005-bug-001 | 🎨🏗️ | ✅ Done | 2026-02-22 17:00 | 2026-02-22 20:00 | FE sequential + Arch parallel + i18n + bug fix |
| Wave 3b | fe-bug-001, fe-bug-002, qa-002 | 🎨🧪 | ✅ Done | 2026-02-22 21:30 | 2026-02-22 22:30 | Both bugs validated + 87 tests passing |

| Wave 3c | qa-003, qa-004, qa-006 | 🧪 | ✅ Done | 2026-02-23 00:00 | 2026-02-23 01:00 | 112 new unit tests + SANITY_CHECKLIST.md |
| Wave 3d | fe-006, fe-006-cont, qa-005 | 🎨🧪 | ✅ Done | 2026-02-23 10:00 | 2026-02-23 11:45 | Hebrew RTL, context mapping, 35 E2E tests |
| Wave 4 | fe-bug-003/004/005/006 | 🎨 | ✅ Done | 2026-02-23 12:00 | 2026-02-23 13:00 | Count flash, carousel, hub split, add-list modal |
| Wave 5 | fe-bug-008/009/010/011/012 + QA regression tests | 🎨🧪 | ✅ Done | 2026-02-23 13:00 | 2026-02-23 15:00 | Merged PR #11 |
| Wave 6 | fe-bug-013/014/015 | 🎨 | ⏳ PR Open | 2026-02-23 15:00 | — | 013/014 PR open, 015 PR open |
| Wave 7 | qa-007, qa-008, qa-009, be-002 | 🧪⚙️ | ⏳ Queued | — | — | After Wave 6 merges |


---

## 📊 Phase Progress Bars

```
Phase 0.1 ██████████100%  (5/5 tasks done)   arch-001 ✅ | fe-001 ✅ | fe-002 ✅ | fe-003 ✅ | qa-001 ✅
Phase 0.2 ██████████100%  (6/6 tasks done)   qa-002 ✅ | qa-003 ✅ | qa-004 ✅ | qa-005 ✅ | qa-006 ✅
Phase 0.3 ████░░░░░░  33%  (1/3 tasks done)  arch-002 ✅ | be-001 🔒 | fe-004 🔒
Phase 0.4 ██████████100%  (3/3 tasks done)   fe-005 ✅ | fe-006 ✅ | fe-006-cont ✅
Phase 0.5 █████░░░░░  50%  (1/2 tasks done)  fe-007 ✅ | be-002 ⏳
Phase 0.6 ██░░░░░░░░  25%  (1/4 tasks done)  qa-007 ⏳ | qa-008 ⏳ | qa-009 ⏳ | be-002 ⏳
```

---

## 🚨 Human Action Queue

| Action | From Agent | Urgency | Status |
|--------|-----------|---------|--------|
| `supabase db push` — apply vouchers/reservations schema migration | 🏗️ arch-001 | 🔴 Blocking | ✅ Done |
| Run `supabase/15-oauth-tokens.sql` in SQL Editor | 🏗️ arch-002 | 🔴 Blocking | ✅ Done |

| Review + merge `agent/qa-003-004-006-unit-tests` → master | 🧪 QA | 🟡 Pending | ✅ Merged |
| Review + merge `agent/qa-005-e2e-suite` → master | 🧪 QA | 🟡 Pending | ✅ Merged (PR #6) |
| Merge Wave 5 PR #11 → master | 🎨🧪 | 🔴 Blocking | ✅ Merged |
| **Run `supabase/16-restore-voucher-schema.sql` in SQL Editor** | 🎨 fe-bug-010 | 🔴 Blocking | ⏳ Still pending |
| **Merge `agent/fe-bug-013-014-reservations-hub` → master** | 🎨 Wave 6 | 🔴 High | ⏳ PR open — change base to master before merging |
| **Merge `agent/fe-bug-015-signin-debug` → master** | 🎨 Wave 6 | 🔴 Critical | ⏳ PR open — change base to master before merging |


---

## 🖥️ Active Agents

| Terminal | Agent | Task | Notes |
|----------|-------|------|-------|
| — | — | Wave 6 ready after PR merge | qa-007 (RTL), qa-008 (test errors), be-002 (PWA), QA run Wave 5 regression tests |
| — | — | Wave 7 ready after Wave 6 PRs merge | qa-007 (RTL), qa-008 (test errors), qa-009 (CI pipeline), be-002 (PWA) |


---

## 🚦 Phase 0.1 — Vouchers / Bookings Separation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-001: Vouchers schema split | 🏗️ Architect | ✅ done | — | fe-001, fe-002, fe-003, qa-002 |
| fe-001: VoucherCard component | 🎨 Frontend | ✅ done | arch-001 | qa-002 |
| fe-002: ReservationCard component | 🎨 Frontend | ✅ done | fe-001 | qa-002 |
| fe-003: Create forms separation | 🎨 Frontend | ✅ done | fe-002 | qa-002 |
| qa-001: Test infrastructure setup | 🧪 QA | ✅ done | — | qa-002, qa-003, qa-004, qa-005 |

## 🚦 Phase 0.2 — Test Suite

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| qa-002: Voucher/Reservation tests | 🧪 QA | ✅ done | fe-001, fe-002, fe-003, qa-001 | — |
| qa-003: Shopping Hub tests | 🧪 QA | ✅ done | qa-001 | — |
| qa-004: Home Tasks tests | 🧪 QA | ✅ done | qa-001 | — |
| qa-005: E2E test suite | 🧪 QA | ✅ done | qa-001 | — |
| qa-006: Sanity checklist | 🧪 QA | ✅ done | — | — |

## 🚦 Phase 0.3 — Gmail OAuth

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-002: OAuth tokens schema | 🏗️ Architect | ✅ done | — | be-001 |
| be-001: Gmail OAuth flow | ⚙️ Backend | 🔒 blocked | arch-002 | fe-004 |
| fe-004: Gmail settings UI | 🎨 Frontend | 🔒 blocked | be-001 | — |

## 🚦 Phase 0.4 — Hebrew Localization

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-005: i18n framework setup | 🎨 Frontend | ✅ done | — | fe-006 |
| fe-006: RTL layout + translations | 🎨 Frontend | ✅ done | fe-005 | qa-007 |
| fe-006-cont: Hebrew context mapping + settings i18n | 🎨 Frontend | ✅ done | fe-006 | qa-007 |
| qa-007: RTL testing | 🧪 QA | 🟢 unblocked | fe-006, fe-006-cont | — |

## 🚦 Phase 0.5 — Responsive + PWA Foundation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-007: Responsive audit + fix | 🎨 Frontend | ✅ done | — | — |
| be-002: PWA manifest + service worker | ⚙️ Backend | ⏳ todo | — | — |

## 🚦 Phase 0.6 — CI + Test Maintenance

| Task | Agent | Status | Notes |
|------|-------|--------|-------|
| qa-008: Scan + fix test suite errors | 🧪 QA | ⏳ todo | Run after Wave 5 merge |
| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| qa-007: RTL + Hebrew validation | 🧪 QA | ⏳ todo | fe-006-cont ✅ | — |
| qa-008: Scan + fix test suite errors | 🧪 QA | ⏳ todo | Wave 6 merge | — |
| qa-009: GitHub Actions CI pipeline | 🧪 QA | ⏳ todo | — | — |

---

## 📬 Open Handoffs

| From | To | Message | Urgency |
|------|----|---------|---------|
| 🎨 fe-006-cont | 🧪 qa-007 | Hebrew context mapping + RTL layout complete. Test RTL direction, Hebrew sub-hub context detection, settings page translations, LTR regression. | 🟡 Ready |
| 🎨 FE (Wave 5) | 🧪 QA | fe-bug-008/009/010/011/012 fixed. Modal split, hub edit mode aligned. QA regression tests written. Awaiting execution. | 🟡 Ready |

## ❓ Open Questions
None.

## 🔥 Blocked Items

| Task | Blocked By | Notes |
|------|-----------|-------|
| be-001 | arch-002 ✅ | Can now proceed |
| fe-004 | be-001 | — |
| qa-008 | Wave 6 merge | Run after latest FE changes are in master |

## 🐛 Active Bugs

| Bug | Title | Priority | Agent | Status |
|-----|-------|----------|-------|--------|
| fe-bug-008 | Carousel not lighting up after login | 🔴 High | 🎨 Frontend | review |
| fe-bug-009 | Master lists deletable in Vouchers hub | 🔴 High | 🎨 Frontend | review |
| fe-bug-010 | Add new list click does nothing | 🔴 Critical | 🎨 Frontend | review |
| fe-bug-011 | Edit mode buttons uneven size/spacing | 🟡 Medium | 🎨 Frontend | review |
| fe-bug-012 | Confirmation modals not centered | 🟡 Medium | 🎨 Frontend | review |
| fe-bug-013 | ReservationsHub shows wrong empty state after modal close | 🔴 High | 🎨 Frontend | review |
| fe-bug-014 | ReservationsHub doesn't update after list creation | 🔴 Critical | 🎨 Frontend | review |
| fe-bug-015 | Sign-in stuck on dev (3rd recurrence) | 🔴 Critical | 🎨 Frontend | review |

---

## ✅ Completed Log

| Task | Agent | Completed | Wave | Notes |
|------|-------|-----------|------|-------|
| fe-007 | 🎨 Frontend | 2026-02-22 16:45 | Wave 1 | Responsive audit: fixed 8 issues, zero horizontal scroll |
| qa-001 | 🧪 QA | 2026-02-22 16:45 | Wave 1 | Test infra: Vitest + Playwright, 12 mock factories, smoke tests passing |
| arch-001 | 🏗️ Architect | 2026-02-22 16:45 | Wave 1 | Schema split: vouchers + reservations tables, RLS, TS types exported |
| fe-001 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | VoucherCard component with full CRUD, image support, expiry display |
| fe-002 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | ReservationCard component with event date, address, detail modal |
| fe-003 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | Create forms separated: CreateVoucherForm + CreateReservationForm |
| arch-002 | 🏗️ Architect | 2026-02-22 20:00 | Wave 2 | OAuth tokens schema: table, RLS, 4 indexes, verified in Supabase |
| fe-005 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | i18n framework: i18next + react-i18next, en/he translations, language toggle |
| fe-005-bug-001 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | Fixed sign-in stuck: removed blocking fetchProfile from signIn/signUp |
| fe-bug-002 | 🎨 Frontend | 2026-02-22 21:30 | Wave 3b | Critical: sign-in button unresponsive — premature setLoading(false) fix |
| fe-bug-001 | 🎨🧪 | 2026-02-22 22:30 | Wave 3b | Perf validated: bundle 224KB→140KB, lazy chunks confirmed |
| qa-002 | 🧪 QA | 2026-02-22 22:30 | Wave 3b | 87 tests: VoucherCard, ReservationCard, forms, integration flow |
| qa-003 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | 64 tests: context engine, auto-categorize, smart-merge, shopping + integration |
| qa-004 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | 30 tests: TaskCard, CreateTaskForm, UrgentTasks, tasks integration flow |
| qa-006 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | SANITY_CHECKLIST.md: 116 manual checks, 6-device matrix, RTL/LTR/offline |
| fe-006 | 🎨 Frontend | 2026-02-23 10:00 | Wave 3d | RTL layout + Hebrew translations, logical Tailwind classes throughout |
| fe-006-cont | 🎨 Frontend | 2026-02-23 10:30 | Wave 3d | Hebrew context mapping (12 contexts), settings i18n (20+ strings), contextResolver.ts |
| qa-005 | 🧪 QA | 2026-02-23 11:45 | Wave 3d | 35 E2E tests: all hubs + settings + navigation, mobile Chrome project, auth setup |
| fe-bug-003 | 🎨 Frontend | 2026-02-23 13:00 | Wave 4 | Active list count flash: show '—' while loading |
| fe-bug-004 | 🎨 Frontend | 2026-02-23 13:00 | Wave 4 | Carousel activation: added `user` to IntersectionObserver deps |
| fe-bug-005 | 🎨 Frontend | 2026-02-23 13:00 | Wave 4 | Hub split: new ReservationsHub.tsx, 4th nav button, filtered lists |
| fe-bug-006 | 🎨 Frontend | 2026-02-23 13:00 | Wave 4 | Add list modal: async create, modal closes only on success |
| fe-bug-007 | 👤 Human | 2026-02-23 13:30 | — | Sign-in stuck regression — fixed directly by human |
| fe-bug-008–012 | 🎨 Frontend | 2026-02-23 15:00 | Wave 5 | Carousel, master list delete, add-list flow, edit toolbar, modal centering |

---

## 📐 Board Management Rules (Coordinator Only)

The Coordinator NEVER writes application code. The Coordinator NEVER executes tasks from other agents. The Coordinator ONLY reads/writes files in `agents/`. If asked to "continue" or "start" a wave, respond with the commands the human should run — do NOT execute the tasks yourself.

### Section Order (required)
1. Wave Tracker
2. Phase Progress Bars
3. Human Action Queue
4. Active Agents
5. Task Board (phase tables)
6. Open Handoffs / Questions / Blockers
7. Completed Log

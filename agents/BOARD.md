# 📋 HomeHub Agent Board
**Last updated:** 2026-02-23 12:30 UTC
**Current Phase:** Sanity bugs in progress → Wave 5 queued

---

## 🌊 Wave Tracker

| Wave | Tasks | Agents | Status | Started | Completed | Notes |
|------|-------|--------|--------|---------|-----------|-------|
| Wave 1 | arch-001, qa-001, fe-007 | 🏗️🧪🎨 | ✅ Done | 2026-02-22 14:00 | 2026-02-22 16:45 | 3 critical foundations |
| Wave 2 | fe-001, fe-002, fe-003, arch-002, fe-005, fe-005-bug-001 | 🎨🏗️ | ✅ Done | 2026-02-22 17:00 | 2026-02-22 20:00 | FE components + i18n + bug fix |
| Wave 3b | fe-bug-001, fe-bug-002, qa-002 | 🎨🧪 | ✅ Done | 2026-02-22 21:30 | 2026-02-22 22:30 | Bugs validated + 87 tests |
| Wave 3c | qa-003, qa-004, qa-006 | 🧪 | ✅ Done | 2026-02-23 00:00 | 2026-02-23 01:00 | 112 unit tests + SANITY_CHECKLIST.md |
| Wave 3d | fe-006, fe-006-cont, qa-005 | 🎨🧪 | ✅ Done | 2026-02-23 10:00 | 2026-02-23 11:45 | Hebrew RTL + context mapping + 35 E2E tests |
| Wave 4 | fe-bug-003, fe-bug-004, fe-bug-005, fe-bug-006 | 🎨 | 🔄 In Progress | 2026-02-23 12:00 | — | Sanity bugs — FE WIP on branch |
| Wave 5 | qa-007, qa-008, be-002 | 🧪⚙️ | ⏳ Queued | — | — | RTL testing, test error scan, PWA |

---

## 📊 Phase Progress Bars

```
Phase 0.1 ██████████100%  (5/5)   arch-001 ✅ | fe-001 ✅ | fe-002 ✅ | fe-003 ✅ | qa-001 ✅
Phase 0.2 ██████████100%  (6/6)   qa-001 ✅ | qa-002 ✅ | qa-003 ✅ | qa-004 ✅ | qa-005 ✅ | qa-006 ✅
Phase 0.3 ████░░░░░░  33%  (1/3)  arch-002 ✅ | be-001 🔒 | fe-004 🔒
Phase 0.4 ██████████100%  (4/4)   fe-005 ✅ | fe-006 ✅ | fe-006-cont ✅ | qa-007 ⏳ (unblocked)
Phase 0.5 █████░░░░░  50%  (1/2)  fe-007 ✅ | be-002 ⏳
```

---

## 🚨 Human Action Queue

| Action | From Agent | Urgency | Status |
|--------|-----------|---------|--------|
| `supabase db push` — vouchers/reservations migration | 🏗️ arch-001 | 🔴 | ✅ Done |
| Run `supabase/15-oauth-tokens.sql` in SQL Editor | 🏗️ arch-002 | 🔴 | ✅ Done |
| Review + merge `agent/fe-bug-003-004-005-006` → master | 🎨 Frontend | 🔴 Critical | ⏳ Awaiting FE completion |
| Sync master ← main after FE PR merged | 🎯 Coordinator | 🟡 | ⏳ After FE PR |

---

## 🖥️ Active Agents

| Terminal | Agent | Task | Notes |
|----------|-------|------|-------|
| — | 🎨 Frontend | fe-bug-003/004/005/006 | Branch: agent/fe-bug-003-004-005-006 — WIP |

---

## 🚦 Phase 0.1 — Vouchers / Bookings Separation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-001: Vouchers schema split | 🏗️ Architect | ✅ done | — | — |
| fe-001: VoucherCard component | 🎨 Frontend | ✅ done | arch-001 | — |
| fe-002: ReservationCard component | 🎨 Frontend | ✅ done | fe-001 | — |
| fe-003: Create forms separation | 🎨 Frontend | ✅ done | fe-002 | — |
| qa-001: Test infrastructure setup | 🧪 QA | ✅ done | — | — |

## 🚦 Phase 0.2 — Test Suite

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| qa-002: Voucher/Reservation tests | 🧪 QA | ✅ done | — | — |
| qa-003: Shopping Hub tests | 🧪 QA | ✅ done | — | — |
| qa-004: Home Tasks tests | 🧪 QA | ✅ done | — | — |
| qa-005: E2E test suite | 🧪 QA | ✅ done | — | — |
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
| fe-008: Full Hebrew translation audit | 🎨 Frontend | ⏳ backlog | fe-006-cont | — |

## 🚦 Phase 0.5 — Responsive + PWA Foundation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-007: Responsive audit + fix | 🎨 Frontend | ✅ done | — | — |
| be-002: PWA manifest + service worker | ⚙️ Backend | ⏳ todo | — | — |

## 🚦 Sanity Bugs — Wave 4

| Task | Agent | Status | Priority | Notes |
|------|-------|--------|----------|-------|
| fe-bug-003: Active list count flashes 0 on login | 🎨 Frontend | 🔄 in progress | medium | Show skeleton not 0 |
| fe-bug-004: Carousel doesn't light up until refresh | 🎨 Frontend | 🔄 in progress | high | useEffect dependency issue |
| fe-bug-005: Vouchers + Reservations not split into 2 hubs | 🎨 Frontend | 🔄 in progress | high | Dashboard routing |
| fe-bug-006: Add voucher/reservation list broken | 🎨 Frontend | 🔄 in progress | critical | onClick silently fails |

## 🚦 Backlog

| Task | Agent | Status | Notes |
|------|-------|--------|-------|
| qa-008: Scan + fix test suite errors | 🧪 QA | ⏳ todo | Run after fe-bug wave merged |
| fe-008: Full Hebrew translation audit | 🎨 Frontend | ⏳ backlog | After bug fixes done |

---

## 📬 Open Handoffs

| From | To | Message | Urgency |
|------|----|---------|---------|
| 🎨 fe-006-cont | 🧪 qa-007 | Hebrew context mapping + RTL complete. Test RTL, Hebrew context detection, settings translations, LTR regression. | 🟡 Ready |

## ❓ Open Questions
None.

## 🔥 Blocked Items

| Task | Blocked By | Notes |
|------|-----------|-------|
| be-001 | — | arch-002 done — be-001 can now start |
| fe-004 | be-001 | — |

## 🐛 Active Bugs

| Bug | Priority | Status |
|-----|----------|--------|
| fe-bug-006 — Add list broken (Ontopo/BuyMe click does nothing) | 🔴 critical | 🔄 FE in progress |
| fe-bug-005 — Vouchers/Reservations not split into 2 hubs | 🟠 high | 🔄 FE in progress |
| fe-bug-004 — Carousel doesn't light up until refresh | 🟠 high | 🔄 FE in progress |
| fe-bug-003 — Active list count flashes 0 on login | 🟡 medium | 🔄 FE in progress |

---

## ✅ Completed Log

| Task | Agent | Completed | Wave | Notes |
|------|-------|-----------|------|-------|
| fe-007 | 🎨 Frontend | 2026-02-22 16:45 | Wave 1 | Responsive: fixed 8 issues, zero horizontal scroll |
| qa-001 | 🧪 QA | 2026-02-22 16:45 | Wave 1 | Test infra: Vitest + Playwright, 12 mock factories |
| arch-001 | 🏗️ Architect | 2026-02-22 16:45 | Wave 1 | Schema split: vouchers + reservations, RLS |
| fe-001 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | VoucherCard with CRUD, image, expiry |
| fe-002 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | ReservationCard with date, address, modal |
| fe-003 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | Create forms separated |
| arch-002 | 🏗️ Architect | 2026-02-22 20:00 | Wave 2 | OAuth tokens schema, RLS, 4 indexes |
| fe-005 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | i18n framework: en/he, language toggle |
| fe-005-bug-001 | 🎨 Frontend | 2026-02-22 20:00 | Wave 2 | Sign-in stuck fix |
| fe-bug-002 | 🎨🧪 | 2026-02-22 22:30 | Wave 3b | Sign-in button unresponsive — fixed + validated |
| fe-bug-001 | 🎨🧪 | 2026-02-22 22:30 | Wave 3b | Bundle 224KB→140KB — fixed + validated |
| qa-002 | 🧪 QA | 2026-02-22 22:30 | Wave 3b | 87 tests: vouchers, reservations, forms |
| qa-003 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | 64 tests: context engine, shopping components |
| qa-004 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | 30 tests: TaskCard, forms, urgent aggregation |
| qa-006 | 🧪 QA | 2026-02-23 01:00 | Wave 3c | SANITY_CHECKLIST.md: 116 checks, 6-device matrix |
| fe-006 | 🎨 Frontend | 2026-02-23 10:00 | Wave 3d | RTL layout + Hebrew translations, logical Tailwind |
| fe-006-cont | 🎨 Frontend | 2026-02-23 10:30 | Wave 3d | Hebrew context mapping (12 contexts), contextResolver.ts |
| qa-005 | 🧪 QA | 2026-02-23 11:45 | Wave 3d | 35 E2E tests: all hubs + settings + navigation |

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

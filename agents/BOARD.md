# 📋 HomeHub Agent Board
**Last updated:** 2026-02-22 17:00 UTC
**Current Phase:** 0.1 — Vouchers / Bookings Separation → Wave 2 launching

---

## 🌊 Wave Tracker

| Wave | Tasks | Agents | Status | Started | Completed | Notes |
|------|-------|--------|--------|---------|-----------|-------|
| Wave 1 | arch-001, qa-001, fe-007 | 🏗️🧪🎨 | ✅ Done | 2026-02-22 14:00 | 2026-02-22 16:45 | All parallel, 3 critical foundations |
| Wave 2 | fe-001 → fe-002 → fe-003, arch-002 | 🎨🏗️ Frontend + Architect | 🔄 Active | 2026-02-22 17:00 | — | FE sequential + Arch parallel |
| Wave 3 | qa-002 | 🧪 QA | ⏳ Queued | — | — | QA validates Wave 2 FE output |

---

## 📊 Phase Progress Bars

```
Phase 0.1 ██░░░░░░░░ 40%  (2/5 tasks done)   arch-001 ✅ | fe-001 ⏳ | fe-002 ⏳ | fe-003 ⏳ | qa-001 ✅
Phase 0.2 ██░░░░░░░░ 20%  (1/5 tasks done)   qa-001 ✅ | qa-002 🔒 | qa-003 ⏳ | qa-004 ⏳ | qa-005 ⏳ | qa-006 ⏳
Phase 0.3 ░░░░░░░░░░  0%  (0/3 tasks done)   arch-002 ⏳ | be-001 🔒 | fe-004 🔒
Phase 0.4 ░░░░░░░░░░  0%  (0/3 tasks done)   fe-005 ⏳ | fe-006 🔒 | qa-007 🔒
Phase 0.5 █████░░░░░ 50%  (1/2 tasks done)   fe-007 ✅ | be-002 ⏳
```

---

## 🚨 Human Action Queue

| Action | From Agent | Urgency | Status |
|--------|-----------|---------|--------|
| `supabase db push` — apply vouchers/reservations schema migration | 🏗️ arch-001 | 🔴 Blocking (FE cannot query new tables until applied) | ✅ Done (applied via SQL Editor) |
| Run `supabase/15-oauth-tokens.sql` in SQL Editor, then return verification query output to Architect | 🏗️ arch-002 | 🔴 Blocking | ✅ Done — table_exists=1, rls_enabled=true, index_count=4, policy_count=4, unique_constraint=1 |

---

## 🖥️ Active Agents

| Terminal | Agent | Task | Started | Notes |
|----------|-------|------|---------|-------|
| T1 | 🎨 Frontend | fe-001 → fe-002 → fe-003 (sequential) | 17:00 | Must read arch-001 handoff first |
| T2 | 🏗️ Architect | arch-002 (parallel) | 17:00 | No dependencies, unblocks be-001 |

---

## 🚦 Phase 0.1 — Vouchers / Bookings Separation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-001: Vouchers schema split | 🏗️ Architect | ✅ done | — | fe-001, fe-002, fe-003, qa-002 |
| fe-001: VoucherCard component | 🎨 Frontend | 🔄 in progress | arch-001 | qa-002 |
| fe-002: ReservationCard component | 🎨 Frontend | ⏳ todo | fe-001 | qa-002 |
| fe-003: Create forms separation | 🎨 Frontend | ⏳ todo | fe-002 | qa-002 |
| qa-001: Test infrastructure setup | 🧪 QA | ✅ done | — | qa-002, qa-003, qa-004, qa-005 |

## 🚦 Phase 0.2 — Test Suite

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| qa-002: Voucher/Reservation tests | 🧪 QA | 🔒 blocked | fe-001, fe-002, fe-003, qa-001 | All V2 |
| qa-003: Shopping Hub tests | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-004: Home Tasks tests | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-005: E2E test suite | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-006: Sanity checklist | 🧪 QA | ⏳ todo | — | — |

## 🚦 Phase 0.3 — Gmail OAuth

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-002: OAuth tokens schema | 🏗️ Architect | ✅ done | — | be-001 |
| be-001: Gmail OAuth flow | ⚙️ Backend | 🔒 blocked | arch-002 | fe-004 |
| fe-004: Gmail settings UI | 🎨 Frontend | 🔒 blocked | be-001 | — |

## 🚦 Phase 0.4 — Hebrew Localization

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-005: i18n framework setup | 🎨 Frontend | ⏳ todo | — | fe-006 |
| fe-006: RTL layout + translations | 🎨 Frontend | 🔒 blocked | fe-005 | qa-007 |
| qa-007: RTL testing | 🧪 QA | 🔒 blocked | fe-006 | — |

## 🚦 Phase 0.5 — Responsive + PWA Foundation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-007: Responsive audit + fix | 🎨 Frontend | ✅ done | — | — |
| be-002: PWA manifest + service worker | ⚙️ Backend | ⏳ todo | — | — |

---

## 📬 Open Handoffs

| From | To | Message | Urgency |
|------|----|---------|---------|
| 🏗️ arch-001 | 🎨 fe-001, fe-002, fe-003 | **CRITICAL:** Schema migration complete. Update all Supabase queries: (1) Change table from `voucher_items` → `vouchers` or `reservations` based on type. (2) Change column reference from `voucher_lists.default_type` → `type`. TypeScript types exported to `src/types/voucher.ts` and `src/types/reservation.ts`. Old table renamed to `voucher_items_backup_20260222` (safe to drop after 2026-03-24). | 🔴 Blocking |
| 🧪 qa-001 | 🧪 qa-002, qa-003, qa-004, qa-005 | Test infrastructure ready. Available: 12 mock factories in `tests/fixtures/` (all accept partial overrides), `tests/mocks/supabase.ts` (mockSupabaseClient with chainable query builder), `tests/mocks/localStorage.ts`, Vitest smoke tests passing, Playwright configured. Run `npm test` (unit), `npm run test:e2e` (Playwright), `npm run test:coverage`. | 🟢 Info |

## ❓ Open Questions
None.

## 🔥 Blocked Items

| Task | Blocked By | Notes |
|------|-----------|-------|
| fe-006 | fe-005 | fe-005-bug-001 fixed — unblocked, waiting on fe-005 completion |
| qa-002 | fe-001, fe-002, fe-003, qa-001 | fe-005-bug-001 fixed — sign-in works, still waiting on FE Wave 2 tasks |
| fe-004 | be-001 | — |
| qa-007 | fe-006 | — |

## 🐛 Active Bugs

| Bug | Severity | Introduced By | Status | Assigned |
|-----|----------|--------------|--------|---------|
| fe-005-bug-001: Sign-in stuck | 🔴 Critical | Wave 2 FE (fetchProfile in signIn) | ✅ Fixed | 🎨 Frontend |

---

## ✅ Completed Log

| Task | Agent | Completed | Wave | Notes |
|------|-------|-----------|------|-------|
| fe-007 | 🎨 Frontend | 2026-02-22 16:45 | Wave 1 | Responsive audit: fixed 8 issues, zero horizontal scroll |
| qa-001 | 🧪 QA | 2026-02-22 16:45 | Wave 1 | Test infra: Vitest + Playwright, 12 mock factories, smoke tests passing |
| arch-001 | 🏗️ Architect | 2026-02-22 16:45 | Wave 1 | Schema split: vouchers + reservations tables, RLS, TS types exported |

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

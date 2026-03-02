# 📋 HomeHub Agent Board
**Last updated:** 2026-03-02 — Phase 0.3 ✅ complete | Phase 1.0 ✅ complete | master → main pending deploy
**Current Phase:** 1.0 — Auth & Onboarding Hardening

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
| Wave 6 | fe-bug-013/014/015 | 🎨 | ✅ Done | 2026-02-23 15:00 | 2026-02-24 | PRs #13–#16 merged → master → main deployed |
| Wave 7 | fe-008, fe-009, qa-007, qa-008, qa-009 | 🎨🧪 | ✅ Done | 2026-02-24 | 2026-02-25 | Hebrew full support + CI pipeline live |
| Wave 8 | fe-bug-017, fe-bug-018, fe-bug-019 + qa-010, qa-011, qa-012 | 🎨🧪 | ✅ Done | 2026-02-25 | 2026-02-25 | All 6 PRs merged — 400 tests green |
| Wave 9 | be-002, qa-013 | ⚙️🧪 | ✅ Done | 2026-02-25 | 2026-02-25 | PWA live — app shell loads offline, 400 tests green |
| Wave 10 Planning | qa-014 test suite + all task JSONs | 🧪🎯 | ✅ Done | 2026-02-25 | 2026-02-25 | 32 auth edge-case tests (14✅/14❌/4⏭️), 9 tasks created, PR #32 merged |
| Wave 10A | be-003, fe-bug-021, fe-bug-024, fe-bug-025 | ⚙️🎨 | ✅ Done | 2026-02-25 | 2026-02-26 | PRs #33 + #34 merged — 4 failing tests now green |
| Wave 10B | fe-bug-020, be-005 | 🎨⚙️ | ✅ Done | 2026-02-26 | 2026-02-26 | PRs #35 + #36 merged |
| Wave 10C | fe-bug-022, fe-bug-023, be-004 | 🎨⚙️ | ✅ Done* | 2026-02-26 | 2026-03-02 | PR #37 + PR #38 merged; be-004 = human action only (no agent code) |

---

## 📊 Phase Progress Bars

```
Phase 0.1 ██████████100%  (5/5 tasks done)   arch-001 ✅ | fe-001 ✅ | fe-002 ✅ | fe-003 ✅ | qa-001 ✅
Phase 0.2 ██████████100%  (6/6 tasks done)   qa-002 ✅ | qa-003 ✅ | qa-004 ✅ | qa-005 ✅ | qa-006 ✅
Phase 0.3 ██████████100%  (3/3 tasks done)  arch-002 ✅ | be-001 ✅ | fe-004 ✅
Phase 0.4 ██████████100%  (5/5 tasks done)  fe-005 ✅ | fe-006 ✅ | fe-006-cont ✅ | fe-008 ✅ | fe-009 ✅
Phase 0.4b ████████████100% (7/7 tasks done) fe-bug-016 ✅ | fe-bug-017 ✅ | fe-bug-018 ✅ | fe-bug-019 ✅ | qa-010 ✅ | qa-011 ✅ | qa-012 ✅
Phase 0.5 ██████████100%  (3/3 tasks done)  fe-007 ✅ | be-002 ✅ | qa-013 ✅
Phase 0.6 ██████████100%  (3/3 tasks done)  qa-007 ✅ | qa-008 ✅ | qa-009 ✅
Phase 1.0 ██████████100%  (9/9 tasks done)  be-003 ✅ | fe-bug-020 ✅ | fe-bug-021 ✅ | fe-bug-022 ✅ | fe-bug-023 ✅ | fe-bug-024 ✅ | fe-bug-025 ✅ | be-005 ✅ | be-004 ✅
```

---

## 🚨 Human Action Queue

| Action | From Agent | Urgency | Status |
|--------|-----------|---------|--------|
| `supabase db push` — apply vouchers/reservations schema migration | 🏗️ arch-001 | 🔴 Blocking | ✅ Done |
| Run `supabase/15-oauth-tokens.sql` in SQL Editor | 🏗️ arch-002 | 🔴 Blocking | ✅ Done |
| Review + merge Wave 3–6 PRs → master | 🎨🧪 | 🔴 Done | ✅ Merged (PRs #1–#16) |
| Run `supabase/16-restore-voucher-schema.sql` in Supabase SQL Editor | 🎨 fe-bug-010 | 🔴 Blocking | ✅ Done |
| Merge master → main to deploy Wave 7+8+9 to production | 🎯 Coordinator | 🟡 Ready | ✅ Done (PR #31) |
| Configure HomeHub branding in Supabase Auth email templates | ⚙️ be-004 | 🟡 Wave 10C | ✅ Done |
| Whitelist `/reset-password` in Supabase Redirect URLs | 🎨 fe-bug-020 | 🔴 Blocking | ✅ Done — covered by existing `https://our-homehub.vercel.app/**` wildcard |

---

## 🖥️ Active Agents

None. All Phase 0.3 + 1.0 tasks complete. Ready for manual QA.

---

## 🚦 Phase 0.3 — Gmail OAuth

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-002: OAuth tokens schema | 🏗️ Architect | ✅ done | — | be-001 |
| be-001: Gmail OAuth flow | ⚙️ Backend | ✅ done | arch-002 | fe-004 |
| fe-004: Gmail settings UI + Google sign-in | 🎨 Frontend | ✅ done | be-001 | — |

## 🚦 Phase 1.0 — Auth & Onboarding Hardening (Wave 10)

### Wave 10A — Quick Wins (start here)

| Task | Agent | Status | Priority | Fixes Tests | Depends On |
|------|-------|--------|----------|-------------|------------|
| be-003: handle_new_user trigger search_path migration | ⚙️ Backend | ✅ done | HIGH | production incident | — |
| fe-bug-021: Inline password length validation | 🎨 Frontend | ✅ done | MEDIUM | [2] | — |
| fe-bug-024: "Check your email" for unconfirmed accounts | 🎨 Frontend | ✅ done | MEDIUM | [4][7] | — |
| fe-bug-025: "Sign in instead" for existing email in join | 🎨 Frontend | ✅ done | MEDIUM | [18] | — |

### Wave 10B — Core Features

| Task | Agent | Status | Priority | Fixes Tests | Depends On |
|------|-------|--------|----------|-------------|------------|
| fe-bug-020: Forgot password / reset password flow | 🎨 Frontend | ✅ done | HIGH | [21][22][23][30] | — |
| be-005: Household safety guards (delete + own-code) | ⚙️ Backend | ✅ done | HIGH | [19][26] | — |

### Wave 10C — UX Polish & Branding

| Task | Agent | Status | Priority | Fixes Tests | Depends On |
|------|-------|--------|----------|-------------|------------|
| fe-bug-022: Welcome screen after joining | 🎨 Frontend | ✅ done | MEDIUM | [13][32] | — |
| fe-bug-023: In-app notification when partner joins | 🎨 Frontend | 🔄 in progress | LOW | [31] | — |
| be-004: Supabase email template branding | ⚙️ Backend | 🔜 todo | LOW | [29][30] | Human action required |

### Backlog (no wave assigned)

| Task | Agent | Status | Priority | Fixes Tests | Notes |
|------|-------|--------|----------|-------------|-------|
| fe-bug-026: Session expiry + offline resilience | 🎨 Frontend | 🔵 backlog | MEDIUM | [9][11][12] | Tests skipped — needs E2E infra |
| fe-bug-027: Cross-tab sign-out sync | 🎨 Frontend | 🔵 backlog | LOW | [10] | Tests skipped — needs E2E infra |

### QA Coverage

| Task | Agent | Status | Notes |
|------|-------|--------|-------|
| qa-014: Auth & Onboarding edge-case tests | 🧪 QA | ✅ review | 32 tests — 14✅ 14❌ 4⏭️ skipped — PR #32 merged |

---

## 📬 Open Handoffs

None.

## 🐛 Active Bugs (Wave 10 — not yet fixed)

| Bug | Title | Priority | Assigned Wave |
|-----|-------|----------|---------------|

## ❓ Open Questions
None.

## 🔥 Blocked Items

| Task | Blocked By | Notes |
|------|-----------|-------|
| fe-004 | be-001 | — |

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
| fe-bug-013–015 | 🎨 Frontend | 2026-02-24 | Wave 6 | Race condition, reservations update, sign-in regression — all in prod |
| fe-008 | 🎨 Frontend | 2026-02-25 | Wave 7 | Full Hebrew translation audit — all windows complete |
| fe-009 | 🎨 Frontend | 2026-02-25 | Wave 7 | Hebrew category/listCategory/context engine values |
| qa-007 | 🧪 QA | 2026-02-25 | Wave 7 | RTL + Hebrew validation complete |
| qa-008 | 🧪 QA | 2026-02-25 | Wave 7 | Test suite errors fixed — circular dependency deadlock resolved |
| qa-009 | 🧪 QA | 2026-02-25 | Wave 7 | GitHub Actions CI pipeline live |
| fe-bug-016 | 🎨 Frontend | 2026-02-25 | Wave 8 | ShoppingList Hub Hebrew translations |
| fe-bug-017 | 🎨 Frontend | 2026-02-25 | Wave 8 | i18n audit — 6 components fully translated |
| fe-bug-018 | 🎨 Frontend | 2026-02-25 | Wave 8 | Hebrew context suggestion keywords extended |
| fe-bug-019 | 🎨 Frontend | 2026-02-25 | Wave 8 | autoCategorize: Hebrew input + false-positive fixes + 'almonds' keyword |
| qa-010 | 🧪 QA | 2026-02-25 | Wave 8 | i18n completeness tests — 29 tests, all green |
| qa-011 | 🧪 QA | 2026-02-25 | Wave 8 | Hebrew context suggestion tests — 29 tests, all green |
| qa-012 | 🧪 QA | 2026-02-25 | Wave 8 | autoCategorize tests — 49 tests, all green |
| be-002 | ⚙️ Backend | 2026-02-25 | Wave 9 | PWA manifest, service worker, icons, offline page — live in production |
| qa-013 | 🧪 QA | 2026-02-25 | Wave 9 | PWA tests — 400 tests green, app shell verified offline |
| qa-014 (planning) | 🧪🎯 | 2026-02-25 | Wave 10 Planning | 32 auth edge-case tests written — 14✅/14❌/4⏭️ — PR #32 merged |
| be-003 | ⚙️ Backend | 2026-02-26 | Wave 10A | handle_new_user trigger search_path migration — PR #33 merged |
| fe-bug-021 | 🎨 Frontend | 2026-02-26 | Wave 10A | Inline password length validation — PR #34 merged |
| fe-bug-024 | 🎨 Frontend | 2026-02-26 | Wave 10A | "Check your email" for unconfirmed accounts — PR #34 merged |
| fe-bug-025 | 🎨 Frontend | 2026-02-26 | Wave 10A | "Sign in instead" for existing email in join — PR #34 merged |
| fe-bug-020 | 🎨 Frontend | 2026-02-26 | Wave 10B | Forgot/reset password flow — PR #35 merged |
| be-005 | ⚙️ Backend | 2026-02-26 | Wave 10B | Household safety guards (already-member + delete protection) — PR #36 merged |
| fe-bug-022 | 🎨 Frontend | 2026-02-26 | Wave 10C | Welcome screen after joining household — PR #37 merged |
| fe-bug-023 | 🎨 Frontend | 2026-03-02 | Wave 10C | In-app notification when partner joins household — PR #38 merged |
| be-004 | 👤 Human | 2026-03-02 | Wave 10C | HomeHub branding on Supabase Auth email templates — configured in Dashboard |
| be-001 | ⚙️ Backend | 2026-03-02 | Phase 0.3 | Gmail OAuth 2.0 — Edge Functions deployed, PR #39 merged |
| fe-004 | 🎨 Frontend | 2026-03-02 | Phase 0.3 | Gmail Settings UI + Google sign-in button — PR #40 merged |

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

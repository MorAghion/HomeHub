# 📋 HomeHub Agent Board
**Last updated:** 2026-02-22 16:45 UTC
**Current Phase:** 0.1 — Vouchers / Bookings Separation (COMPLETE) → 0.2 Test Suite

---

## 🚦 Phase 0.1 — Vouchers / Bookings Separation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-001: Vouchers schema split | 🏗️ Architect | ✅ done | — | fe-001, fe-002, fe-003, qa-002 |
| fe-001: VoucherCard component | 🎨 Frontend | ⏳ todo | arch-001 | qa-002 |
| fe-002: ReservationCard component | 🎨 Frontend | ⏳ todo | arch-001 | qa-002 |
| fe-003: Create forms separation | 🎨 Frontend | ⏳ todo | arch-001 | qa-002 |
| qa-001: Test infrastructure setup | 🧪 QA | ✅ done | — | qa-002, qa-003, qa-004, qa-005 |

## 🚦 Phase 0.2 — Test Suite

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| qa-002: Voucher/Reservation tests | 🧪 QA | ⏳ todo | fe-001, fe-002, qa-001 | All V2 |
| qa-003: Shopping Hub tests | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-004: Home Tasks tests | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-005: E2E test suite | 🧪 QA | ⏳ todo | qa-001 | All V2 |
| qa-006: Sanity checklist | 🧪 QA | ⏳ todo | — | — |

## 🚦 Phase 0.3 — Gmail OAuth

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| arch-002: OAuth tokens schema | 🏗️ Architect | ⏳ todo | — | be-001 |
| be-001: Gmail OAuth flow | ⚙️ Backend | ⏳ todo | arch-002 | fe-004 |
| fe-004: Gmail settings UI | 🎨 Frontend | ⏳ todo | be-001 | — |

## 🚦 Phase 0.4 — Hebrew Localization

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-005: i18n framework setup | 🎨 Frontend | ⏳ todo | — | fe-006 |
| fe-006: RTL layout + translations | 🎨 Frontend | ⏳ todo | fe-005 | qa-007 |
| qa-007: RTL testing | 🧪 QA | ⏳ todo | fe-006 | — |

## 🚦 Phase 0.5 — Responsive + PWA Foundation

| Task | Agent | Status | Depends On | Blocks |
|------|-------|--------|------------|--------|
| fe-007: Responsive audit + fix | 🎨 Frontend | ✅ done | — | — |
| be-002: PWA manifest + service worker | ⚙️ Backend | ⏳ todo | — | — |

---

## 📬 Open Handoffs
None yet.

## ❓ Open Questions
None yet.

## 🔥 Blocked Items
None yet.

## ✅ Recently Completed
- **arch-001** (2026-02-22) — Vouchers/Reservations schema split complete. Migration created 2 tables, migrated 1 voucher, added RLS, exported TypeScript types. FE agents: update queries from voucher_items → vouchers/reservations, and voucher_lists.default_type → type.
- **qa-001** (2026-02-22) — Test infrastructure complete. Vitest + Playwright configured, 12 mock factories created, package.json test scripts added, smoke tests passing.
- **fe-007** (2026-02-22) — Responsive audit complete. Fixed 8 issues: MasterListDrawer overflow, TaskList grid cramping, VoucherCard touch-hover, header truncation (3 hubs), landing card scaling. Zero horizontal scroll on all devices.

---

## 📊 Summary
- **Total tasks:** 18
- **Done:** 3 (arch-001, qa-001, fe-007)
- **In Progress:** 0
- **Blocked:** 3 (qa-002 blocked by fe-001/fe-002/fe-003, fe-004 blocked by be-001, fe-006 blocked by fe-005, be-001 blocked by arch-002, qa-007 blocked by fe-006)
- **Ready to start:** 10 tasks — **Phase 0.1:** fe-001, fe-002, fe-003 | **Phase 0.2:** qa-003, qa-004, qa-005, qa-006 | **Phase 0.3:** arch-002 | **Phase 0.4:** fe-005 | **Phase 0.5:** be-002

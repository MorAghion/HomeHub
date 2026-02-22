-- =====================================================
-- HomeHub: Split vouchers/reservations into separate tables
-- Migration: 14-split-vouchers-reservations.sql
-- Date: 2026-02-22
-- =====================================================
-- Splits the polymorphic voucher_items table into two
-- dedicated tables: vouchers and reservations.
-- Existing data is migrated without loss.
-- The old table is renamed (not dropped) for 30-day backup.
-- Safe to re-run (all statements guarded by IF NOT EXISTS / IF EXISTS).
-- =====================================================

-- =====================================================
-- STEP 1: Create vouchers table
-- =====================================================

CREATE TABLE IF NOT EXISTS vouchers (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  value        TEXT,                          -- e.g. "₪200", "Double Movie Ticket"
  issuer       TEXT,                          -- e.g. "BuyMe", "Azrieli"
  expiry_date  DATE,
  code         TEXT,                          -- digital code or barcode
  image_url    TEXT,
  notes        TEXT,
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create reservations table
-- =====================================================

CREATE TABLE IF NOT EXISTS reservations (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  event_date   TEXT,                          -- DATE stored as text (e.g. "2026-03-15")
  time         TEXT,                          -- TIME stored as text (e.g. "19:30")
  address      TEXT,                          -- venue / location
  image_url    TEXT,
  notes        TEXT,
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Rename default_type → type on voucher_lists
-- Stores the hub's item type explicitly ('voucher' | 'reservation')
-- so it is never derived at runtime.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voucher_lists' AND column_name = 'default_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voucher_lists' AND column_name = 'type'
  ) THEN
    ALTER TABLE voucher_lists RENAME COLUMN default_type TO type;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Migrate existing data from voucher_items
-- =====================================================

-- 4a: Migrate voucher records
INSERT INTO vouchers (id, name, value, issuer, expiry_date, code, image_url, notes, household_id, created_by, created_at)
SELECT
  vi.id,
  vi.name,
  vi.value,
  vi.issuer,
  vi.expiry_date,
  vi.code,
  vi.image_url,
  vi.notes,
  vl.household_id,
  NULL,          -- created_by unavailable in legacy data
  vi.created_at
FROM voucher_items vi
JOIN voucher_lists vl ON vl.id = vi.list_id
WHERE vi.type = 'voucher'
ON CONFLICT (id) DO NOTHING;

-- 4b: Migrate reservation records
-- Coalesce the newer event_date/event_time text columns (added in migration 10)
-- with the older date_time TIMESTAMPTZ column (from migration 01) for backward compat.
INSERT INTO reservations (id, name, event_date, time, address, image_url, notes, household_id, created_by, created_at)
SELECT
  vi.id,
  vi.name,
  COALESCE(
    vi.event_date,
    to_char(vi.date_time AT TIME ZONE 'UTC', 'YYYY-MM-DD')
  )                        AS event_date,
  COALESCE(
    vi.event_time,
    to_char(vi.date_time AT TIME ZONE 'UTC', 'HH24:MI')
  )                        AS time,
  COALESCE(vi.location)    AS address,
  vi.image_url,
  vi.notes,
  vl.household_id,
  NULL,                    -- created_by unavailable in legacy data
  vi.created_at
FROM voucher_items vi
JOIN voucher_lists vl ON vl.id = vi.list_id
WHERE vi.type = 'reservation'
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: Deprecate old polymorphic table (30-day backup)
-- Rename instead of DROP to preserve data until 2026-03-24.
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'voucher_items'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'voucher_items_backup_20260222'
  ) THEN
    ALTER TABLE voucher_items RENAME TO voucher_items_backup_20260222;
  END IF;
END $$;

-- =====================================================
-- STEP 6: Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_vouchers_household   ON vouchers(household_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_expiry      ON vouchers(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_created_by  ON vouchers(created_by)  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_household  ON reservations(household_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_date ON reservations(event_date) WHERE event_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reservations_created_by ON reservations(created_by)  WHERE created_by IS NOT NULL;

-- =====================================================
-- STEP 7: Enable RLS
-- =====================================================

ALTER TABLE vouchers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: RLS Policies — vouchers
-- Household-level access via user_profiles lookup.
-- =====================================================

DROP POLICY IF EXISTS "Users can view vouchers in their household"   ON vouchers;
DROP POLICY IF EXISTS "Users can insert vouchers in their household" ON vouchers;
DROP POLICY IF EXISTS "Users can update vouchers in their household" ON vouchers;
DROP POLICY IF EXISTS "Users can delete vouchers in their household" ON vouchers;

CREATE POLICY "Users can view vouchers in their household"
  ON vouchers FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert vouchers in their household"
  ON vouchers FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update vouchers in their household"
  ON vouchers FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete vouchers in their household"
  ON vouchers FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STEP 9: RLS Policies — reservations
-- =====================================================

DROP POLICY IF EXISTS "Users can view reservations in their household"   ON reservations;
DROP POLICY IF EXISTS "Users can insert reservations in their household" ON reservations;
DROP POLICY IF EXISTS "Users can update reservations in their household" ON reservations;
DROP POLICY IF EXISTS "Users can delete reservations in their household" ON reservations;

CREATE POLICY "Users can view reservations in their household"
  ON reservations FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert reservations in their household"
  ON reservations FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update reservations in their household"
  ON reservations FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete reservations in their household"
  ON reservations FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- STEP 10: updated_at triggers
-- Note: vouchers and reservations use created_at only (no updated_at)
-- per the acceptance criteria column list.
-- If updated_at tracking is added later, apply update_updated_at_column() trigger.
-- =====================================================

-- (No updated_at column on these tables per spec — omitted intentionally.)

-- =====================================================
-- STEP 11: Enable Realtime
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE vouchers;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'vouchers already in supabase_realtime publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'reservations already in supabase_realtime publication';
END $$;

-- =====================================================
-- STEP 12: Note — Storage RLS compatibility
-- =====================================================
-- Migration 11 enforces Storage RLS using the path convention:
--   {household_id}/{item_id}/{filename}
-- Since we preserve the UUIDs of migrated rows (ON CONFLICT DO NOTHING
-- with the same id values), all existing images remain accessible under
-- their original paths. No Storage policy changes required.

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Backup table 'voucher_items_backup_20260222' can be dropped
-- after 2026-03-24 once data integrity is confirmed.
-- =====================================================

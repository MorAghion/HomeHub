-- =====================================================
-- HomeHub: Vouchers Hub Migration
-- =====================================================
-- Run this in Supabase SQL Editor.
-- voucher_lists and voucher_items already exist from 01-schema.sql.
-- This file adds missing columns, fixes RLS, and enables Realtime.
-- Safe to re-run (all statements are idempotent).
-- =====================================================

-- =====================================================
-- STEP 1: Add missing columns to voucher_items
-- =====================================================

-- Voucher-specific
ALTER TABLE voucher_items ADD COLUMN IF NOT EXISTS issuer     TEXT;
ALTER TABLE voucher_items ADD COLUMN IF NOT EXISTS code       TEXT;

-- Shared
ALTER TABLE voucher_items ADD COLUMN IF NOT EXISTS image_url  TEXT;

-- Reservation-specific (separate date + time, simpler than TIMESTAMPTZ)
ALTER TABLE voucher_items ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE voucher_items ADD COLUMN IF NOT EXISTS event_time TEXT;

-- =====================================================
-- STEP 2: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_voucher_lists_household ON voucher_lists(household_id);
CREATE INDEX IF NOT EXISTS idx_voucher_items_list      ON voucher_items(list_id);
CREATE INDEX IF NOT EXISTS idx_voucher_items_type      ON voucher_items(type);

-- =====================================================
-- STEP 3: ENABLE RLS
-- =====================================================

ALTER TABLE voucher_lists  ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items   ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: RLS POLICIES
-- =====================================================

-- ── voucher_lists ───────────────────────────────────
DROP POLICY IF EXISTS "Users can view voucher lists in their household"   ON voucher_lists;
DROP POLICY IF EXISTS "Users can insert voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can update voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can delete voucher lists in their household" ON voucher_lists;

CREATE POLICY "Users can view voucher lists in their household"
  ON voucher_lists FOR SELECT
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert voucher lists in their household"
  ON voucher_lists FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update voucher lists in their household"
  ON voucher_lists FOR UPDATE
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete voucher lists in their household"
  ON voucher_lists FOR DELETE
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- ── voucher_items (inherit from parent voucher_list) ──
DROP POLICY IF EXISTS "Users can view voucher items in their household"   ON voucher_items;
DROP POLICY IF EXISTS "Users can insert voucher items in their household" ON voucher_items;
DROP POLICY IF EXISTS "Users can update voucher items in their household" ON voucher_items;
DROP POLICY IF EXISTS "Users can delete voucher items in their household" ON voucher_items;

CREATE POLICY "Users can view voucher items in their household"
  ON voucher_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert voucher items in their household"
  ON voucher_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update voucher items in their household"
  ON voucher_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete voucher items in their household"
  ON voucher_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- STEP 5: UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_voucher_lists_updated_at ON voucher_lists;
CREATE TRIGGER update_voucher_lists_updated_at
  BEFORE UPDATE ON voucher_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voucher_items_updated_at ON voucher_items;
CREATE TRIGGER update_voucher_items_updated_at
  BEFORE UPDATE ON voucher_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: ENABLE REALTIME
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE voucher_lists;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'voucher_lists already in supabase_realtime publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE voucher_items;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'voucher_items already in supabase_realtime publication';
END $$;

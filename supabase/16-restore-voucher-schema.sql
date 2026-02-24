-- =====================================================
-- HomeHub: Restore voucher schema compatibility
-- Migration: 16-restore-voucher-schema.sql
-- Date: 2026-02-23
-- =====================================================
-- Migration 14 renamed voucher_lists.default_type → type
-- and renamed voucher_items → voucher_items_backup_20260222.
-- The new vouchers/reservations tables it created lack list_id,
-- making them incompatible with the list-based app architecture.
--
-- This migration:
--   1. Adds default_type column back to voucher_lists (synced from type)
--   2. Recreates voucher_items with the correct list-based schema
--   3. Restores data from the backup table if it exists
--   4. Sets up RLS + Realtime for voucher_items
--
-- Safe to re-run (all statements are idempotent).
-- =====================================================

-- =====================================================
-- STEP 1: Restore default_type on voucher_lists
-- Migration 14 renamed it to 'type'. We add default_type
-- back so supabaseVoucherService.ts continues to work.
-- =====================================================

ALTER TABLE voucher_lists
  ADD COLUMN IF NOT EXISTS default_type TEXT
  CHECK (default_type IN ('voucher', 'reservation'));

-- Sync values from 'type' column if migration 14 was applied
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voucher_lists' AND column_name = 'type'
  ) THEN
    UPDATE voucher_lists
    SET default_type = type::text
    WHERE default_type IS NULL AND type IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Recreate voucher_items
-- Migration 14 renamed it to voucher_items_backup_20260222.
-- We create it fresh with the correct list-based schema.
-- =====================================================

CREATE TABLE IF NOT EXISTS voucher_items (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id      UUID        NOT NULL REFERENCES voucher_lists(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('voucher', 'reservation')),
  name         TEXT        NOT NULL,
  notes        TEXT,
  -- Voucher-specific
  value        TEXT,
  issuer       TEXT,
  expiry_date  TEXT,
  code         TEXT,
  used         BOOLEAN     DEFAULT FALSE,
  -- Reservation-specific
  location     TEXT,
  event_date   TEXT,
  event_time   TEXT,
  -- Shared
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Restore data from backup (if it exists)
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'voucher_items_backup_20260222'
  ) THEN
    INSERT INTO voucher_items (
      id, list_id, type, name, notes,
      value, issuer, expiry_date, code, used,
      location, event_date, event_time,
      image_url, created_at
    )
    SELECT
      id, list_id, type, name, notes,
      value, issuer, expiry_date, code, used,
      location, event_date, event_time,
      image_url, created_at
    FROM voucher_items_backup_20260222
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_voucher_items_list ON voucher_items(list_id);
CREATE INDEX IF NOT EXISTS idx_voucher_items_type ON voucher_items(type);

-- =====================================================
-- STEP 5: RLS
-- =====================================================

ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;

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
        AND vl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can insert voucher items in their household"
  ON voucher_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update voucher items in their household"
  ON voucher_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can delete voucher items in their household"
  ON voucher_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists vl
      WHERE vl.id = voucher_items.list_id
        AND vl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

-- =====================================================
-- STEP 6: updated_at trigger
-- =====================================================

DROP TRIGGER IF EXISTS update_voucher_items_updated_at ON voucher_items;
CREATE TRIGGER update_voucher_items_updated_at
  BEFORE UPDATE ON voucher_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: Enable Realtime
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE voucher_items;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'voucher_items already in supabase_realtime publication';
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- Run this in the Supabase SQL Editor.
-- =====================================================

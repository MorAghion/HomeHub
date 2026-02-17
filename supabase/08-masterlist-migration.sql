-- =====================================================
-- HomeHub: Master List Migration
-- =====================================================
-- Run this in Supabase SQL Editor AFTER supabase-shopping-migration.sql.
-- Adds the master_list_items table — one per shopping Sub-Hub.
-- Safe to re-run (all statements are idempotent).
-- =====================================================

-- =====================================================
-- STEP 1: TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS master_list_items (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id    UUID        NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  category   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- STEP 2: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_master_list_items_list ON master_list_items(list_id);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE master_list_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: RLS POLICIES
-- Inherit household access from the parent shopping_list.
-- =====================================================

DROP POLICY IF EXISTS "Users can view master list items in their household"   ON master_list_items;
DROP POLICY IF EXISTS "Users can insert master list items in their household" ON master_list_items;
DROP POLICY IF EXISTS "Users can update master list items in their household" ON master_list_items;
DROP POLICY IF EXISTS "Users can delete master list items in their household" ON master_list_items;

CREATE POLICY "Users can view master list items in their household"
  ON master_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = master_list_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can insert master list items in their household"
  ON master_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = master_list_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update master list items in their household"
  ON master_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = master_list_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can delete master list items in their household"
  ON master_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = master_list_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

-- =====================================================
-- STEP 5: UPDATED_AT TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS update_master_list_items_updated_at ON master_list_items;
CREATE TRIGGER update_master_list_items_updated_at
  BEFORE UPDATE ON master_list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: ENABLE REALTIME
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE master_list_items;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'master_list_items already in supabase_realtime publication';
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'master_list_items'
--  ORDER BY ordinal_position;

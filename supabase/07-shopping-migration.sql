-- =====================================================
-- HomeHub: Shopping Hub Migration
-- =====================================================
-- Run this in Supabase SQL Editor.
-- Safe to run on a fresh DB or on top of supabase-schema.sql.
-- All statements are idempotent (safe to re-run).
-- =====================================================

-- =====================================================
-- STEP 1: TABLES
-- =====================================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- shopping_lists: one row per Sub-Hub (e.g. "Supermarket", "Camping")
CREATE TABLE IF NOT EXISTS shopping_lists (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID        NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  icon         TEXT,                        -- e.g. "ShoppingCart", "Tent" (Lucide icon name)
  color        TEXT,                        -- e.g. "#630606" (hex accent color)
  context      TEXT,                        -- detected context key (e.g. "grocery", "camping")
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add icon/color if the table already existed without them
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS icon    TEXT;
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS color   TEXT;

-- shopping_items: one row per item inside a list
CREATE TABLE IF NOT EXISTS shopping_items (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id      UUID        NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  text         TEXT        NOT NULL,
  category     TEXT,                        -- auto-detected category (e.g. "Dairy", "Produce")
  quantity     TEXT,                        -- optional free-text quantity (e.g. "2kg", "x3")
  is_completed BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Handle upgrade from old schema column names (idempotent)
-- Old schema had: checked (bool), context (text)
-- New schema has: is_completed (bool), category (text)
-- -------------------------------------------------------
DO $$
BEGIN
  -- Rename 'checked' → 'is_completed'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shopping_items'
      AND column_name  = 'checked'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shopping_items'
      AND column_name  = 'is_completed'
  ) THEN
    ALTER TABLE shopping_items RENAME COLUMN checked TO is_completed;
    RAISE NOTICE 'Renamed shopping_items.checked -> is_completed';
  END IF;

  -- Rename 'context' → 'category' on shopping_items
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shopping_items'
      AND column_name  = 'context'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'shopping_items'
      AND column_name  = 'category'
  ) THEN
    ALTER TABLE shopping_items RENAME COLUMN context TO category;
    RAISE NOTICE 'Renamed shopping_items.context -> category';
  END IF;
END $$;

-- =====================================================
-- STEP 2: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shopping_lists_household ON shopping_lists(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list      ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(is_completed);

-- =====================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: RLS POLICIES
-- All policies use user_profiles for household lookup.
-- A user can only access data belonging to their household.
-- =====================================================

-- Drop old policies (safe if they don't exist)
DROP POLICY IF EXISTS "Users can view shopping lists in their household"   ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete shopping lists in their household" ON shopping_lists;

DROP POLICY IF EXISTS "Users can view shopping items in their household"   ON shopping_items;
DROP POLICY IF EXISTS "Users can insert shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can update shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete shopping items in their household" ON shopping_items;

-- -------------------------------------------------------
-- shopping_lists policies
-- -------------------------------------------------------

CREATE POLICY "Users can view shopping lists in their household"
  ON shopping_lists FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert shopping lists in their household"
  ON shopping_lists FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update shopping lists in their household"
  ON shopping_lists FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shopping lists in their household"
  ON shopping_lists FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- shopping_items policies  (inherit access from parent list)
-- -------------------------------------------------------

CREATE POLICY "Users can view shopping items in their household"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can insert shopping items in their household"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update shopping items in their household"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can delete shopping items in their household"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_items.list_id
        AND sl.household_id IN (
          SELECT household_id FROM user_profiles WHERE id = auth.uid()
        )
    )
  );

-- =====================================================
-- STEP 5: UPDATED_AT TRIGGERS
-- =====================================================

-- Shared trigger function (create if it doesn't exist yet)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON shopping_items;
CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: ENABLE REALTIME
-- Allows Supabase Realtime to broadcast row changes
-- so all household members see instant updates.
-- =====================================================

-- Add tables to the supabase_realtime publication
-- (ignore errors if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'shopping_lists already in supabase_realtime publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'shopping_items already in supabase_realtime publication';
END $$;

-- =====================================================
-- VERIFY
-- =====================================================
-- Run these after the migration to confirm everything:
--
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name IN ('shopping_lists', 'shopping_items')
--  ORDER BY table_name, ordinal_position;
--
-- SELECT tablename, policyname
--   FROM pg_policies
--  WHERE tablename IN ('shopping_lists', 'shopping_items');

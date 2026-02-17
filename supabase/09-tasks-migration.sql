-- =====================================================
-- HomeHub: Tasks Hub Migration
-- =====================================================
-- Run this in Supabase SQL Editor.
-- task_lists and tasks tables already exist from 01-schema.sql.
-- This file adds the task_master_items table and ensures
-- all columns and policies are correct.
-- Safe to re-run (all statements are idempotent).
-- =====================================================

-- =====================================================
-- STEP 1: task_lists — verify columns are correct
-- =====================================================

-- task_lists already has: id, household_id, name, context, created_at, updated_at
-- No additional columns needed for now.

-- =====================================================
-- STEP 2: tasks — verify columns are correct
-- =====================================================

-- tasks already has: id, list_id, text, status, priority, due_date,
--                    assignee, is_urgent, source_subhub_id, notes,
--                    created_at, updated_at
-- No additional columns needed.

-- =====================================================
-- STEP 3: task_master_items — template tasks per Sub-Hub
-- =====================================================

CREATE TABLE IF NOT EXISTS task_master_items (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id         UUID        NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'Not Started',
  urgency         TEXT        CHECK (urgency IN ('Low', 'Medium', 'High')),
  due_date        DATE,
  assignee        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_master_items_list ON task_master_items(list_id);

-- =====================================================
-- STEP 4: ENABLE RLS
-- =====================================================

ALTER TABLE task_lists        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_master_items  ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS POLICIES
-- =====================================================

-- ── task_lists ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can view task lists in their household"   ON task_lists;
DROP POLICY IF EXISTS "Users can insert task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can update task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can delete task lists in their household" ON task_lists;

CREATE POLICY "Users can view task lists in their household"
  ON task_lists FOR SELECT
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert task lists in their household"
  ON task_lists FOR INSERT
  WITH CHECK (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update task lists in their household"
  ON task_lists FOR UPDATE
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete task lists in their household"
  ON task_lists FOR DELETE
  USING (household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid()));

-- ── tasks (inherit from parent task_list) ───────────
DROP POLICY IF EXISTS "Users can view tasks in their household"   ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their household" ON tasks;

CREATE POLICY "Users can view tasks in their household"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert tasks in their household"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update tasks in their household"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete tasks in their household"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = tasks.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- ── task_master_items (inherit from parent task_list) ──
DROP POLICY IF EXISTS "Users can view task master items in their household"   ON task_master_items;
DROP POLICY IF EXISTS "Users can insert task master items in their household" ON task_master_items;
DROP POLICY IF EXISTS "Users can update task master items in their household" ON task_master_items;
DROP POLICY IF EXISTS "Users can delete task master items in their household" ON task_master_items;

CREATE POLICY "Users can view task master items in their household"
  ON task_master_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = task_master_items.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can insert task master items in their household"
  ON task_master_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = task_master_items.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can update task master items in their household"
  ON task_master_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = task_master_items.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Users can delete task master items in their household"
  ON task_master_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists tl
      WHERE tl.id = task_master_items.list_id
        AND tl.household_id IN (SELECT household_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- =====================================================
-- STEP 6: UPDATED_AT TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_task_lists_updated_at ON task_lists;
CREATE TRIGGER update_task_lists_updated_at
  BEFORE UPDATE ON task_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_master_items_updated_at ON task_master_items;
CREATE TRIGGER update_task_master_items_updated_at
  BEFORE UPDATE ON task_master_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 7: ENABLE REALTIME
-- =====================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE task_lists;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'task_lists already in supabase_realtime publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'tasks already in supabase_realtime publication';
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE task_master_items;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'task_master_items already in supabase_realtime publication';
END $$;

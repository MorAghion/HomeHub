-- =====================================================
-- HomeHub Database Schema for Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SHOPPING HUB TABLES
-- =====================================================

-- Shopping Lists Table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shopping Items Table
CREATE TABLE shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  quantity TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TASKS HUB TABLES
-- =====================================================

-- Task Lists Table
CREATE TABLE task_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'To Do',
  priority TEXT,
  due_date DATE,
  assignee TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  source_subhub_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- VOUCHERS HUB TABLES
-- =====================================================

-- Voucher Lists Table
CREATE TABLE voucher_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL,
  name TEXT NOT NULL,
  context TEXT,
  default_type TEXT CHECK (default_type IN ('voucher', 'reservation')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Voucher Items Table (Polymorphic: vouchers + reservations)
CREATE TABLE voucher_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES voucher_lists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('voucher', 'reservation')),
  name TEXT NOT NULL,
  notes TEXT,

  -- Voucher-specific fields
  valid_from DATE,
  expiry_date DATE,
  value TEXT,
  used BOOLEAN DEFAULT false,

  -- Reservation-specific fields
  location TEXT,
  date_time TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Shopping indexes
CREATE INDEX idx_shopping_lists_household ON shopping_lists(household_id);
CREATE INDEX idx_shopping_items_list ON shopping_items(list_id);

-- Task indexes
CREATE INDEX idx_task_lists_household ON task_lists(household_id);
CREATE INDEX idx_tasks_list ON tasks(list_id);
CREATE INDEX idx_tasks_urgent ON tasks(is_urgent) WHERE is_urgent = true;
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Voucher indexes
CREATE INDEX idx_voucher_lists_household ON voucher_lists(household_id);
CREATE INDEX idx_voucher_items_list ON voucher_items(list_id);
CREATE INDEX idx_voucher_items_type ON voucher_items(type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;

-- Shopping Lists Policies
CREATE POLICY "Users can view shopping lists in their household"
  ON shopping_lists FOR SELECT
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can insert shopping lists in their household"
  ON shopping_lists FOR INSERT
  WITH CHECK (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can update shopping lists in their household"
  ON shopping_lists FOR UPDATE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can delete shopping lists in their household"
  ON shopping_lists FOR DELETE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

-- Shopping Items Policies (inherit from parent list)
CREATE POLICY "Users can view shopping items in their household"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can insert shopping items in their household"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can update shopping items in their household"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can delete shopping items in their household"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

-- Task Lists Policies
CREATE POLICY "Users can view task lists in their household"
  ON task_lists FOR SELECT
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can insert task lists in their household"
  ON task_lists FOR INSERT
  WITH CHECK (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can update task lists in their household"
  ON task_lists FOR UPDATE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can delete task lists in their household"
  ON task_lists FOR DELETE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

-- Tasks Policies (inherit from parent list)
CREATE POLICY "Users can view tasks in their household"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can insert tasks in their household"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can update tasks in their household"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can delete tasks in their household"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

-- Voucher Lists Policies
CREATE POLICY "Users can view voucher lists in their household"
  ON voucher_lists FOR SELECT
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can insert voucher lists in their household"
  ON voucher_lists FOR INSERT
  WITH CHECK (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can update voucher lists in their household"
  ON voucher_lists FOR UPDATE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

CREATE POLICY "Users can delete voucher lists in their household"
  ON voucher_lists FOR DELETE
  USING (household_id = (auth.jwt() ->> 'household_id')::uuid);

-- Voucher Items Policies (inherit from parent list)
CREATE POLICY "Users can view voucher items in their household"
  ON voucher_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can insert voucher items in their household"
  ON voucher_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can update voucher items in their household"
  ON voucher_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

CREATE POLICY "Users can delete voucher items in their household"
  ON voucher_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id = (auth.jwt() ->> 'household_id')::uuid
    )
  );

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_lists_updated_at
  BEFORE UPDATE ON task_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voucher_lists_updated_at
  BEFORE UPDATE ON voucher_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voucher_items_updated_at
  BEFORE UPDATE ON voucher_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL SETUP COMPLETE
-- =====================================================

-- To verify tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

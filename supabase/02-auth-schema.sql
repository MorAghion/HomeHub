-- =====================================================
-- Authentication & Household Management Tables
-- =====================================================

-- Households Table
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Profiles Table (links Supabase auth.users to households)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Household Invites Table (for inviting partners)
CREATE TABLE household_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_user_profiles_household ON user_profiles(household_id);
CREATE INDEX idx_household_invites_code ON household_invites(invite_code);
CREATE INDEX idx_household_invites_household ON household_invites(household_id);

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Households Policies
CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.household_id = households.id
      AND user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own household"
  ON households FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.household_id = households.id
      AND user_profiles.id = auth.uid()
    )
  );

-- User Profiles Policies
CREATE POLICY "Users can view profiles in their household"
  ON user_profiles FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Household Invites Policies
CREATE POLICY "Users can view invites for their household"
  ON household_invites FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create invites for their household"
  ON household_invites FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view valid invite by code"
  ON household_invites FOR SELECT
  USING (
    invite_code IS NOT NULL
    AND expires_at > NOW()
    AND used_at IS NULL
  );

-- =====================================================
-- UPDATE EXISTING RLS POLICIES TO USE USER_PROFILES
-- =====================================================

-- Drop old policies that use JWT claims
DROP POLICY IF EXISTS "Users can view shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete shopping lists in their household" ON shopping_lists;

-- Recreate with user_profiles lookup
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

-- Update Shopping Items policies
DROP POLICY IF EXISTS "Users can view shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can insert shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can update shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can delete shopping items in their household" ON shopping_items;

CREATE POLICY "Users can view shopping items in their household"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert shopping items in their household"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update shopping items in their household"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete shopping items in their household"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = shopping_items.list_id
      AND shopping_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Update Task Lists policies
DROP POLICY IF EXISTS "Users can view task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can insert task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can update task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can delete task lists in their household" ON task_lists;

CREATE POLICY "Users can view task lists in their household"
  ON task_lists FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert task lists in their household"
  ON task_lists FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update task lists in their household"
  ON task_lists FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task lists in their household"
  ON task_lists FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update Tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their household" ON tasks;

CREATE POLICY "Users can view tasks in their household"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert tasks in their household"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update tasks in their household"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete tasks in their household"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM task_lists
      WHERE task_lists.id = tasks.list_id
      AND task_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Update Voucher Lists policies
DROP POLICY IF EXISTS "Users can view voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can insert voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can update voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can delete voucher lists in their household" ON voucher_lists;

CREATE POLICY "Users can view voucher lists in their household"
  ON voucher_lists FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert voucher lists in their household"
  ON voucher_lists FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update voucher lists in their household"
  ON voucher_lists FOR UPDATE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete voucher lists in their household"
  ON voucher_lists FOR DELETE
  USING (
    household_id IN (
      SELECT household_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Update Voucher Items policies
DROP POLICY IF EXISTS "Users can view voucher items in their household" ON voucher_items;
DROP POLICY IF EXISTS "Users can insert voucher items in their household" ON voucher_items;
DROP POLICY IF EXISTS "Users can update voucher items in their household" ON voucher_items;
DROP POLICY IF EXISTS "Users can delete voucher items in their household" ON voucher_items;

CREATE POLICY "Users can view voucher items in their household"
  ON voucher_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert voucher items in their household"
  ON voucher_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update voucher items in their household"
  ON voucher_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete voucher items in their household"
  ON voucher_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM voucher_lists
      WHERE voucher_lists.id = voucher_items.list_id
      AND voucher_lists.household_id IN (
        SELECT household_id FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- TRIGGER FOR AUTO-CREATING HOUSEHOLD ON SIGNUP
-- =====================================================

-- Function to create household and profile for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create a new household for the user
  INSERT INTO households (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Household'))
  RETURNING id INTO new_household_id;

  -- Create user profile linked to the household
  INSERT INTO user_profiles (id, household_id, display_name)
  VALUES (
    NEW.id,
    new_household_id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create household invite
CREATE OR REPLACE FUNCTION create_household_invite(days_valid INTEGER DEFAULT 7)
RETURNS TEXT AS $$
DECLARE
  user_household_id UUID;
  new_invite_code TEXT;
BEGIN
  -- Get user's household_id
  SELECT household_id INTO user_household_id
  FROM user_profiles
  WHERE id = auth.uid();

  IF user_household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;

  -- Generate unique invite code
  LOOP
    new_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM household_invites WHERE invite_code = new_invite_code
    );
  END LOOP;

  -- Create invite
  INSERT INTO household_invites (household_id, invite_code, created_by, expires_at)
  VALUES (
    user_household_id,
    new_invite_code,
    auth.uid(),
    NOW() + (days_valid || ' days')::INTERVAL
  );

  RETURN new_invite_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join household via invite code
CREATE OR REPLACE FUNCTION join_household_via_invite(invite_code_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
  user_current_household UUID;
BEGIN
  -- Get current user's household
  SELECT household_id INTO user_current_household
  FROM user_profiles
  WHERE id = auth.uid();

  -- Find valid invite
  SELECT * INTO invite_record
  FROM household_invites
  WHERE invite_code = invite_code_param
    AND expires_at > NOW()
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Update user's household
  UPDATE user_profiles
  SET household_id = invite_record.household_id
  WHERE id = auth.uid();

  -- Mark invite as used
  UPDATE household_invites
  SET used_by = auth.uid(), used_at = NOW()
  WHERE id = invite_record.id;

  -- Delete old household if it was just for this user
  IF user_current_household IS NOT NULL THEN
    DELETE FROM households
    WHERE id = user_current_household
      AND NOT EXISTS (
        SELECT 1 FROM user_profiles WHERE household_id = user_current_household AND id != auth.uid()
      );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATED_AT TRIGGERS FOR NEW TABLES
-- =====================================================

CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SIMPLE FIX: Remove Recursive Policies
-- =====================================================

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their household" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view household profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Simple non-recursive policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- =====================================================
-- For viewing household members, create a SECURITY DEFINER function
-- that bypasses RLS entirely
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_household_members()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  household_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_household UUID;
BEGIN
  -- Get current user's household_id
  SELECT up.household_id INTO user_household
  FROM user_profiles up
  WHERE up.id = auth.uid();

  -- Return all members in the same household
  RETURN QUERY
  SELECT up.id, up.display_name, up.household_id
  FROM user_profiles up
  WHERE up.household_id = user_household;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_household_members() TO authenticated;

-- =====================================================
-- Simplify other policies to avoid recursion
-- =====================================================

-- Create simple helper function that doesn't use RLS
CREATE OR REPLACE FUNCTION public.current_user_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id FROM public.user_profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_household_id() TO authenticated;

-- Update all policies to use the simple function
DROP POLICY IF EXISTS "Users can view shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete shopping lists in their household" ON shopping_lists;

CREATE POLICY "Users can view shopping lists in their household"
  ON shopping_lists FOR SELECT
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can insert shopping lists in their household"
  ON shopping_lists FOR INSERT
  WITH CHECK (household_id = public.current_user_household_id());

CREATE POLICY "Users can update shopping lists in their household"
  ON shopping_lists FOR UPDATE
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can delete shopping lists in their household"
  ON shopping_lists FOR DELETE
  USING (household_id = public.current_user_household_id());

-- Task Lists
DROP POLICY IF EXISTS "Users can view task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can insert task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can update task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can delete task lists in their household" ON task_lists;

CREATE POLICY "Users can view task lists in their household"
  ON task_lists FOR SELECT
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can insert task lists in their household"
  ON task_lists FOR INSERT
  WITH CHECK (household_id = public.current_user_household_id());

CREATE POLICY "Users can update task lists in their household"
  ON task_lists FOR UPDATE
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can delete task lists in their household"
  ON task_lists FOR DELETE
  USING (household_id = public.current_user_household_id());

-- Voucher Lists
DROP POLICY IF EXISTS "Users can view voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can insert voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can update voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can delete voucher lists in their household" ON voucher_lists;

CREATE POLICY "Users can view voucher lists in their household"
  ON voucher_lists FOR SELECT
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can insert voucher lists in their household"
  ON voucher_lists FOR INSERT
  WITH CHECK (household_id = public.current_user_household_id());

CREATE POLICY "Users can update voucher lists in their household"
  ON voucher_lists FOR UPDATE
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can delete voucher lists in their household"
  ON voucher_lists FOR DELETE
  USING (household_id = public.current_user_household_id());

-- Households
DROP POLICY IF EXISTS "Users can view their own household" ON households;
DROP POLICY IF EXISTS "Users can update their own household" ON households;

CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (id = public.current_user_household_id());

CREATE POLICY "Users can update their own household"
  ON households FOR UPDATE
  USING (id = public.current_user_household_id());

-- Household Invites
DROP POLICY IF EXISTS "Users can view invites for their household" ON household_invites;
DROP POLICY IF EXISTS "Users can create invites for their household" ON household_invites;

CREATE POLICY "Users can view invites for their household"
  ON household_invites FOR SELECT
  USING (household_id = public.current_user_household_id());

CREATE POLICY "Users can create invites for their household"
  ON household_invites FOR INSERT
  WITH CHECK (household_id = public.current_user_household_id());

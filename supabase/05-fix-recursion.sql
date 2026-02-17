-- =====================================================
-- Fix Infinite Recursion in RLS Policies
-- =====================================================

-- Drop problematic recursive policies
DROP POLICY IF EXISTS "Users can view profiles in their household" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Recreate with non-recursive logic
-- Policy 1: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can view other profiles in same household (using a function to avoid recursion)
CREATE POLICY "Users can view household profiles"
  ON user_profiles FOR SELECT
  USING (
    household_id IN (
      SELECT up.household_id
      FROM user_profiles up
      WHERE up.id = auth.uid()
      LIMIT 1
    )
  );

-- Policy 3: Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- =====================================================
-- Create a helper function to get user's household_id
-- This breaks the recursion by using SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT household_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.user_household_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_household_id() TO anon;

-- =====================================================
-- Update all other policies to use the helper function
-- =====================================================

-- Shopping Lists policies
DROP POLICY IF EXISTS "Users can view shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can insert shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can update shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can delete shopping lists in their household" ON shopping_lists;

CREATE POLICY "Users can view shopping lists in their household"
  ON shopping_lists FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert shopping lists in their household"
  ON shopping_lists FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update shopping lists in their household"
  ON shopping_lists FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete shopping lists in their household"
  ON shopping_lists FOR DELETE
  USING (household_id = public.user_household_id());

-- Task Lists policies
DROP POLICY IF EXISTS "Users can view task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can insert task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can update task lists in their household" ON task_lists;
DROP POLICY IF EXISTS "Users can delete task lists in their household" ON task_lists;

CREATE POLICY "Users can view task lists in their household"
  ON task_lists FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert task lists in their household"
  ON task_lists FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update task lists in their household"
  ON task_lists FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete task lists in their household"
  ON task_lists FOR DELETE
  USING (household_id = public.user_household_id());

-- Voucher Lists policies
DROP POLICY IF EXISTS "Users can view voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can insert voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can update voucher lists in their household" ON voucher_lists;
DROP POLICY IF EXISTS "Users can delete voucher lists in their household" ON voucher_lists;

CREATE POLICY "Users can view voucher lists in their household"
  ON voucher_lists FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can insert voucher lists in their household"
  ON voucher_lists FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

CREATE POLICY "Users can update voucher lists in their household"
  ON voucher_lists FOR UPDATE
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can delete voucher lists in their household"
  ON voucher_lists FOR DELETE
  USING (household_id = public.user_household_id());

-- Households policies
DROP POLICY IF EXISTS "Users can view their own household" ON households;
DROP POLICY IF EXISTS "Users can update their own household" ON households;

CREATE POLICY "Users can view their own household"
  ON households FOR SELECT
  USING (id = public.user_household_id());

CREATE POLICY "Users can update their own household"
  ON households FOR UPDATE
  USING (id = public.user_household_id());

-- Household Invites policies
DROP POLICY IF EXISTS "Users can view invites for their household" ON household_invites;
DROP POLICY IF EXISTS "Users can create invites for their household" ON household_invites;

CREATE POLICY "Users can view invites for their household"
  ON household_invites FOR SELECT
  USING (household_id = public.user_household_id());

CREATE POLICY "Users can create invites for their household"
  ON household_invites FOR INSERT
  WITH CHECK (household_id = public.user_household_id());

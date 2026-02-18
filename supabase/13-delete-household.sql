-- =====================================================
-- HomeHub: Delete Household (Owner Only)
-- =====================================================
-- Run this in Supabase SQL Editor.
-- =====================================================


-- =====================================================
-- STEP 1: RLS DELETE policy on households (owner only)
-- =====================================================

DROP POLICY IF EXISTS "Only household owner can delete household" ON households;

CREATE POLICY "Only household owner can delete household"
  ON households FOR DELETE
  USING (owner_id = auth.uid());


-- =====================================================
-- STEP 2: delete_household() RPC
-- =====================================================
-- Server-side owner check so the action is safe even if
-- the RLS policy were misconfigured.
--
-- Cascade chain on household DELETE (already in place):
--   households → user_profiles, household_invites,
--                shopping_lists → shopping_items, master_list_items
--                task_lists    → tasks
--                voucher_lists → voucher_items

CREATE OR REPLACE FUNCTION public.delete_household()
RETURNS VOID AS $$
DECLARE
  user_household_id UUID;
BEGIN
  -- Resolve caller's household
  SELECT household_id INTO user_household_id
  FROM user_profiles
  WHERE id = auth.uid();

  IF user_household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;

  -- Enforce ownership
  IF NOT EXISTS (
    SELECT 1 FROM households
    WHERE id = user_household_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can delete the household';
  END IF;

  -- Delete — all child rows cascade automatically
  DELETE FROM households WHERE id = user_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_household() TO authenticated;


-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'households';
-- Expected: SELECT, UPDATE (owner-only from step 12), DELETE (owner-only, new)
-- =====================================================

-- =====================================================
-- HomeHub: Security Hardening
-- =====================================================
-- Run this in Supabase SQL Editor.
-- Safe to re-run (idempotent where possible).
-- =====================================================


-- =====================================================
-- STEP 1: Owner concept — add owner_id to households
-- =====================================================

ALTER TABLE households
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: set owner_id to the earliest user_profile per household
-- (the first person who created/joined that household)
UPDATE households h
SET owner_id = (
  SELECT up.id
  FROM user_profiles up
  WHERE up.household_id = h.id
  ORDER BY up.created_at ASC
  LIMIT 1
)
WHERE owner_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_households_owner ON households(owner_id);


-- =====================================================
-- STEP 2: Update handle_new_user trigger
-- Set owner_id = the new user when their household is created
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create household, setting the creator as owner immediately
  INSERT INTO households (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Household'),
    NEW.id
  )
  RETURNING id INTO new_household_id;

  -- Create user profile linked to the new household
  INSERT INTO user_profiles (id, household_id, display_name)
  VALUES (
    NEW.id,
    new_household_id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================
-- STEP 3: Cascade Deletes — add FK from data tables to households
-- =====================================================
-- shopping_lists, task_lists, voucher_lists all have household_id UUID NOT NULL
-- but no foreign key → households. Add them now.

ALTER TABLE shopping_lists
  DROP CONSTRAINT IF EXISTS fk_shopping_lists_household,
  ADD CONSTRAINT fk_shopping_lists_household
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

ALTER TABLE task_lists
  DROP CONSTRAINT IF EXISTS fk_task_lists_household,
  ADD CONSTRAINT fk_task_lists_household
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

ALTER TABLE voucher_lists
  DROP CONSTRAINT IF EXISTS fk_voucher_lists_household,
  ADD CONSTRAINT fk_voucher_lists_household
    FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

-- Cascade chain when a household is deleted:
--   households
--   ├── user_profiles           (ON DELETE CASCADE via 02-auth-schema.sql)
--   ├── household_invites       (ON DELETE CASCADE via 02-auth-schema.sql)
--   ├── shopping_lists          (ON DELETE CASCADE ← NEW)
--   │   ├── shopping_items      (ON DELETE CASCADE via 01-schema.sql)
--   │   └── master_list_items   (ON DELETE CASCADE via 08-masterlist-migration.sql)
--   ├── task_lists              (ON DELETE CASCADE ← NEW)
--   │   └── tasks               (ON DELETE CASCADE via 01-schema.sql)
--   └── voucher_lists           (ON DELETE CASCADE ← NEW)
--       └── voucher_items       (ON DELETE CASCADE via 01-schema.sql)


-- =====================================================
-- STEP 4: Owner-only create_household_invite (default 24 hours)
-- =====================================================

CREATE OR REPLACE FUNCTION create_household_invite(days_valid INTEGER DEFAULT 1)
RETURNS TEXT AS $$
DECLARE
  user_household_id UUID;
  new_invite_code TEXT;
BEGIN
  -- Get the caller's household
  SELECT household_id INTO user_household_id
  FROM user_profiles
  WHERE id = auth.uid();

  IF user_household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;

  -- Only the household owner may generate invite codes
  IF NOT EXISTS (
    SELECT 1 FROM households
    WHERE id = user_household_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can create invite codes';
  END IF;

  -- Generate a unique code
  LOOP
    new_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM household_invites WHERE invite_code = new_invite_code
    );
  END LOOP;

  -- Insert the invite
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


-- =====================================================
-- STEP 5: Remove household member (owner only)
-- =====================================================

CREATE OR REPLACE FUNCTION remove_household_member(member_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  caller_household_id UUID;
  member_display_name TEXT;
  new_household_id UUID;
BEGIN
  -- Get caller's household
  SELECT household_id INTO caller_household_id
  FROM user_profiles
  WHERE id = auth.uid();

  -- Caller must be the household owner
  IF NOT EXISTS (
    SELECT 1 FROM households
    WHERE id = caller_household_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can remove members';
  END IF;

  -- Cannot remove yourself
  IF member_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself from the household';
  END IF;

  -- Get member's display name for the new household name
  SELECT display_name INTO member_display_name
  FROM user_profiles
  WHERE id = member_id
    AND household_id = caller_household_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in your household';
  END IF;

  -- Create a fresh household for the removed member
  INSERT INTO households (name, owner_id)
  VALUES (
    COALESCE(member_display_name, 'My') || '''s Household',
    member_id
  )
  RETURNING id INTO new_household_id;

  -- Move them to their new household
  UPDATE user_profiles
  SET household_id = new_household_id
  WHERE id = member_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_household_member(UUID) TO authenticated;


-- =====================================================
-- STEP 6: Update get_household_members to include is_owner flag
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_household_members()
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  household_id UUID,
  is_owner BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_household UUID;
  hh_owner_id UUID;
BEGIN
  SELECT up.household_id INTO user_household
  FROM user_profiles up
  WHERE up.id = auth.uid();

  SELECT h.owner_id INTO hh_owner_id
  FROM households h
  WHERE h.id = user_household;

  RETURN QUERY
  SELECT
    up.id,
    up.display_name,
    up.household_id,
    (up.id = hh_owner_id) AS is_owner
  FROM user_profiles up
  WHERE up.household_id = user_household
  ORDER BY is_owner DESC, up.created_at ASC; -- owner first
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_household_members() TO authenticated;


-- =====================================================
-- STEP 7: Tighten households UPDATE policy — owner only
-- =====================================================

DROP POLICY IF EXISTS "Users can update their own household" ON households;

CREATE POLICY "Only household owner can update household"
  ON households FOR UPDATE
  USING (owner_id = auth.uid());


-- =====================================================
-- STEP 8: Tighten household_invites INSERT policy — owner only
-- =====================================================

DROP POLICY IF EXISTS "Users can create invites for their household" ON household_invites;

CREATE POLICY "Only household owner can create invites"
  ON household_invites FOR INSERT
  WITH CHECK (
    household_id = public.current_user_household_id()
    AND EXISTS (
      SELECT 1 FROM households
      WHERE id = household_id
        AND owner_id = auth.uid()
    )
  );


-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, verify:
--
-- 1. owner_id populated:
--    SELECT id, name, owner_id FROM households;
--
-- 2. FK constraints added:
--    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table,
--           rc.delete_rule
--    FROM information_schema.table_constraints tc
--    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
--    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
--    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
--    WHERE tc.constraint_type = 'FOREIGN KEY'
--      AND ccu.table_name = 'households';
--
-- 3. Policies updated:
--    SELECT policyname, cmd FROM pg_policies WHERE tablename IN ('households','household_invites');
-- =====================================================

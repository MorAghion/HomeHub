-- =============================================================
-- be-005: Household Safety Guards
-- Date: 2026-02-26
-- Changes:
--   1. join_household_via_invite — block user from joining a household
--      they already belong to (own-invite-code guard)
--   2. delete_household — block owner from deleting when other members
--      still exist, preventing accidental data loss for all members
-- =============================================================

-- =====================================================
-- GUARD 1: join_household_via_invite — already-member check
-- =====================================================
-- If the caller is already a member of the target household
-- (i.e. their current household_id == the invite's household_id),
-- raise an exception rather than silently no-op.
CREATE OR REPLACE FUNCTION public.join_household_via_invite(invite_code_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
  user_current_household UUID;
BEGIN
  -- Get current user's household
  SELECT household_id INTO user_current_household
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Find valid invite
  SELECT * INTO invite_record
  FROM public.household_invites
  WHERE invite_code = invite_code_param
    AND expires_at > NOW()
    AND used_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- be-005b guard: block joining a household you already belong to
  IF user_current_household = invite_record.household_id THEN
    RAISE EXCEPTION 'You are already a member of this household';
  END IF;

  -- Update user's household
  UPDATE public.user_profiles
  SET household_id = invite_record.household_id
  WHERE id = auth.uid();

  -- Mark invite as used
  UPDATE public.household_invites
  SET used_by = auth.uid(), used_at = NOW()
  WHERE id = invite_record.id;

  -- Delete old household if it was just for this user (no other members)
  IF user_current_household IS NOT NULL THEN
    DELETE FROM public.households
    WHERE id = user_current_household
      AND NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE household_id = user_current_household AND id != auth.uid()
      );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- =====================================================
-- GUARD 2: delete_household — block deletion when members > 1
-- =====================================================
-- Before deleting, check if any other user_profiles exist in the household.
-- If so, raise an exception to prevent cascading data loss for all members.
CREATE OR REPLACE FUNCTION public.delete_household()
RETURNS VOID AS $$
DECLARE
  user_household_id UUID;
  member_count      INT;
BEGIN
  -- Resolve caller's household
  SELECT household_id INTO user_household_id
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF user_household_id IS NULL THEN
    RAISE EXCEPTION 'User has no household';
  END IF;

  -- Enforce ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.households
    WHERE id = user_household_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only the household owner can delete the household';
  END IF;

  -- be-005a guard: block deletion when other members exist
  SELECT COUNT(*) INTO member_count
  FROM public.user_profiles
  WHERE household_id = user_household_id
    AND id != auth.uid();

  IF member_count > 0 THEN
    RAISE EXCEPTION 'Household has active members. Transfer ownership or remove all members before deleting.';
  END IF;

  -- Delete — all child rows cascade automatically
  DELETE FROM public.households WHERE id = user_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_household() TO authenticated;

-- =============================================================
-- HOTFIX: handle_new_user() — restore SET search_path = public
-- Date: 2026-02-25
-- Incident: Partners couldn't sign up in production.
--   Symptom:  "database error saving new user"
--   Log:      ERROR: 42P01: relation 'households' does not exist
--   Root cause: Migration 12 (security-hardening) rewrote handle_new_user()
--               without SET search_path = public. The Supabase Auth service
--               fires triggers in a restricted search_path context that does
--               not include 'public', so unqualified table names ('households',
--               'user_profiles') were not resolvable.
--   Fix applied: Directly in Supabase SQL Editor on 2026-02-25 (production
--                is already fixed). This migration captures that fix so the
--                schema is reproducible locally and tracked in version control.
-- DO NOT run supabase db push — production is already patched.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- Create household, setting the creator as owner immediately
  INSERT INTO public.households (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'My Household'),
    NEW.id
  )
  RETURNING id INTO new_household_id;

  -- Create user profile linked to the new household
  INSERT INTO public.user_profiles (id, household_id, display_name)
  VALUES (
    NEW.id,
    new_household_id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

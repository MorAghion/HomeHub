-- =====================================================
-- HomeHub: OAuth Tokens Schema
-- Migration: 15-oauth-tokens.sql
-- Date: 2026-02-22
-- =====================================================
-- Creates the oauth_tokens table for storing encrypted
-- Gmail and Google Calendar OAuth credentials.
--
-- ENCRYPTION CONTRACT:
--   access_token and refresh_token are stored as TEXT but
--   MUST be encrypted by the calling Edge Function before
--   INSERT/UPDATE and decrypted after SELECT.
--   Plain-text tokens must never be stored directly.
--
-- Safe to re-run (all statements guarded by IF NOT EXISTS).
-- =====================================================

-- =====================================================
-- STEP 1: Create oauth_tokens table
-- =====================================================

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL CHECK (provider IN ('gmail', 'google_calendar')),
  access_token  TEXT        NOT NULL,   -- encrypted by Edge Function before storing
  refresh_token TEXT        NOT NULL,   -- encrypted by Edge Function before storing
  expires_at    TIMESTAMPTZ NOT NULL,
  scopes        TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One token set per provider per user; allows UPSERT on conflict
  CONSTRAINT uq_oauth_tokens_user_provider UNIQUE (user_id, provider)
);

COMMENT ON TABLE  oauth_tokens                    IS 'Encrypted OAuth tokens for external providers (Gmail, Google Calendar). Tokens are encrypted by Edge Functions before storage.';
COMMENT ON COLUMN oauth_tokens.access_token       IS 'AES-256-GCM ciphertext (base64). Never stored in plaintext.';
COMMENT ON COLUMN oauth_tokens.refresh_token      IS 'AES-256-GCM ciphertext (base64). Never stored in plaintext.';
COMMENT ON COLUMN oauth_tokens.scopes             IS 'Granted OAuth scopes, e.g. {gmail.readonly, calendar.events}';

-- =====================================================
-- STEP 2: Index on (user_id, provider) for fast lookups
-- The UNIQUE constraint already creates an index, but we
-- add a named one for clarity and query planner hints.
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider
  ON oauth_tokens (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expires_at
  ON oauth_tokens (expires_at);

-- =====================================================
-- STEP 3: updated_at trigger
-- =====================================================

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: RLS Policies — user-scoped (not household-scoped)
-- OAuth tokens are personal credentials; no other user
-- (including household members) may read them.
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own OAuth tokens"   ON oauth_tokens;
DROP POLICY IF EXISTS "Users can insert their own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own OAuth tokens" ON oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own OAuth tokens" ON oauth_tokens;

CREATE POLICY "Users can view their own OAuth tokens"
  ON oauth_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own OAuth tokens"
  ON oauth_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own OAuth tokens"
  ON oauth_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own OAuth tokens"
  ON oauth_tokens FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- STEP 6: Revoke direct table access from anon role
-- Tokens must only be accessed via authenticated Edge
-- Functions that handle decryption — never via the
-- public anon key from the client.
-- =====================================================

REVOKE ALL ON oauth_tokens FROM anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Verification query:
--
-- SELECT
--   (SELECT COUNT(*) FROM information_schema.tables
--    WHERE table_schema='public' AND table_name='oauth_tokens') AS table_exists,
--   (SELECT rowsecurity FROM pg_tables WHERE tablename='oauth_tokens') AS rls_enabled,
--   (SELECT COUNT(*) FROM pg_indexes WHERE tablename='oauth_tokens') AS index_count,
--   (SELECT COUNT(*) FROM pg_policies WHERE tablename='oauth_tokens') AS policy_count,
--   (SELECT COUNT(*) FROM information_schema.table_constraints
--    WHERE table_name='oauth_tokens' AND constraint_name='uq_oauth_tokens_user_provider') AS unique_constraint;
-- =====================================================

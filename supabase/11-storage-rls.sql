-- =====================================================
-- HomeHub: Storage Bucket RLS Policies
-- =====================================================
-- Run this in Supabase SQL Editor AFTER creating the
-- 'voucher-images' bucket in Storage > Buckets.
--
-- IMPORTANT: Before running this script, go to
--   Supabase Dashboard → Storage → Buckets → New Bucket
--   Name: voucher-images
--   Public: OFF  (private bucket)
--
-- File path convention (enforced by these policies):
--   voucher-images/{household_id}/{voucher_item_id}/{filename}
--   e.g. voucher-images/abc-123/def-456/card.jpg
--
-- This ensures the folder name = household_id, so RLS
-- can verify membership without joining to app tables.
-- =====================================================

-- =====================================================
-- HELPER: Verify storage schema exists (Supabase built-in)
-- =====================================================

-- storage.objects columns used in policies:
--   bucket_id  TEXT    -- the bucket name
--   name       TEXT    -- the full file path inside the bucket
--   owner      UUID    -- auth.uid() of the uploader
-- =====================================================


-- =====================================================
-- POLICY: SELECT (download / read)
-- Only household members may read files.
-- =====================================================

DROP POLICY IF EXISTS "Household members can view their voucher images" ON storage.objects;

CREATE POLICY "Household members can view their voucher images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voucher-images'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );


-- =====================================================
-- POLICY: INSERT (upload)
-- A user may only upload into their own household folder.
-- =====================================================

DROP POLICY IF EXISTS "Household members can upload voucher images" ON storage.objects;

CREATE POLICY "Household members can upload voucher images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voucher-images'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );


-- =====================================================
-- POLICY: UPDATE (replace / rename)
-- A user may only update files in their own household folder.
-- =====================================================

DROP POLICY IF EXISTS "Household members can update their voucher images" ON storage.objects;

CREATE POLICY "Household members can update their voucher images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'voucher-images'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );


-- =====================================================
-- POLICY: DELETE
-- A user may only delete files in their own household folder.
-- =====================================================

DROP POLICY IF EXISTS "Household members can delete their voucher images" ON storage.objects;

CREATE POLICY "Household members can delete their voucher images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voucher-images'
    AND (storage.foldername(name))[1] IN (
      SELECT household_id::text
      FROM user_profiles
      WHERE id = auth.uid()
    )
  );


-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, confirm policies exist:
--
-- SELECT policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
--
-- Expected: 4 rows, one per command (SELECT/INSERT/UPDATE/DELETE)
-- =====================================================


-- =====================================================
-- USAGE NOTES FOR APP CODE
-- =====================================================
-- When migrating images from base64 (current) to Storage:
--
-- 1. Upload path:
--    const path = `${profile.household_id}/${voucherItemId}/${Date.now()}.jpg`;
--    await supabase.storage.from('voucher-images').upload(path, file);
--
-- 2. Get public (signed) URL:
--    const { data } = await supabase.storage
--      .from('voucher-images')
--      .createSignedUrl(path, 60 * 60); // 1-hour expiry
--
-- 3. Store signed URL (or just the path) in voucher_items.image_url
--    For persistent display, store the path and generate signed URLs on demand.
-- =====================================================

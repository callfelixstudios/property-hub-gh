-- migration file: supabase/migrations/20260811000007_secure_avatars_bucket.sql
-- L7 fix: the `avatars` bucket was created out-of-band (outside migrations) and
-- only ever hardened implicitly — no server-side size/MIME limits and no
-- owner-scoped object policies (the default storage policies allow any
-- authenticated user to write anywhere). This closes the storage gap:
--  1. Ensure the bucket exists and stays public (avatar images are rendered on
--     public profile pages via the public CDN URL).
--  2. Enforce a 2 MB per-file size limit and a strict MIME allowlist
--     (jpeg/png/webp — SVG deliberately excluded to remove the stored-XSS
--     vector), mirroring the property-images hardening in 20260807000008.
--  3. Owner-scoped INSERT/UPDATE/DELETE policies: the upload path is
--     `<userId>/avatar-<ts>.jpg`, so storage.foldername(name)[1] equals the
--     owning profile's UUID — exactly the pattern used for property-images.

-- ── 1. Ensure bucket exists as public ────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Size + MIME hardening (2 MB, jpeg/png/webp only) ──────────────────────
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- ── 3. Owner-scoped object policies (drop first for idempotency) ─────────────
DROP POLICY IF EXISTS "Users can upload avatars to their own folder" ON storage.objects;
CREATE POLICY "Users can upload avatars to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- migration file: supabase/migrations/20260807000008_secure_property_images.sql
-- M6 fix: harden the public `property-images` bucket.
--  1. Enforce a per-file size limit (10MB) and a strict MIME allowlist server-side
--     (SVG is deliberately excluded to remove the stored-XSS vector).
--  2. Replace the scope-less INSERT policy with an owner-scoped one.
--  3. Add owner-scoped UPDATE/DELETE policies (parity with the `avatars` bucket).
--  Public SELECT is retained: `listings.media_urls` stores absolute public CDN URLs.

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'property-images';

DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

CREATE POLICY "Users can upload property images to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

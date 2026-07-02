-- migration file: supabase/migrations/20260702000004_verification_hub.sql

-- 1. Create enum states for the verification state machine
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_type') THEN
    CREATE TYPE verification_status_type AS ENUM ('unverified', 'pending_review', 'verified', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_document_type') THEN
    CREATE TYPE verification_document_type AS ENUM ('ghana_card', 'business_registration', 'greda_license', 'grepa_license');
  END IF;
END$$;

-- 2. Extend the profiles table to track structural verification state
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status_type DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS document_type verification_document_type,
ADD COLUMN IF NOT EXISTS document_url text, -- Secure path key inside private storage bucket
ADD COLUMN IF NOT EXISTS license_number text, -- GREDA/GREPA reference number if applicable
ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Create indices for optimized query scheduling in the Admin View
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);

-- 4. Set up a secure, completely private storage bucket for verification docs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-documents', 'verification-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 5. RLS Policies for Storage: Only allow owners to upload, but allow ONLY corporate domain admins to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated users to upload verification images' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow authenticated users to upload verification images" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'verification-documents' AND (auth.uid()::text = owner::text));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow @propertyhubgh.com admins to read verification objects' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow @propertyhubgh.com admins to read verification objects" 
    ON storage.objects FOR SELECT 
    TO authenticated 
    USING (
      bucket_id = 'verification-documents' AND 
      LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com'
    );
  END IF;
END$$;

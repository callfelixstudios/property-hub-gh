-- migration file: supabase/migrations/20260701000001_listing_moderation_queue.sql

-- 1. Extend the listings table structure with moderation parameters
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' 
CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- 2. Create index on moderation_status for high-performance dashboard reads
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status ON public.listings(moderation_status);

-- 3. Solidify Row-Level Security (RLS) for Listing Moderation Actions
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Clear previous administrative update constraints if they exist
DROP POLICY IF EXISTS "Admins can update listings for moderation" ON public.listings;

-- Grant updates exclusively to corporate email domains
CREATE POLICY "Admins can update listings for moderation" 
ON public.listings 
FOR UPDATE 
TO authenticated
USING (
  LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com'
)
WITH CHECK (
  LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com'
);

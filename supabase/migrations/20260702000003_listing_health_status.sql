-- 20260702000003_listing_health_status.sql
-- Adds listing health tracking for ghost listing detection and expiry

-- 1. Add health tracking columns
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_health TEXT DEFAULT 'fresh'
    CHECK (listing_health IN ('fresh', 'stale', 'expired', 'archived')),
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_ping_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Index for health status queries
CREATE INDEX IF NOT EXISTS idx_listings_health ON public.listings(listing_health);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at);

-- 3. Function to mark stale listings (active listings older than 30 days without verification)
CREATE OR REPLACE FUNCTION public.fn_update_stale_listings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Admin domain check
  IF LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  UPDATE public.listings
  SET listing_health = 'stale'
  WHERE status = 'active'
    AND listing_health = 'fresh'
    AND moderation_status = 'approved'
    AND created_at < NOW() - INTERVAL '30 days'
    AND (last_verified_at IS NULL OR last_verified_at < NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_update_stale_listings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_update_stale_listings() TO authenticated;

-- 4. Backfill: Mark existing listings older than 30 days as stale
UPDATE public.listings
SET listing_health = 'stale'
WHERE status = 'active'
  AND listing_health = 'fresh'
  AND moderation_status = 'approved'
  AND created_at < NOW() - INTERVAL '30 days'
  AND (last_verified_at IS NULL OR last_verified_at < NOW() - INTERVAL '30 days');

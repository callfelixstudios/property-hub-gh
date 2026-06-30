-- 20260630000002_listing_moderation_queue.sql
-- Adds moderation queue fields to listings table and updates status behavior

-- Step 1: Add moderation columns to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moderated_by TEXT; -- admin email for audit trail

-- Step 2: Backfill all EXISTING active listings as 'approved'
-- (they were already live, so they are considered pre-approved)
UPDATE public.listings
  SET moderation_status = 'approved'
  WHERE status = 'active' AND (moderation_status IS NULL OR moderation_status = 'pending');

-- Step 3: Change the default status for NEW listings to 'pending'
-- This means new listings won't be publicly visible until approved
ALTER TABLE public.listings
  ALTER COLUMN status SET DEFAULT 'pending';

-- Step 4: Index on moderation_status for fast queue queries
CREATE INDEX IF NOT EXISTS idx_listings_moderation_status
  ON public.listings (moderation_status, created_at DESC);

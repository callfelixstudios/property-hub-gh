-- 20260813000002_allow_suspended_deleted_moderation.sql
-- Extend the listings.moderation_status CHECK constraint to permit the new
-- 'suspended' (admin takedown, unsuspendable) and 'deleted' (soft delete)
-- moderation states introduced by the suspend/soft-delete workflow.

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_moderation_status_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_moderation_status_check
  CHECK (moderation_status = ANY (ARRAY[
    'pending', 'approved', 'rejected', 'flagged', 'suspended', 'deleted'
  ]::text[]));
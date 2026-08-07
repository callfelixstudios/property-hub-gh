-- 20260807000000_close_listing_moderation_bypass.sql
-- H2 fix: unmoderated/rejected listings were publicly readable.
-- 1. Remove the ad-hoc "public_read_listings" (USING true) policy.
-- 2. Public visibility now requires status='active' AND moderation_status='approved'.
-- 3. DB-level guard: non-admins can never inject/change moderation_status
--    (closes direct REST API self-approval + insert-time bypass).
-- 4. Backfill inconsistent rows so pending/rejected/flagged listings are hidden.

-- ── 1. Remove the wide-open public read policy ─────────────────────────────
DROP POLICY IF EXISTS "public_read_listings" ON public.listings;

-- ── 2. Replace the public read policy with an approved+active gate ────────
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;

CREATE POLICY "Anyone can view approved active listings"
  ON public.listings
  FOR SELECT
  USING (
    (status = 'active' AND moderation_status = 'approved')
    OR (auth.uid() = poster_id)
  );

-- ── 3. Guard trigger: moderation is admin-only, at every entry point ──────
CREATE OR REPLACE FUNCTION public.enforce_listing_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

  IF TG_OP = 'INSERT' THEN
    -- Client-submitted moderation_status can never be trusted; force pending
    -- unless the caller is a corporate admin.
    IF NOT v_is_admin THEN
      NEW.moderation_status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Only admins may change moderation state (approve/reject/flag).
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Only Property Hub GH admins can change listing moderation status';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_moderation_guard ON public.listings;

CREATE TRIGGER trg_listing_moderation_guard
  BEFORE INSERT OR UPDATE OF moderation_status ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_moderation();

-- Internal trigger-only guard: not callable as a public function.
REVOKE EXECUTE ON FUNCTION public.enforce_listing_moderation() FROM PUBLIC, anon, authenticated;

-- ── 4. Backfill: hide any pre-existing active-but-unapproved listings ──────
UPDATE public.listings
SET status = 'pending'
WHERE status = 'active'
  AND moderation_status IS DISTINCT FROM 'approved';

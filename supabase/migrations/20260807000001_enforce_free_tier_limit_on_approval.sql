-- 20260807000001_enforce_free_tier_limit_on_approval.sql
-- Free-tier cap was enforced only on INSERT (when status used to default to
-- 'active'). Since listings now insert as 'pending', the limit never fires at
-- approval time: an admin approving a 3rd free-tier listing would flip it to
-- 'active' and blow past the cap.
-- Fix: enforce the cap on BEFORE INSERT OR UPDATE OF status, computing the
-- post-write active count so approval/activation of a pending listing counts.
-- Also harden the function (SET search_path, revoke PUBLIC EXECUTE).

CREATE OR REPLACE FUNCTION public.check_free_tier_listing_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_tier text;
  v_active_count integer;
BEGIN
  SELECT account_tier INTO v_account_tier
  FROM public.profiles
  WHERE id = NEW.poster_id;

  IF v_account_tier = 'free' THEN
    -- Count currently stored active rows for this poster.
    SELECT count(*) INTO v_active_count
    FROM public.listings
    WHERE poster_id = NEW.poster_id AND status = 'active';

    -- This row itself becomes active via INSERT('active') or UPDATE status -> 'active'.
    IF NEW.status = 'active'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
      v_active_count := v_active_count + 1;
    END IF;

    -- Maximum concurrent active listings for free tier = 2.
    IF v_active_count > 2 THEN
      RAISE EXCEPTION 'Free tier users are limited to 2 active listings.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_free_tier_limit ON public.listings;

CREATE TRIGGER enforce_free_tier_limit
  BEFORE INSERT OR UPDATE OF status ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_free_tier_listing_limit();

-- Internal trigger-only guard: not callable as a public function.
REVOKE EXECUTE ON FUNCTION public.check_free_tier_listing_limit() FROM PUBLIC, anon, authenticated;
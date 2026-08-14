-- 20260813000003_admin_bypass_free_tier_limit.sql
-- The free-tier active-listing cap is a user self-service constraint.
-- Platform admins acting on listings (approve / renew / restore from the
-- moderation queue) must not be blocked by the poster's plan tier, matching
-- the existing admin bypasses in RLS and the moderation guard trigger.

CREATE OR REPLACE FUNCTION public.check_free_tier_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_account_tier text;
  v_active_count integer;
BEGIN
  -- Platform admins are exempt: moderation actions are explicit platform
  -- decisions, not user self-service.
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

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
$function$;
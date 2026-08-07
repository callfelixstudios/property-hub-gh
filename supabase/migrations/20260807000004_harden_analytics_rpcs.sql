-- 20260807000004_harden_analytics_rpcs.sql
-- M1 fix: increment_listing_views / increment_whatsapp_leads were SECURITY DEFINER,
-- callable by PUBLIC (incl. anon), with mutable search_path and no validation or
-- rate limiting -> any client could inflate counters on any listing.
-- 1. Harden both functions: fixed search_path, listing must be public (active+approved),
--    and a 60s throttle per (listing_id, event_type).
-- 2. Reset EXECUTE grants: revoke blanket PUBLIC, keep explicit anon + authenticated.
-- 3. Owner-scoped SELECT policy on property_analytics so dashboards can read their own.

-- ── 1. Hardened counters ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_listing_views(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Guard: only count publicly visible (active + approved) listings.
  IF NOT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = row_id
      AND status = 'active'
      AND moderation_status = 'approved'
  ) THEN
    RETURN;
  END IF;

  -- Throttle: at most 1 view event per listing per 60s window.
  IF EXISTS (
    SELECT 1 FROM public.property_analytics
    WHERE listing_id = row_id
      AND event_type = 'view'
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.property_analytics (listing_id, event_type)
  VALUES (row_id, 'view');

  UPDATE public.listings
  SET views = COALESCE(views, 0) + 1
  WHERE id = row_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_whatsapp_leads(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only count publicly visible (active + approved) listings.
  IF NOT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = row_id
      AND status = 'active'
      AND moderation_status = 'approved'
  ) THEN
    RETURN;
  END IF;

  -- Throttle: at most 1 whatsapp lead event per listing per 60s window.
  IF EXISTS (
    SELECT 1 FROM public.property_analytics
    WHERE listing_id = row_id
      AND event_type = 'whatsapp'
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.property_analytics (listing_id, event_type)
  VALUES (row_id, 'whatsapp');

  UPDATE public.listings
  SET whatsapp_leads_count = COALESCE(whatsapp_leads_count, 0) + 1
  WHERE id = row_id;
END;
$$;

-- ── 2. Restrict EXECUTE (explicit roles only, no blanket PUBLIC) ────────────
REVOKE ALL ON FUNCTION public.increment_listing_views(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_whatsapp_leads(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_listing_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_whatsapp_leads(UUID) TO anon, authenticated;

-- ── 3. property_analytics: owner-scoped read for dashboards ──────────────────
DROP POLICY IF EXISTS "Owners can read analytics for their listings" ON public.property_analytics;

CREATE POLICY "Owners can read analytics for their listings"
  ON public.property_analytics
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = property_analytics.listing_id
        AND l.poster_id = auth.uid()
    )
  );
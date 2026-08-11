-- migration file: supabase/migrations/20260811000005_harden_analytics_rpc_throttle.sql
-- M6 fix (DB part): the 60s throttle added in 20260807000004 is keyed only on
-- (listing_id, event_type), so it is global per listing. A single authenticated
-- user can monopolize a listing's view/lead window and starve genuine traffic
-- (or simply inflate their own counters while suppressing others'). This closes
-- the throttling gap:
--  1. Add caller_id (NULL = anonymous) to property_analytics and index it with
--     the existing throttle keys.
--  2. Recreate both counter functions so the 60s window is keyed per caller:
--     `caller_id IS NOT DISTINCT FROM caller` — an authenticated user gets their
--     own window per listing (they can no longer block others), while anonymous
--     requests (caller_id NULL) retain the same per-listing guard as today.
--  3. The active+approved listing guard and the counter UPDATEs are unchanged.
--  4. Re-apply EXECUTE grants: revoke blanket PUBLIC, keep explicit anon +
--     authenticated (public listing pages must keep counting).

-- ── 1. caller_id column + throttle index ─────────────────────────────────────
ALTER TABLE public.property_analytics
  ADD COLUMN IF NOT EXISTS caller_id UUID;

CREATE INDEX IF NOT EXISTS idx_property_analytics_throttle
  ON public.property_analytics(listing_id, event_type, caller_id);

-- ── 2. Hardened counters (per-caller 60s throttle) ──────────────────────────
CREATE OR REPLACE FUNCTION public.increment_listing_views(row_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller uuid := auth.uid();
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

  -- Throttle: at most 1 view event per caller per listing per 60s window.
  -- IS NOT DISTINCT FROM treats anonymous callers (NULL = NULL) as one group,
  -- so anon keeps the original per-listing guard while authenticated callers
  -- each get their own window.
  IF EXISTS (
    SELECT 1 FROM public.property_analytics
    WHERE listing_id = row_id
      AND event_type = 'view'
      AND caller_id IS NOT DISTINCT FROM caller
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.property_analytics (listing_id, event_type, caller_id)
  VALUES (row_id, 'view', caller);

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
DECLARE
  caller uuid := auth.uid();
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

  -- Throttle: at most 1 whatsapp lead event per caller per listing per 60s window.
  IF EXISTS (
    SELECT 1 FROM public.property_analytics
    WHERE listing_id = row_id
      AND event_type = 'whatsapp'
      AND caller_id IS NOT DISTINCT FROM caller
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.property_analytics (listing_id, event_type, caller_id)
  VALUES (row_id, 'whatsapp', caller);

  UPDATE public.listings
  SET whatsapp_leads_count = COALESCE(whatsapp_leads_count, 0) + 1
  WHERE id = row_id;
END;
$$;

-- ── 3. Restrict EXECUTE (explicit roles only, no blanket PUBLIC) ────────────
REVOKE ALL ON FUNCTION public.increment_listing_views(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_whatsapp_leads(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_listing_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_whatsapp_leads(UUID) TO anon, authenticated;

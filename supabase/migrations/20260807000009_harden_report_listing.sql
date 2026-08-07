-- migration file: supabase/migrations/20260807000009_harden_report_listing.sql
-- M8 fix: report_listing was an unrestricted, non-validated function callable by
-- anon/authenticated with no throttle. Combined with the auto-flag at 3 reports,
-- a caller could arbitrarily flip listings into 'flagged_review'.
--  1. Recreate as SECURITY DEFINER (owner bypasses RLS-closed property_reports)
--     with a fixed search_path and explicit input validation.
--  2. Throttle: max 3 reports per listing per 60-minute window, and reject
--     reports for missing listings.
--  3. Revoke blanket PUBLIC EXECUTE; keep explicit anon + authenticated grants.
--  4. App-level per-IP rate limiting happens in /api/report (rateLimit util).

CREATE OR REPLACE FUNCTION public.report_listing(
  p_listing_id uuid,
  p_reason text,
  p_details text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count INT;
  report_count INT;
BEGIN
  -- Validate inputs / reject empty or oversized payloads.
  IF p_listing_id IS NULL
     OR p_reason IS NULL
     OR btrim(p_reason) = ''
     OR length(p_reason) > 200
     OR (p_details IS NOT NULL AND length(p_details) > 2000) THEN
    RAISE EXCEPTION 'Invalid report payload';
  END IF;

  -- Listing must exist.
  IF NOT EXISTS (
    SELECT 1 FROM public.listings WHERE id = p_listing_id
  ) THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  -- Throttle: at most 3 reports per listing per 60-minute window.
  SELECT COUNT(*) INTO recent_count
  FROM public.property_reports
  WHERE listing_id = p_listing_id
    AND created_at > now() - interval '60 minutes';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many reports for this listing. Please try again later.';
  END IF;

  INSERT INTO public.property_reports (listing_id, reason, details)
  VALUES (p_listing_id, btrim(p_reason), NULLIF(btrim(p_details), ''));

  SELECT COUNT(*) INTO report_count
  FROM public.property_reports
  WHERE listing_id = p_listing_id;

  IF report_count >= 3 THEN
    UPDATE public.listings
    SET status = 'flagged_review'
    WHERE id = p_listing_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.report_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_listing(uuid, text, text) TO anon, authenticated;
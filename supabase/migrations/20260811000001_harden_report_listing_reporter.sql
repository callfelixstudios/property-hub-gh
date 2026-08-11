-- migration file: supabase/migrations/20260811000001_harden_report_listing_reporter.sql
-- H1 fix: report_listing (SECURITY DEFINER, from 20260807000009) accepted anonymous
-- calls with no per-caller identity, so the cumulative auto-flag at 3 reports could
-- be triggered by a single attacker spamming reports. This closes the takedown:
--  1. Track reporter_id on every report (auth.uid(), NULL for anon) so report
--     volume is attributable.
--  2. Keep the per-listing 60-minute window throttle (max 3 reports).
--  3. ADD a per-reporter 60-minute window throttle (max 10 reports across all
--     listings) for authenticated callers — stops one signed-in account from
--     mass-flagging many listings.
--  4. Auto-flag now keys on count(DISTINCT reporter_id) >= 3 instead of total
--     row count. count(DISTINCT) ignores NULLs, so anonymous reports (NULL
--     reporter_id) never count toward the threshold: a single anonymous attacker
--     can never trigger the flag, and it now takes 3 different signed-in
--     accounts to flip a listing into 'flagged_review'.
--  5. Re-apply EXECUTE grants to anon + authenticated (the /api/report route
--     must keep working for both audiences).

-- ── 1. reporter_id column + index ────────────────────────────────────────────
ALTER TABLE public.property_reports
  ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_property_reports_reporter ON public.property_reports(reporter_id);

-- ── 2. Recreate report_listing with attribution + per-reporter throttle ───────
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
  v_reporter uuid := auth.uid();
  v_recent_count INT;
  v_reporter_reports INT;
  v_distinct_reporters INT;
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

  -- Throttle 1 (unchanged): at most 3 reports per listing per 60-minute window.
  SELECT COUNT(*) INTO v_recent_count
  FROM public.property_reports
  WHERE listing_id = p_listing_id
    AND created_at > now() - interval '60 minutes';

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'Too many reports for this listing. Please try again later.';
  END IF;

  -- Throttle 2 (NEW): per-reporter throttle — max 10 reports per 60 minutes
  -- across ALL listings for signed-in users. Stops a single authenticated
  -- account from mass-flagging listings to grief competitors.
  -- Anonymous callers (v_reporter IS NULL) skip this check; the listing-level
  -- throttle and the distinct-reporter auto-flag guard that path instead.
  IF v_reporter IS NOT NULL THEN
    SELECT COUNT(*) INTO v_reporter_reports
    FROM public.property_reports
    WHERE reporter_id = v_reporter
      AND created_at > now() - interval '60 minutes';

    IF v_reporter_reports >= 10 THEN
      RAISE EXCEPTION 'Too many reports from your account. Please try again later.';
    END IF;
  END IF;

  INSERT INTO public.property_reports (listing_id, reason, details, reporter_id)
  VALUES (p_listing_id, btrim(p_reason), NULLIF(btrim(p_details), ''), v_reporter);

  -- Auto-flag: flip to 'flagged_review' only when at least 3 DISTINCT
  -- reporters have reported the listing. count(DISTINCT reporter_id) ignores
  -- NULLs, so anonymous reports (NULL reporter_id) never count toward the
  -- threshold — one anonymous attacker can never trigger the flag; it takes
  -- 3 different signed-in accounts to flag a listing.
  SELECT count(DISTINCT reporter_id) INTO v_distinct_reporters
  FROM public.property_reports
  WHERE listing_id = p_listing_id;

  IF v_distinct_reporters >= 3 THEN
    UPDATE public.listings
    SET status = 'flagged_review'
    WHERE id = p_listing_id;
  END IF;
END;
$$;

-- ── 3. Re-apply EXECUTE grants (explicit roles only, no blanket PUBLIC) ─────
REVOKE ALL ON FUNCTION public.report_listing(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_listing(uuid, text, text) TO anon, authenticated;

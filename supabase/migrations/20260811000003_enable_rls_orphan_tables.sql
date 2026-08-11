-- migration file: supabase/migrations/20260811000003_enable_rls_orphan_tables.sql
-- H3 fix: saved_listings, property_reports and the RLS state of property_analytics
-- existed only in the live database (created out-of-band, outside migrations),
-- so fresh environments were missing them — or worse, missing RLS entirely on
-- them. This closes the orphan-table gap:
--  1. Materialize the out-of-band tables in migrations (IF NOT EXISTS keeps the
--     live copies untouched).
--  2. Enable ROW LEVEL SECURITY on property_analytics, saved_listings and
--     property_reports so reads/writes are governed by explicit policies.
--  3. saved_listings: owner-scoped INSERT/SELECT/DELETE policies for
--     authenticated users; writes also require public.is_active_user() so
--     suspended accounts cannot mutate saved listings (mirrors 20260807000014).
--  4. property_analytics: owner-scoped read for listing owners (dashboards).
--     All writes go through the SECURITY DEFINER counter functions which bypass
--     RLS as the table owner.
--  5. property_reports: NO policies (deny-all). The only write path is the
--     SECURITY DEFINER public.report_listing() function which bypasses RLS as
--     the owner; nobody — anon or authenticated — can read or write report rows
--     directly through PostgREST.

-- ── 1. Materialize out-of-band tables (live DB keeps its existing copies) ────
CREATE TABLE IF NOT EXISTS public.saved_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user_id ON public.saved_listings(user_id);

CREATE TABLE IF NOT EXISTS public.property_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  reporter_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_reports_listing ON public.property_reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_property_reports_reporter ON public.property_reports(reporter_id);

-- ── 2. Enable RLS on all three tables ────────────────────────────────────────
ALTER TABLE public.property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;

-- ── 3. saved_listings: owner-scoped, active-account-guarded writes ──────────
-- INSERT/DELETE were already created by 20260807000014 against the live table;
-- DROP IF EXISTS first so fresh environments get identical policies here too.
DROP POLICY IF EXISTS "Users can insert their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can insert their own saved listings"
ON public.saved_listings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "Users can view their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can view their own saved listings"
ON public.saved_listings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can delete their own saved listings"
ON public.saved_listings FOR DELETE TO authenticated
USING (auth.uid() = user_id AND public.is_active_user());

-- ── 4. property_analytics: owner-scoped read for listing dashboards ─────────
DROP POLICY IF EXISTS "Owners can read analytics for their listings" ON public.property_analytics;
CREATE POLICY "Owners can read analytics for their listings"
ON public.property_analytics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = property_analytics.listing_id
      AND l.poster_id = auth.uid()
  )
);

-- ── 5. property_reports: deny-all (no policies) ──────────────────────────────
-- Deliberately NO policies on purpose: RLS closes the table to direct client
-- access entirely. The only entry point is public.report_listing() (SECURITY
-- DEFINER, hardened in 20260811000001), which runs as the table owner and
-- bypasses RLS.

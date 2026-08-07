-- migration file: supabase/migrations/20260807000014_rls_enforce_active_account.sql
-- L5 hardening (follow-up to 20260807000012/000013): enforce `account_status`
-- inside RLS itself so a suspended user is rejected even for direct client ->
-- PostgREST writes that carry a still-valid access token.
--  1. is_active_user() (SECURITY DEFINER => reads profiles without RLS, so no
--     recursion from profiles' own policies; STABLE for per-statement safety).
--  2. Augment the write policies (INSERT/UPDATE/DELETE) of listings,
--     space_requests, saved_listings, notifications, and profiles with it.
--  SELECT is intentionally left untouched: suspended users may still read public
--  data (same as a logged-out guest), they just cannot mutate anything.

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND account_status = 'suspended'
  );
$$;

-- ── listings ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings"
ON public.listings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = poster_id AND public.is_active_user());

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings"
ON public.listings FOR UPDATE TO authenticated
USING (auth.uid() = poster_id AND public.is_active_user())
WITH CHECK (auth.uid() = poster_id AND public.is_active_user());

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings"
ON public.listings FOR DELETE TO authenticated
USING (auth.uid() = poster_id AND public.is_active_user());

-- ── saved_listings ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can insert their own saved listings"
ON public.saved_listings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "Users can delete their own saved listings" ON public.saved_listings;
CREATE POLICY "Users can delete their own saved listings"
ON public.saved_listings FOR DELETE TO authenticated
USING (auth.uid() = user_id AND public.is_active_user());

-- ── space_requests ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can insert their own space requests" ON public.space_requests;
CREATE POLICY "Users can insert their own space requests"
ON public.space_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "Allow users to update their own requests" ON public.space_requests;
CREATE POLICY "Allow users to update their own requests"
ON public.space_requests FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_active_user())
WITH CHECK (auth.uid() = user_id AND public.is_active_user());

DROP POLICY IF EXISTS "Allow users to delete their own requests" ON public.space_requests;
CREATE POLICY "Allow users to delete their own requests"
ON public.space_requests FOR DELETE TO authenticated
USING (auth.uid() = user_id AND public.is_active_user());

-- ── notifications ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND public.is_active_user());

-- ── profiles (frozen accounts cannot mutate their own profile; self-view ok) ─
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id AND public.is_active_user());
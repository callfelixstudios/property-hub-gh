-- migration file: supabase/migrations/20260811000008_restrict_neighborhoods_policy.sql
-- L9 fix: neighborhoods was the last table in the codebase with a literal
-- `USING (true)` SELECT policy, open to EVERY role (no TO clause = all roles).
-- Not a confidentiality issue today (neighborhood data is public reference
-- data), but it is a policy anti-pattern: any future column added to the table
-- (e.g. operational flags) would automatically be world-readable. This closes it:
--  1. Add is_active (default true) so the platform can soft-hide stale or
--     unverified neighborhoods without deleting them.
--  2. Replace the catch-all policy with "Anyone can read active neighborhoods"
--     (TO public USING (is_active = true)) — guests and signed-in users alike
--     keep reading the reference data, but only active rows are exposed.
--  The admin management policy (FOR ALL TO authenticated, @propertyhubgh.com
--  scope) remains untouched.

-- ── 1. is_active column ──────────────────────────────────────────────────────
ALTER TABLE public.neighborhoods
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ── 2. Replace the catch-all read policy ─────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read neighborhoods" ON public.neighborhoods;

CREATE POLICY "Anyone can read active neighborhoods"
  ON public.neighborhoods
  FOR SELECT TO public
  USING (is_active = true);

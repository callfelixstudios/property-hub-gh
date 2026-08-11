-- migration file: supabase/migrations/20260811000006_revoke_helper_public_execute.sql
-- L5 fix: three internal helper functions were callable by PUBLIC (the default
-- EXECUTE grant on new functions) or by anon/authenticated, even though they are
-- only ever invoked internally by triggers or RLS policy expressions:
--  1. is_active_user() — used inside RLS policies. Functions default to PUBLIC
--     EXECUTE, so anyone with a SQL connection could probe suspended-account
--     state. Restrict to authenticated (the only role that evaluates the
--     policies referencing it; anon never reaches those write policies).
--  2. revoke_sessions_on_suspend() — trigger-only. Trigger functions are invoked
--     internally by the trigger machinery, NOT through EXECUTE grants, so
--     revoking EXECUTE from everyone does not stop the trigger from firing on
--     profiles.account_status changes.
--  3. validate_space_request() — trigger-only; already revoked in
--     20260807000002. Re-asserted here for idempotent safety.

-- ── 1. is_active_user(): RLS policy helper, authenticated only ───────────────
REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-- ── 2. revoke_sessions_on_suspend(): trigger-only ───────────────────────────
-- Trigger invocation is internal and bypasses EXECUTE grants, so the
-- AFTER UPDATE OF account_status trigger keeps working with zero grants.
REVOKE ALL ON FUNCTION public.revoke_sessions_on_suspend() FROM PUBLIC, anon, authenticated;

-- ── 3. validate_space_request(): trigger-only (idempotent re-assertion) ──────
REVOKE ALL ON FUNCTION public.validate_space_request() FROM PUBLIC, anon, authenticated;

-- migration file: supabase/migrations/20260807000011_revoke_definer_function_roles.sql
-- Follow-up to 20260807000010: the two internal trigger utilities also held
-- EXPLICIT EXECUTE grants to anon/authenticated (older migrations granted roles
-- directly, so `REVOKE ... FROM PUBLIC` alone did not remove them).
-- Trigger invocation does not require an EXECUTE grant, so revoking these roles
-- is safe for the auth.users / event-trigger wiring.

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
-- migration file: supabase/migrations/20260807000013_suspend_trigger_banned_until.sql
-- L5 hardening (follow-up to 20260807000012): when an account is suspended, also
-- set auth.users.banned_until so GoTrue rejects the user outright (no new logins,
-- no token refresh, no /auth/v1/user) instead of only revoking refresh tokens.
-- When the account is reactivated, clear banned_until so the user can sign in again.

CREATE OR REPLACE FUNCTION public.revoke_sessions_on_suspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.account_status = 'suspended'
     AND OLD.account_status IS DISTINCT FROM 'suspended' THEN
    DELETE FROM auth.refresh_tokens WHERE user_id = NEW.id;
    UPDATE auth.users
    SET banned_until = statement_timestamp()
    WHERE id = NEW.id
      AND (banned_until IS NULL OR banned_until <= statement_timestamp());
  ELSIF NEW.account_status = 'active'
        AND OLD.account_status IS DISTINCT FROM 'active' THEN
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
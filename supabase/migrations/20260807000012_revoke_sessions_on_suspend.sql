-- migration file: supabase/migrations/20260807000012_revoke_sessions_on_suspend.sql
-- L5 fix: when an admin suspends a profile, revoke ALL of that user's auth
-- refresh tokens so existing sessions are signed out at the auth layer.
-- (Access tokens that are still within their short validity window are
-- additionally blocked by the assertActiveUser() guard in server actions.)
-- Revoking refresh_tokens is safe and immediate: GoTrue requires a valid
-- refresh token to mint new access tokens / continue sessions.

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
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_revoke_sessions_on_suspend ON public.profiles;
CREATE TRIGGER trg_revoke_sessions_on_suspend
AFTER UPDATE OF account_status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.revoke_sessions_on_suspend();
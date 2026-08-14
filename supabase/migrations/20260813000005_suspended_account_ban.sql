-- migration file: supabase/migrations/20260813000005_suspended_account_ban.sql
-- Real ban: suspended/deleted accounts cannot sign in or refresh sessions.
-- GoTrue refuses auth while banned_until is in the future.
CREATE OR REPLACE FUNCTION public.revoke_sessions_on_suspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.account_status IN ('suspended', 'deleted')
     AND OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    DELETE FROM auth.refresh_tokens WHERE user_id = NEW.id::text;
    UPDATE auth.users
    SET banned_until = statement_timestamp() + interval '3650 days'
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

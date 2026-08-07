-- migration file: supabase/migrations/20260807000015_fix_suspend_refresh_token_cast.sql
-- Bugfix: auth.refresh_tokens.user_id is CHARACTER VARYING while profiles.id is
-- uuid, so the DELETE in revoke_sessions_on_suspend() raised
--   operator does not exist: character varying = uuid
-- and aborted the whole suspend operation. Cast the member id to text.

CREATE OR REPLACE FUNCTION public.revoke_sessions_on_suspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.account_status = 'suspended'
     AND OLD.account_status IS DISTINCT FROM 'suspended' THEN
    DELETE FROM auth.refresh_tokens WHERE user_id = NEW.id::text;
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
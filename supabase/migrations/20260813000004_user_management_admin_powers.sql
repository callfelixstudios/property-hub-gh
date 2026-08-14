-- migration file: supabase/migrations/20260813000004_user_management_admin_powers.sql
-- Admin account powers: soft-delete status, guards, and listings takedown/restore.

-- 1) Allow the 'deleted' account status.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'deleted'));

-- 2) Deleted accounts are treated as inactive by RLS (write-blocked everywhere).
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
      AND account_status IN ('suspended', 'deleted')
  );
$$;

-- 3) Revoke sessions + ban on 'deleted' just like 'suspended'.
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

-- 4) Guard: only platform admins change account_status; admins cannot be
--    suspended/deleted. Mirrors enforce_listing_moderation's admin bypass.
--    NOTE: reads auth.users.raw_app_meta_data (this Supabase version's column
--    for the role written by 20260807000007_platform_admin_role.sql).
CREATE OR REPLACE FUNCTION public.enforce_account_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can change account status.';
  END IF;

  IF NEW.account_status <> 'active'
     AND EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = NEW.id
         AND COALESCE(raw_app_meta_data->>'role', '') = 'platform_admin'
     ) THEN
    RAISE EXCEPTION 'Cannot suspend or delete a platform admin.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_account_status_guard ON public.profiles;
CREATE TRIGGER enforce_account_status_guard
BEFORE UPDATE OF account_status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_account_status_guard();

-- 5) Takedown/restore listings atomically with account status changes,
--    and notify the owner.
CREATE OR REPLACE FUNCTION public.sync_listings_with_account_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin_email text := COALESCE(auth.jwt() ->> 'email', 'system');
BEGIN
  IF NEW.account_status = 'suspended'
     AND OLD.account_status IS DISTINCT FROM 'suspended' THEN
    UPDATE public.listings
    SET moderation_status = 'suspended',
        status = 'pending',
        moderation_note = 'Account suspended by admin',
        moderated_by = v_admin_email,
        moderated_at = statement_timestamp()
    WHERE poster_id = NEW.id AND status = 'active';

    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      NEW.id, 'account_suspended', 'Account Suspended',
      'Your Property Hub GH account has been suspended by the platform team.',
      jsonb_build_object('reason', 'Account suspended by admin')
    );

  ELSIF NEW.account_status = 'deleted'
        AND OLD.account_status IS DISTINCT FROM 'deleted' THEN
    UPDATE public.listings
    SET status = 'archived',
        moderation_status = 'deleted',
        listing_health = 'archived',
        moderated_by = v_admin_email,
        moderated_at = statement_timestamp()
    WHERE poster_id = NEW.id;

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.id, 'account_deleted', 'Account Deleted',
      'Your Property Hub GH account has been deleted by the platform team.'
    );

  ELSIF NEW.account_status = 'active'
        AND OLD.account_status IS DISTINCT FROM 'active' THEN
    UPDATE public.listings
    SET status = 'pending',
        moderation_status = 'pending',
        moderation_note = NULL,
        moderated_by = NULL,
        moderated_at = NULL
    WHERE poster_id = NEW.id
      AND (   (moderation_status = 'suspended' AND status = 'pending')
           OR (moderation_status = 'deleted'   AND status = 'archived') );

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.id, 'account_reactivated', 'Account Reactivated',
      'Your Property Hub GH account has been reactivated. Your listings are back in the review queue.'
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_listings_with_account_status ON public.profiles;
CREATE TRIGGER sync_listings_with_account_status
AFTER UPDATE OF account_status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_listings_with_account_status();

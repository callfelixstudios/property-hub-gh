-- 20260813000006_preserve_moderation_history_on_delete.sql
-- Fix: the delete takedown clobbered moderation history.
--   1) moderated_by/moderated_at are now preserved (COALESCE) and only
--      attributed to the admin when no prior moderation record exists.
--   2) listings previously 'rejected' or 'flagged' keep that moderation
--      status (archived) instead of being relabeled 'deleted', so the
--      original moderation decision survives account delete/restore.

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
        moderation_status = CASE
          WHEN moderation_status IN ('rejected', 'flagged') THEN moderation_status
          ELSE 'deleted'
        END,
        listing_health = 'archived',
        moderated_by = COALESCE(moderated_by, v_admin_email),
        moderated_at = COALESCE(moderated_at, statement_timestamp())
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
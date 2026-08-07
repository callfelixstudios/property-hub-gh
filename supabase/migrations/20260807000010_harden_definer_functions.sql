-- migration file: supabase/migrations/20260807000010_harden_definer_functions.sql
-- L4 fix: close remaining SECURITY DEFINER hardening gaps.
--  1. handle_new_user() was SECURITY DEFINER WITHOUT SET search_path (only definer
--     function missing it) and callable by PUBLIC. Recreate with SET search_path = ''
--     (all references are schema-qualified) and revoke blanket PUBLIC EXECUTE.
--  2. rls_auto_enable() is an internal event-trigger utility; revoke PUBLIC EXECUTE.
--  Trigger invocation is unaffected by EXECUTE revocation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, contact_phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE
  SET contact_phone = COALESCE(EXCLUDED.contact_phone, public.profiles.contact_phone),
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
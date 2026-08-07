-- 20260807000005_restrict_admin_rpcs.sql
-- M2 fix: admin RPCs were SECURITY DEFINER but EXECUTE was not properly revoked
-- from anon / PUBLIC. Supabase default privileges re-grant EXECUTE to anon on
-- creation, so the earlier `REVOKE ... FROM PUBLIC` in each function's migration
-- left anon able to call them via /rest/v1/rpc/...
-- Fix:
--  1. Revoke EXECUTE from PUBLIC and anon; grant only to authenticated.
--  2. Harden the internal admin-domain check to be NULL-safe (a phone-only JWT
--     without `email` yields NULL, which previously bypassed the guard).
-- Internal admin-domain checks remain as defense-in-depth.

-- ── 1. Harden guards (NULL-safe admin-domain check) ──────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_all_users_with_email()
 RETURNS TABLE(id uuid, full_name text, phone text, email text, account_status text, is_verified boolean, membership_tier text, created_at timestamp with time zone, listing_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF COALESCE(LOWER(split_part(auth.jwt() ->> 'email', '@', 2)), '') != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name::text,
    p.contact_phone::text AS phone,
    u.email::text,
    p.account_status::text,
    p.is_verified_agent::boolean AS is_verified,
    p.membership_tier::text,
    p.created_at,
    COUNT(l.id)::bigint AS listing_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.listings l ON l.poster_id = p.id
  GROUP BY p.id, p.full_name, p.contact_phone, u.email, p.account_status, p.is_verified_agent, p.membership_tier, p.created_at
  ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_verification_queue()
 RETURNS TABLE(
   id uuid,
   full_name text,
   contact_phone text,
   email text,
   membership_tier text,
   verification_status text,
   document_type text,
   document_url text,
   license_number text,
   verification_submitted_at timestamp with time zone,
   rejection_reason text,
   created_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF COALESCE(LOWER(split_part(auth.jwt() ->> 'email', '@', 2)), '') != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name::text,
    p.contact_phone::text,
    u.email::text,
    p.membership_tier::text,
    p.verification_status::text,
    p.document_type::text,
    p.document_url::text,
    p.license_number::text,
    p.verification_submitted_at,
    p.rejection_reason::text,
    p.created_at
  FROM profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.verification_status IN ('pending_review', 'rejected', 'verified')
  ORDER BY p.verification_submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_update_stale_listings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Admin domain check (NULL-safe)
  IF COALESCE(LOWER(split_part(auth.jwt() ->> 'email', '@', 2)), '') != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  UPDATE public.listings
  SET listing_health = 'stale'
  WHERE status = 'active'
    AND listing_health = 'fresh'
    AND moderation_status = 'approved'
    AND created_at < NOW() - INTERVAL '30 days'
    AND (last_verified_at IS NULL OR last_verified_at < NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ── 2. Restrict EXECUTE to authenticated only ────────────────────────────────
REVOKE ALL ON FUNCTION public.admin_get_all_users_with_email() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_verification_queue() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_update_stale_listings() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_get_all_users_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_verification_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_stale_listings() TO authenticated;
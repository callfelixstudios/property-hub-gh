-- 20260807000007_platform_admin_role.sql
-- M4 fix: replace @propertyhubgh.com shared-domain elevation with an explicit
-- admin role stored in auth.users app_metadata (never user-editable user_metadata).
--
-- 1. Introduce a single SQL helper public.is_platform_admin() that checks the
--    JWT app_metadata claim `role = 'platform_admin'`.
-- 2. Backfill the role onto every CURRENT @propertyhubgh.com account so today's
--    admin access is preserved; future accounts automatically get nothing.
-- 3. Swap EVERY admin RLS policy, admin RPC guard, moderation trigger guard and
--    the verification-documents storage policy to use the helper.
-- 4. Drop the now-orphaned domain-based policies.
--
-- NOTE: role is read from app_metadata only (server-controlled). MFA (AAL2) is
-- deliberately NOT part of this helper; it will be enforced later in the app
-- layer (assertAdmin) without any schema change.

-- ── 1. Helper ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'platform_admin';
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- ── 2. Backfill explicit admin role for current @propertyhubgh.com accounts ─
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"platform_admin"}'::jsonb
WHERE LOWER(split_part(email, '@', 2)) = 'propertyhubgh.com';

-- ── 3. Replace admin RLS policies ────────────────────────────────────────────

-- profiles
DROP POLICY IF EXISTS "Enforce admin corporate domain access" ON public.profiles;
CREATE POLICY "Platform admins can manage all profiles"
  ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- listings (full admin + moderation-specific update)
DROP POLICY IF EXISTS "Enforce admin corporate domain access on listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can update listings for moderation" ON public.listings;

CREATE POLICY "Platform admins can manage all listings"
  ON public.listings FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update listing moderation"
  ON public.listings FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- admin_audit_logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;

CREATE POLICY "Platform admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- config_amenities
DROP POLICY IF EXISTS "Admins can manage amenities" ON public.config_amenities;
CREATE POLICY "Platform admins can manage amenities"
  ON public.config_amenities FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- config_neighborhoods
DROP POLICY IF EXISTS "Admins can manage neighborhoods" ON public.config_neighborhoods;
CREATE POLICY "Platform admins can manage neighborhoods"
  ON public.config_neighborhoods FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- config_regions
DROP POLICY IF EXISTS "Admins can manage regions" ON public.config_regions;
CREATE POLICY "Platform admins can manage regions"
  ON public.config_regions FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- neighborhoods
DROP POLICY IF EXISTS "Admins can manage neighborhoods" ON public.neighborhoods;
CREATE POLICY "Platform admins can manage neighborhoods"
  ON public.neighborhoods FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- payment_transactions
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.payment_transactions;
CREATE POLICY "Platform admins can manage transactions"
  ON public.payment_transactions FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- space_requests (also closes the leftover LIKE-based policy)
DROP POLICY IF EXISTS "Admins can manage all space requests" ON public.space_requests;
CREATE POLICY "Platform admins can manage all space requests"
  ON public.space_requests FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- subscription_plans
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Platform admins can manage plans"
  ON public.subscription_plans FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- system_alerts
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.system_alerts;
DROP POLICY IF EXISTS "Admins can view alerts" ON public.system_alerts;

CREATE POLICY "Platform admins can manage alerts"
  ON public.system_alerts FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can view alerts"
  ON public.system_alerts FOR SELECT TO authenticated
  USING (public.is_platform_admin());

-- user_subscriptions
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Platform admins can manage subscriptions"
  ON public.user_subscriptions FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ── 4. Replace admin RPC guards ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_get_all_users_with_email()
 RETURNS TABLE(id uuid, full_name text, phone text, email text, account_status text, is_verified boolean, membership_tier text, created_at timestamp with time zone, listing_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN
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
  IF NOT public.is_platform_admin() THEN
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
  IF NOT public.is_platform_admin() THEN
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

-- ── 5. Replace trigger guard (moderation state change is admin-only) ────────
CREATE OR REPLACE FUNCTION public.enforce_listing_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := public.is_platform_admin();

  IF TG_OP = 'INSERT' THEN
    -- Client-submitted moderation_status can never be trusted; force pending
    -- unless the caller is a platform admin.
    IF NOT v_is_admin THEN
      NEW.moderation_status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Only admins may change moderation state (approve/reject/flag).
    IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
       AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Only platform admins can change listing moderation status';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 6. Replace storage policy (verification documents readable by admins) ────
DROP POLICY IF EXISTS "Allow @propertyhubgh.com admins to read verification objects" ON storage.objects;

CREATE POLICY "Allow platform admins to read verification objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification-documents'
    AND public.is_platform_admin()
  );
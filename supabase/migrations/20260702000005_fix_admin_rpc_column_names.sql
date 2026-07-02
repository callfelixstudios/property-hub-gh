-- Fix: admin_get_all_users_with_email referenced p.phone and p.is_verified
-- which don't exist. Correct columns are p.contact_phone and p.is_verified_agent.

CREATE OR REPLACE FUNCTION public.admin_get_all_users_with_email()
 RETURNS TABLE(id uuid, full_name text, phone text, email text, account_status text, is_verified boolean, membership_tier text, created_at timestamp with time zone, listing_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Guard: only allow calls from admin domain
  IF LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.contact_phone AS phone,
    u.email,
    p.account_status,
    p.is_verified_agent AS is_verified,
    p.membership_tier,
    p.created_at,
    COUNT(l.id)::bigint AS listing_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.listings l ON l.poster_id = p.id
  GROUP BY p.id, p.full_name, p.contact_phone, u.email, p.account_status, p.is_verified_agent, p.membership_tier, p.created_at
  ORDER BY p.created_at DESC;
END;
$function$;

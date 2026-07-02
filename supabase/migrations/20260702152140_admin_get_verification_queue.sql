-- Create an RPC to fetch verification queue profiles combined with their auth.users email securely
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
  IF LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) != 'propertyhubgh.com' THEN
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

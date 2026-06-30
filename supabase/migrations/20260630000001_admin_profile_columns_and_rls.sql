-- 20260630000001_admin_profile_columns_and_rls.sql
-- Adds admin management columns to profiles and hardens all admin RLS policies
-- replacing vulnerable LIKE '%@propertyhubgh.com' with split_part domain check

-- Step 1: Add admin management columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free'
    CHECK (membership_tier IN ('free', 'pro', 'developer'));

-- Step 2: Drop old vulnerable LIKE-based admin policies on profiles
DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enforce admin corporate domain write access" ON public.profiles;

-- Step 3: Recreate with hardened split_part + LOWER domain check
CREATE POLICY "Enforce admin corporate domain access"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- Step 4: Harden listings admin policy
DROP POLICY IF EXISTS "Admin full access on listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can manage all listings" ON public.listings;

CREATE POLICY "Enforce admin corporate domain access on listings"
  ON public.listings
  FOR ALL
  TO authenticated
  USING (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com')
  WITH CHECK (LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) = 'propertyhubgh.com');

-- Step 5: Admin RPC to fetch all users joined with auth emails
CREATE OR REPLACE FUNCTION public.admin_get_all_users_with_email()
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  email text,
  account_status text,
  is_verified boolean,
  membership_tier text,
  created_at timestamptz,
  listing_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(split_part(auth.jwt() ->> 'email', '@', 2)) != 'propertyhubgh.com' THEN
    RAISE EXCEPTION 'Unauthorized: admin access only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.phone,
    u.email,
    p.account_status,
    p.is_verified,
    p.membership_tier,
    p.created_at,
    COUNT(l.id)::bigint AS listing_count
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.listings l ON l.poster_id = p.id
  GROUP BY p.id, p.full_name, p.phone, u.email, p.account_status, p.is_verified, p.membership_tier, p.created_at
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_all_users_with_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users_with_email() TO authenticated;

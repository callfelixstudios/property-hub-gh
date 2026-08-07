-- 20260807000002_restrict_space_requests_pii.sql
-- H3 fix: space_requests PII (whatsapp_number) was fully readable/writable by anon.
-- 1. Public SELECT restricted to active rows ONLY (was USING (true) -> all rows).
-- 2. Column-level grants: anon can no longer read whatsapp_number / user_id.
-- 3. INSERT now requires an authenticated user and user_id = auth.uid().
-- 4. DB-level validation trigger (phone format, required fields, budget).
-- 5. Admin management policy (admin previously relied on the public policy).

-- ── 1. Public read: only active requests ───────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view space requests" ON public.space_requests;

CREATE POLICY "Anyone can view active space requests"
  ON public.space_requests
  FOR SELECT
  USING (status = 'active');

-- ── 2. Column-level PII protection (anon) ──────────────────────────────────
REVOKE SELECT (whatsapp_number) ON public.space_requests FROM anon;
REVOKE SELECT (user_id) ON public.space_requests FROM anon;

-- ── 3. Owner access + insert: authenticated users only, always owner-bound ─
CREATE POLICY "Users can view their own space requests"
  ON public.space_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert space requests" ON public.space_requests;

CREATE POLICY "Users can insert their own space requests"
  ON public.space_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Server-side validation on insert ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_space_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Normalize: strip all whitespace from the phone number.
  NEW.whatsapp_number := regexp_replace(trim(COALESCE(NEW.whatsapp_number, '')), '\s+', '', 'g');

  -- WhatsApp / international phone: optional +, 9-15 digits.
  IF NEW.whatsapp_number !~ '^\+?[0-9]{9,15}$' THEN
    RAISE EXCEPTION 'Invalid WhatsApp number. Please use a valid phone number with country code (e.g. +233...).';
  END IF;

  IF trim(COALESCE(NEW.seeker_name, '')) = '' THEN
    RAISE EXCEPTION 'Seeker name is required.';
  END IF;

  IF trim(COALESCE(NEW.location, '')) = '' THEN
    RAISE EXCEPTION 'Location is required.';
  END IF;

  IF trim(COALESCE(NEW.property_type, '')) = '' THEN
    RAISE EXCEPTION 'Property type is required.';
  END IF;

  IF NEW.budget IS NULL OR NEW.budget <= 0 THEN
    RAISE EXCEPTION 'Budget must be a positive amount.';
  END IF;

  NEW.status := 'active';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_space_request ON public.space_requests;

CREATE TRIGGER trg_validate_space_request
  BEFORE INSERT ON public.space_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_space_request();

-- Internal trigger-only guard: not callable as a public function.
REVOKE EXECUTE ON FUNCTION public.validate_space_request() FROM PUBLIC, anon, authenticated;

-- ── 5. Admin management (dashboard reads/deletes all rows) ─────────────────
CREATE POLICY "Admins can manage all space requests"
  ON public.space_requests
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com')
  WITH CHECK (auth.jwt() ->> 'email' LIKE '%@propertyhubgh.com');
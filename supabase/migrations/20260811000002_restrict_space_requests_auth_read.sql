-- migration file: supabase/migrations/20260811000002_restrict_space_requests_auth_read.sql
-- H2 fix: the policy "Anyone can view active space requests" (created in
-- 20260807000002) has NO role clause, so it applies to EVERY role including
-- authenticated. Any signed-in user could SELECT every seeker's active request
-- and harvest whatsapp_number at scale. This closes the PII leak:
--  1. Restrict the public read policy to anon ONLY. Guests still see active
--     requests (the public Notice Board keeps working), while signed-in users
--     fall through to the narrower policies below.
--  2. Matched agents keep full-row access (incl. whatsapp_number) only for the
--     requests they were matched to: an EXISTS over their own 'new_match'
--     notifications carrying metadata->>'request_id' = space_requests.id.
--  3. The existing "Users can view their own space requests" policy
--     (auth.uid() = user_id) still covers the request owner, and the admin
--     management policy still covers platform staff.
--  Column-level revokes of whatsapp_number / user_id from anon (20260807000002)
--  remain untouched; authenticated keeps those columns because the matched-agent
--  flow legitimately needs them — the narrow policy is the control.

-- ── 1. Public read: anon only, active rows only ─────────────────────────────
DROP POLICY IF EXISTS "Anyone can view active space requests" ON public.space_requests;

CREATE POLICY "Anyone can view active space requests"
  ON public.space_requests
  FOR SELECT TO anon
  USING (status = 'active');

-- ── 2. Matched agents: full row for their matched requests only ─────────────
DROP POLICY IF EXISTS "Agents can view matched space requests" ON public.space_requests;

CREATE POLICY "Agents can view matched space requests"
  ON public.space_requests
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = auth.uid()
        AND n.type = 'new_match'
        AND n.metadata->>'request_id' = space_requests.id::text
    )
  );

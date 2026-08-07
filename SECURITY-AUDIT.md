# Property Hub GH — Comprehensive Security Audit Report

- **Date of audit:** 2026-08-07
- **Scope:** Full application codebase (`src/`), 42 SQL migrations (`supabase/migrations/`), live Supabase project `lqitnsvtqhsowvmaxjio`, git history, environment configuration.
- **Methodology:** Static code review (OWASP Top 10, OWASP API Security Top 10), live database policy/RPC verification, Supabase security advisors, dependency/config review.
- **Severity buckets:** HIGH / MEDIUM / LOW — sorted below.

---

## Executive Summary

The codebase has several well-architected security controls (RLS ownership policies, immutable admin audit logs, private verification-document storage with signed URLs, no service-role key exposure). However, **3 HIGH**, **8 MEDIUM**, and **5 LOW** findings were identified, the most critical being a **stored XSS via JSON-LD**, a **moderation bypass + full-listing public read policy**, and **publicly exposed seeker PII (phone numbers)** in `space_requests`.

---

## HIGH SEVERITY

### H1. Stored XSS via JSON-LD `dangerouslySetInnerHTML`
- **OWASP:** A03 (Injection / XSS)
- **Files:**
  - `src/components/seo/JsonLd.tsx:11`
  - `src/app/listings/[id]/page.tsx:269-285`
- **Issue:** `JSON.stringify()` does **not** HTML-escape `<`, `>`, `&`, or U+2028/U+2029. User-controlled listing fields (`title`, `description`, `neighborhood`, `region`) are injected into a `<script type="application/ld+json">` tag via `dangerouslySetInnerHTML`. A poster can submit `</script><script>…</script>` in the description → stored, server-rendered XSS executed on the public listing page for every visitor (session theft, defacement, phishing).
- **Fix:** Escape `<`, `>`, `&`, U+2028, U+2029 before stringifying, or use a JSON-safe serializer that HTML-encodes the script content.

### H2. Unmoderated / rejected listings are publicly readable (moderation bypass)
- **OWASP:** A01 (Broken Access Control)
- **Files:**
  - `src/app/post-space/page.tsx:388` (inserts with `status: 'active'` while `moderation_status` defaults to `'pending'`)
  - Live DB policies on `public.listings`
- **Live DB proof (pg_policy):**
  - `"Anyone can view active listings"` → `(status = 'active') OR (auth.uid() = poster_id)`
  - **`"public_read_listings"` → `USING (true)`** — exposes the **entire** table to anonymous REST clients: pending/rejected/flagged moderation queues, `moderation_note`, `rejection_reason`, listing contact data.
- **Impact:** Content gated behind moderation approval is immediately visible to the public, and the `USING(true)` policy leaks every moderation state.
- **Fix:** Remove the `public_read_listings` policy. Gate publication on `moderation_status = 'approved'` (not just `status`), and set `status: 'pending'` on insert, flipping to `'active'` only when an admin approves.

### H3. `space_requests` PII (phone numbers) publicly readable/writable
- **OWASP:** A01 / A05 (Broken Access Control / Security Misconfiguration) + data-protection (GDPR)
- **File:** `supabase/migrations/20260618000004_create_space_requests.sql:19-28` (confirmed live)
- **Live DB proof (pg_policy):**
  - `"Anyone can view space requests"` → `USING (true)`
  - `"Anyone can insert space requests"` → `WITH CHECK (true)`
- **Impact:** The full table (`seeker_name`, **`whatsapp_number`**, `location`, `budget`, `purpose`, `additional_details`) is readable by any anonymous REST client, plus unlimited spam inserts into the matching engine.
- **Fix:** Remove the public SELECT policy (or restrict to `auth.uid() = user_id` + authenticated); keep insert only where intended and add server-side validation/rate limiting. Do not expose raw phone numbers to `anon`.

---

## MEDIUM SEVERITY

### M1. Anonymous RPCs can tamper with analytics counters
- **OWASP:** API4 (Resource Consumption) / API6 (Business Flows), data integrity
- **Files:** `supabase/migrations/20260626000002_add_property_analytics_event_log.sql:11-33`
- **Issue:** `increment_listing_views(row_id)` and `increment_whatsapp_leads(row_id)` are `SECURITY DEFINER` with **no** `SET search_path`, executable by `anon` and `authenticated` (confirmed via advisors). `property_analytics` has RLS enabled but **no policies** → the functions bypass RLS to write arbitrary rows and inflate counts on any listing.
- **Fix:** `REVOKE EXECUTE … FROM PUBLIC`, `GRANT EXECUTE … TO authenticated` (or tighter), add `SET search_path = public`, and rate-limit.

### M2. Admin RPCs created SECURITY DEFINER and exposed to `anon`/`authenticated`
- **OWASP:** API5 (BFLA) / A01
- **Files:**
  - `supabase/migrations/20260630000001_admin_profile_columns_and_rls.sql:37-78` (`admin_get_all_users_with_email`)
  - `supabase/migrations/20260702152140_admin_get_verification_queue.sql:2-45`
  - `supabase/migrations/20260702000003_listing_health_status.sql:16-44` (`fn_update_stale_listings`)
- **Issue:** All three are callable by `anon` (and `authenticated`) via `/rest/v1/rpc/…`. They fail closed because of an internal `split_part(auth.jwt()->>email)` check, but `EXECUTE` was never revoked from `PUBLIC`, so the attack surface and function-privilege blast radius remain.
- **Fix:** Revoke `EXECUTE FROM PUBLIC` for these, grant only to `authenticated`, and keep the internal domain checks as defense-in-depth.

### M3. Public SECURITY DEFINER matching functions = notification-spam/DoS + info leak
- **OWASP:** API4 (DoS) / API1 (BOLA)
- **Files:** `supabase/migrations/20260719000002_match_request_to_agents.sql`, `20260719000003_attach_matching_trigger.sql`
- **Issue:** `match_request_to_agents(p_request_id)` and `handle_new_space_request()` are `SECURITY DEFINER`, callable by `anon`, with **no ownership check and no rate limit**. Any anonymous caller can pass arbitrary request IDs → floods agent `notifications` (bypasses RLS) and receives matched agent IDs / listing IDs in the response.
- **Fix:** Revoke from `anon`, verify `p_request_id` exists and belongs to the caller, rate-limit per user/IP, and consider `SECURITY INVOKER`.

### M4. Admin access = shared corporate email domain, inconsistently enforced
- **OWASP:** A01 / A07 (Broken Access Control / Identification & Auth Failures)
- **Files:** `src/utils/adminAuth.ts:8-13`, `src/app/actions/verificationActions.ts:12-24`
- **Issue:** Two different checks exist: `split_part`-based `isAuthorizedAdmin` vs `endsWith('@propertyhubgh.com')` in `verifyAdminSession`. Both elevate **any** `@propertyhubgh.com` account (incl. Google OAuth) to full admin — over all users, listings, verification approvals, and verification-document signed URLs. No dedicated admin role, no MFA, no `app_metadata` claim.
- **Fix:** Store an explicit admin flag/role in `app_metadata` (never user-editable `user_metadata`), check it in one shared helper used by layout + all server actions, and require MFA for admin sessions.

### M5. Missing security headers (no middleware.ts)
- **OWASP:** A05 (Security Misconfiguration)
- **Files:** entire repo — no `middleware.ts`, `next.config.ts` sets no `headers()`.
- **Impact:** No CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or HSTS → clickjacking possible and XSS mitigations weakened.
- **Fix:** Add a global `next.config.ts` `headers()` block or a `middleware.ts` injecting these headers.

### M6. Unrestricted public media uploads to a public bucket (`property-images`)
- **OWASP:** A03 / A05, content-hosted abuse
- **File:** `src/app/post-space/page.tsx:325-345`
- **Issue:** Client uploads go directly to a **public** bucket with only a client-side `accept="image/*"` hint (bypassable). No server-side MIME/size re-validation, no per-owner upload policy visible in migrations. Attacker can host arbitrary HTML/SVG/phishing content on the project's CDN domain.
- **Fix:** Validate MIME/extension server-side, restrict to safe image types, enforce owner-scoped upload policies on `storage.objects`, and keep the bucket content-type restrictions in place.

### M7. IDOR-style server action with no ownership check
- **OWASP:** API1 (BOLA / IDOR)
- **File:** `src/app/actions/analytics.ts:20` (`fetchTimeframeAnalytics(posterId)`)
- **Issue:** `posterId` is taken from the client and never compared to `auth.uid()`. Currently blunted only because `property_analytics` is RLS-closed (deny-all) — this is fragile coincidence.
- **Fix:** Resolve `posterId` from the session inside the action (or assert `posterId === user.id`) and scope queries with RLS ownership policies.

### M8. Unauthenticated resource-abuse vectors without rate limiting
- **OWASP:** API4 (Resource Consumption)
- **Files:**
  - `src/app/api/geocode/route.ts` — public Nominatim proxy, no rate limit
  - `ReportModal.tsx` / `report_listing` RPC — anonymous unlimited report spam
  - `src/app/actions/authActions.ts` — OTP login relies solely on Supabase defaults
- **Fix:** Add rate limiting (per IP / per user) on geocode and report endpoints; enable Supabase auth rate limits and consider CAPTCHA for OTP.

---

## LOW SEVERITY

### L1. Open-redirect surface in OAuth callback
- **File:** `src/app/auth/callback/route.ts:19`
- **Issue:** `NextResponse.redirect(origin + next)` where `next` is attacker-controlled but origin-prefixed. Modern browsers keep it same-origin, so exploitability is low — harden anyway by restricting `next` to a local-path allowlist.

### L2. Admin UI masked via rewrite instead of protected
- **File:** `next.config.ts:14-21`
- **Issue:** `/admin/:path*` rewrites to `/404`, hiding the admin interface. This does **not** block direct invocation of `'use server'` admin actions (callable by any signed-in `@propertyhubgh.com` user), so protection relies on obscurity.
- **Fix:** Remove the rewrite; rely on server-side `assertAdmin()` in layout + actions only.

### L3. `obsidian-vault/` tracked in git
- **Files:** 40 tracked `.md` files under `obsidian-vault/`
- **Issue:** Internal milestone docs contain architecture/schema/workflow details. No keys found in scan, but the directory shouldn't be version-controlled.
- **Fix:** Add `obsidian-vault/` to `.gitignore` (and remove from tracking).

### L4. DB function hardening gaps
- **Files:** `check_free_tier_listing_limit`, `report_listing`, `increment_listing_views`, `increment_whatsapp_leads`, `handle_new_user`, `handle_new_space_request`, `rls_auto_enable`, `fn_update_stale_listings`, `match_request_to_agents`
- **Issue:** Several `SECURITY DEFINER` functions lack `SET search_path` (advisors flagged) — search-path hijack surface; a couple of trigger helpers (`rls_auto_enable`) are callable by `anon` though intended as internal utilities.
- **Fix:** Add `SET search_path = public` (or `''`) to all `SECURITY DEFINER` functions and revoke `EXECUTE` from `PUBLIC` for internal utilities.

### L5. Suspended-account sessions not revoked at the API level
- **Files:** `src/app/actions/adminActions.ts:41-74`, profiles `account_status` column
- **Issue:** When an admin suspends a user, existing auth sessions remain valid until expiry; the app never rejects suspended users server-side.
- **Fix:** Check `account_status` in server actions/session refresh, or revoke the user's Supabase sessions on suspension.

---

## Verified Solid (no action required)

- `.env.local` contains only `NEXT_PUBLIC_*` vars (anon key), is gitignored; **no** `service_role`/secret key anywhere in the app.
- `admin_audit_logs`: immutable, RLS-restricted with hardened `split_part` domain check.
- Verification documents: private bucket, 15-minute signed URLs, admin-only read policy.
- RLS generally well-scoped on `notifications`, `payment_transactions`, `user_subscriptions`, `saved_listings` (ownership policies).
- `handle_new_user` trigger auto-creates profiles correctly.
- JSON-LD for static organization/website schemas is safe (only dynamic listing data is the risk — H1).

---

## Recommended Remediation Order

1. **H3** — Close public `space_requests` read/insert.
2. **H2** — Drop `public_read_listings` (`USING true`) and fix the moderation publication flow.
3. **H1** — HTML-escape JSON-LD payloads.
4. **M3 / M1 / M2** — Revoke `EXECUTE` from `anon` on all RPCs; tighten grants; add `search_path`.
5. **M4** — Unify admin checks via one helper; add explicit admin role (app_metadata) + MFA.
6. **M5–M8, L1–L5** — Headers, media validation, ownership checks, rate limiting, hardening.

---

*Report generated during an automated security audit. Findings should be re-validated after any remediation, and a re-audit is recommended after each release containing schema or auth changes.*

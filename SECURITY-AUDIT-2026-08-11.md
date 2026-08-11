# Property Hub GH — Comprehensive Security Audit (2026-08-11)

- **Date of audit:** 2026-08-11
- **Auditors:** Primary OWASP Top 10 (2021) + OWASP API Security Top 10 (2023) static review; independent adversarial second-opinion pass.
- **Scope:** `src/` (Next.js 16.3 / React 19, all server actions, route handlers, client components, `src/proxy.ts`), 62 SQL migrations in `supabase/migrations/`, `next.config.ts`, git history, `.env.local` (names only), `npm audit`.
- **Live DB note:** Supabase project `lqitnsvtqhsowvmaxjio` was unreachable during this audit (hibernating; all MCP `execute_sql` attempts timed out). Findings marked **[LIVE-DB]** could not be runtime-confirmed and MUST be verified with the queries in Appendix A before remediation is closed.
- **Severity buckets:** HIGH / MEDIUM / LOW — sorted by impact.

---

## Executive Summary

The Aug 7 hardening pass fixed all three previously-HIGH findings (JSON-LD stored XSS, moderation bypass / `public_read_listings`, and anonymous `space_requests` read/write), added security headers, moved admin elevation to an `app_metadata` role, and enforced suspension end-to-end. `npm audit` is clean (0 vulnerabilities) and no secrets were found in git history or `.env.local`.

This audit found **3 HIGH**, **6 MEDIUM**, and **9 LOW** issues. The most critical new findings:

1. **Anonymous listing-takedown DoS** — the `report_listing` RPC is anon-executable, so the `/api/report` IP throttle is bypassable and 3 direct RPC calls flip any listing to `flagged_review`.
2. **Mass PII harvesting** — any *authenticated* user can read `whatsapp_number` + `user_id` of **all** active `space_requests` (column revokes cover `anon` only).
3. **Possibly-open tables** — `property_analytics` has RLS **never enabled** in migrations (its policy is inert); `saved_listings` and `property_reports` are not created in any migration, leaving their live RLS state unverifiable. **[LIVE-DB]**

---

## HIGH SEVERITY

### H1. Anonymous listing takedown DoS via `report_listing` RPC (rate-limit bypass + auto-flag)
- **OWASP:** API4 (Resource Consumption) / API5 (BFLA) / API6 (Business Flow Abuse) — CWE-770, CWE-284
- **Files:**
  - `supabase/migrations/20260807000009_harden_report_listing.sql:67-68` (anon EXECUTE grant)
  - `supabase/migrations/20260807000009_harden_report_listing.sql:42-63` (throttle vs auto-flag mismatch)
  - `src/app/api/report/route.ts:12-18` (the only throttle — per-IP, route-level only)
- **Issue:** The migration deliberately grants `EXECUTE … TO anon, authenticated` on `report_listing()`. The anon key ships in the public JS bundle, so an attacker can `POST /rest/v1/rpc/report_listing` **directly**, bypassing the 5-reports/hour/IP limit in `/api/report`. The function's internal throttle allows 3 reports per listing per 60 minutes — and its auto-flag condition uses the **cumulative** count (`report_count >= 3`, line 59), which is exactly the number of reports the throttle permits. Three direct RPC calls remove any listing (UUIDs are enumerable via `sitemap.xml` / the public listing feed) from the marketplace for an indefinite period (stays `flagged_review` until admin review). A legitimate listing with 2 real reports is one anonymous call from takedown.
- **Vulnerable path:**
  1. Extract anon key from the JS bundle.
  2. `POST /rest/v1/rpc/report_listing` ×3 with `p_listing_id=<victim UUID>`.
  3. Listing flips to `status='flagged_review'` → invisible to the public feed.
- **Remediation:**
  - `REVOKE EXECUTE ON FUNCTION public.report_listing(uuid,text,text) FROM anon, authenticated;` — call it only from the server route.
  - Move throttling inside the function to a per-reporter basis (`auth.uid()`/IP fingerprint) rather than per-listing.
  - Change auto-flag to require ≥3 reports from **distinct reporters**, or remove auto-flag and route all reports to a moderation queue.
- **Verification:** After fix, confirm `SELECT has_function_privilege('anon','public.report_listing(uuid,text,text)','EXECUTE')` returns `false`, and that 3rd/4th RPC calls with the anon key return an auth/permission error.

### H2. Authenticated mass harvesting of `space_requests` PII (names + WhatsApp numbers)
- **OWASP:** A01 (Broken Access Control) — CWE-359; GDPR/Data Protection
- **File:** `supabase/migrations/20260807000002_restrict_space_requests_pii.sql:12-19`
- **Issue:** The policy `"Anyone can view active space requests"` (`FOR SELECT USING (status='active')`) has **no `TO` clause**, so it applies to **all roles including `authenticated`**. The column-level revokes (`whatsapp_number`, `user_id`) at lines 18-19 cover `anon` **only**. Any registered user (phone-OTP signup is trivial and automated) can run `GET /rest/v1/space_requests?select=seeker_name,whatsapp_number,user_id,location&status=eq.active` and download the entire live seeker database — real names, phone numbers, budgets, and owning user UUIDs — enabling mass WhatsApp spam/phishing and cross-referencing `user_id` against profiles. This defeats the intended design where agents should only see requests matched to them via `notifications`.
- **Impact:** Full seeker PII exfiltration by any authenticated client; the matching-engine gating is moot.
- **Remediation:**
  - Split the public SELECT: `FOR SELECT TO anon USING (status='active')` (keep the column revokes) — or drop the public read entirely.
  - Expose requests to agents only through the ownership-scoped policy (`auth.uid() = user_id`) plus a narrow RPC/policy granting access to the agent holding the matching `notifications` row for that request.
  - Extend the column revokes to `authenticated` (`REVOKE SELECT (whatsapp_number, user_id) ON public.space_requests FROM authenticated;`) as a stop-gap.
- **Verification:** As a non-owner authenticated session, confirm `select=whatsapp_number` on `space_requests` returns no rows (or 403).

### H3. `property_analytics` RLS never enabled; `saved_listings` / `property_reports` missing from migrations **[LIVE-DB]**
- **OWASP:** A01 / A05 (Broken Access Control / Security Misconfiguration) — CWE-862
- **Files:**
  - `supabase/migrations/20260626000002_add_property_analytics_event_log.sql` — creates `property_analytics` with **no `ALTER TABLE … ENABLE ROW LEVEL SECURITY`**
  - `supabase/migrations/20260807000004_harden_analytics_rpcs.sql:94-103` — owner-read policy created, but **inert** (RLS off → policies don't apply)
  - `saved_listings` / `property_reports` — no `CREATE TABLE` or `ENABLE RLS` anywhere in migrations; policies and references exist (`20260807000014:44-52`, `20260807000009:52`) against tables that must have been created out-of-band
- **Issue:** With RLS disabled (or the table missing proper policies), PostgREST default privileges let `anon`/`authenticated` SELECT/INSERT/UPDATE/DELETE:
  - `property_analytics` — full analytics stream readable, fake rows writable (defeats the 60s counter throttle, which is bypassed by direct INSERT anyway).
  - `saved_listings` — saved-data exposure / manipulation.
  - `property_reports` — all reports (listing_id, reason, details) readable; unlimited inserts bypassing the in-function throttle.
- **Remediation (correct regardless of live state):** one migration that:
  1. `CREATE TABLE IF NOT EXISTS public.saved_listings (…)` / `public.property_reports (…)` with owner column and indexes;
  2. `ALTER TABLE public.property_analytics, public.saved_listings, public.property_reports ENABLE ROW LEVEL SECURITY;`
  3. Recreates the intended owner-scoped policies for each.
- **Verification:** Run the queries in Appendix A against the live DB; confirm all three return `rls_enabled = true` and `anon` has no `INSERT/UPDATE/DELETE/SELECT` on them.

---

## MEDIUM SEVERITY

### M1. Stored `javascript:` href XSS — `whatsapp_link` and `floor_plan_url`
- **OWASP:** A03 (Injection / XSS) — CWE-79 (DOM-based variant)
- **Files:**
  - `src/components/WhatsAppButton.tsx:50` — `href={`${profileWhatsAppLink}?text=…`}`
  - `src/components/dashboard/DashboardTabs.tsx:572-585` — profile write; the `https://wa.me/` sanitization is **client-side only**
  - `src/components/listings/ListingGallery.tsx:73` — `href={floorPlanUrl}`
  - `src/app/post-space/page.tsx:403`, `src/components/listings/EditListingModal.tsx:360` — client-only `type="url"` validation (bypassable)
- **Issue:** Both fields are user-writable through the Supabase REST API (RLS checks only ownership, not format). An attacker sets `whatsapp_link` or `floor_plan_url` to `javascript:alert(document.cookie)` via a direct REST call; the value renders into a clickable `<a href>` on the public listing page. A logged-in visitor clicking the link executes attacker JS in their session (session theft, phishing).
- **Remediation:**
  - Server-side URL scheme allowlist at the trust boundary: accept only `https://wa.me/<digits>` for `whatsapp_link` and only `http(s)` for `floor_plan_url` (normalize via `new URL()` and reject anything else).
  - Add `CHECK (whatsapp_link IS NULL OR whatsapp_link ~ '^https://wa\.me/[0-9]+$')` and `CHECK (floor_plan_url IS NULL OR floor_plan_url ~ '^https://')` constraints in a migration.
  - Render defense-in-depth: `ListingGallery` could derive the link from a digits-only phone column instead of a free-text URL.
- **Verification:** Write `whatsapp_link='javascript:alert(1)'` via REST with a signed-in user; confirm the INSERT is rejected by the CHECK constraint, and the existing poisoned rows are cleared.

### M2. Client-side open redirect via unvalidated `?next=` on login / register
- **OWASP:** A01 (Open Redirect) — CWE-601
- **Files:** `src/app/login/page.tsx:56,113`; `src/app/register/page.tsx:18,118`
- **Issue:** After email/password login and phone-OTP verification, the client calls `router.push(next || "/rentals")` with the **unvalidated** `next` URL parameter. Next.js `router.push` performs a full cross-origin navigation for absolute URLs (`?next=https://evil.com`). A crafted login link silently lands the victim on an attacker site after authentication. (The OAuth callback at `src/app/auth/callback/route.ts:13-31` is correctly hardened with `safeDestination()` — this finding is the non-OAuth path.)
- **Remediation:** Validate `next` client-side with the same rule used server-side (must start with `/`, reject `//`, `\`, `:`, control chars) before `router.push`, or reuse a shared `safeDestination` helper.
- **Verification:** Navigate to `/login?next=https://evil.com`, authenticate, confirm navigation is blocked; test `/login?next=//evil.com` and `/login?next=/admin/..%2fevil.com`.

### M3. Admin notification webhook URL shipped in the public client bundle
- **OWASP:** A05 / A08 (Security Misconfiguration / Data Integrity) — CWE-200; Discord-webhook abuse
- **File:** `src/app/request-space/page.tsx:88-96`
- **Issue:** `NEXT_PUBLIC_ADMIN_WEBHOOK_URL` is inlined into the client JS bundle and POSTed to directly from the browser with attacker-controlled content (name, phone, budget, location). Anyone can extract the webhook URL and spam the admin notification channel with arbitrary messages (channel disruption, phishing of admins posing as "urgent space request"). Webhook tokens cannot be rotated from the app.
- **Remediation:** Move the webhook POST into a `'use server'` action or API route using a server-only env var (e.g., `ADMIN_WEBHOOK_URL`), with validation of the payload and per-user/IP rate limiting.
- **Verification:** After the move, confirm `NEXT_PUBLIC_ADMIN_WEBHOOK_URL` no longer appears in the production JS bundle (`grep -r "webhook" .next/static`).

### M4. Email/password change without reauthentication
- **OWASP:** A07 (Authentication Failures) — CWE-620
- **File:** `src/components/dashboard/DashboardTabs.tsx:511-565`
- **Issue:** `handleUpdateEmail` calls `supabase.auth.updateUser({ email })` and `handleUpdatePassword` calls `updateUser({ password })` with only a 6-char length check. The `currentPassword` state (line 154) and input are collected but **never used**. There is no `reauthenticate()` (password/SMS-OTP) step. An attacker with a hijacked session (stolen cookie, XSS, shared device) changes the password and swaps the email in under a minute — the victim's recovery link goes to the attacker's inbox. Only Supabase's "recent sign-in" heuristic stands between a compromised session and full account takeover.
- **Remediation:** Call `supabase.auth.reauthenticate()` (current password or OTP) before email/password mutations; require email confirmation for the new address before it becomes active; enable AAL2/MFA-sensitive flows.
- **Verification:** With a stolen (but unexpired) session, confirm password+email changes now prompt for reauthentication and fail without it.

### M5. Rate-limit bypass via spoofable `X-Forwarded-For` + per-instance in-memory state
- **OWASP:** API4 (Resource Consumption) — CWE-770
- **File:** `src/utils/rateLimit.ts:32-36`
- **Issue:** `getClientIp()` trusts the **first** value of the client-supplied `X-Forwarded-For` header (falls back to `X-Real-IP`). Any attacker can rotate `X-Forwarded-For` per request and exhaust `/api/geocode` (30/min/IP) and `/api/report` (5/hour/IP) budgets instantly. Buckets are also in-memory per instance — limits reset on redeploy and don't hold across multiple serverless instances.
- **Remediation:** Derive IP from a trusted source (platform-provided header only — e.g., Vercel's `x-vercel-forwarded-for`/`request.ip`), or use an external/DB-backed rate limiter (Supabase in-memory store, Upstash). At minimum, document the deployment's trusted-proxy configuration and drop user-supplied values.
- **Verification:** Send 31 requests with rotating `X-Forwarded-For` values; confirm the 30/min limit still triggers.

### M6. Unauthenticated analytics/lead counter inflation
- **OWASP:** A01 / API4 — CWE-799; data-integrity
- **Files:**
  - `src/app/actions/leads.ts:6-16` — `trackWhatsAppClick(listingId)`: server action with **no auth, no format/ownership validation**, silently swallowing errors
  - `supabase/migrations/20260807000004_harden_analytics_rpcs.sql:88-89` — `increment_listing_views` / `increment_whatsapp_leads` still `GRANT EXECUTE … TO anon, authenticated`
  - `src/app/listings/[id]/page.tsx:255` — fire-and-forget view increment
- **Issue:** The 60s throttle is per **(listing, event)** — not per caller. A script can call the anon RPC once per minute per listing UUID, inflating `views`/`whatsapp_leads_count` up to ~1,440/day per listing, corrupting public counters and the lead-conversion analytics dashboard. There is no caller identity to rate-limit against.
- **Remediation:** Move counter writes behind the server action **with** auth/session (or per-IP limiter), revoke anon EXECUTE, and key the in-function throttle to a per-caller fingerprint (`auth.uid()` + IP) so a single caller can't monopolize a listing's event window.
- **Verification:** After the fix, confirm `has_function_privilege('anon', …)` is false for both functions and the server action rejects unauthenticated requests.

---

## LOW SEVERITY

### L1. Mass-assignment surface in `updateAmenity`
- **File:** `src/app/actions/configActions.ts:24-34`
- **Issue:** The `updates` object is passed straight into `.update(updates)` with no runtime allowlist. TS types restrict it to `{name?, is_active?}` at compile time only; a crafted server-action call (or future caller) could write extra columns (`sort_order`, `created_at`, etc.). Admin-only, so impact is limited to admin compromise — still, whitelist the keys explicitly.

### L2. GET-triggered DB mutation on page render
- **File:** `src/app/admin/listing-health/page.tsx:23`
- **Issue:** Every render of the page fires `fn_update_stale_listings` (a write RPC). Admin-only (layout-guarded), and the RPC is grant-restricted, but GET-triggered writes are an anti-pattern (crawler/prefetch amplification, surprising side effects). Move to a server action invoked on demand or a cron.

### L3. Client-only OTP throttle (SMS-cost abuse)
- **File:** `src/app/actions/authActions.ts:15-24`
- **Issue:** OTP resend limiting is a localStorage counter — trivially cleared/bypassed. SMS-bombing is prevented only by Supabase's server-side limits. Add server-side throttling (per phone/IP) in a server action and require CAPTCHA for OTP requests if cost matters.

### L4. Cookie-only session check in `dashboard/layout.tsx`
- **File:** `src/app/dashboard/layout.tsx:11`
- **Issue:** Uses `getSession()` (cookie-only, trusts the cookie) instead of `getUser()` (server-verified). Server actions re-verify with `getUser()`, so impact is limited to rendering the dashboard shell for stale sessions — but the shell can leak UI state/links. Use `getUser()` for consistency with the rest of the app.

### L5. PUBLIC EXECUTE on helper functions
- **Files:** `supabase/migrations/20260807000014_rls_enforce_active_account.sql:12` (`is_active_user`), `20260807000012/13/15` (`revoke_sessions_on_suspend`)
- **Issue:** Both `SECURITY DEFINER` functions retain default `PUBLIC EXECUTE`. `is_active_user` returns a boolean about the caller only (low risk), and `revoke_sessions_on_suspend` fails outside a trigger context — but this is inconsistent with the hardened posture. Revoke PUBLIC/anon and grant `authenticated` where needed.

### L6. Admin-role backfill re-runs on every migration apply
- **File:** `supabase/migrations/20260807000007_platform_admin_role.sql:31-33`
- **Issue:** The migration `UPDATE auth.users … WHERE email domain = propertyhubgh.com` re-grants `platform_admin` to **every current** `@propertyhubgh.com` account each time it runs (fresh environments, branch previews). Any account on that domain — test accounts, compromised mailboxes — becomes full platform admin. Since Supabase runs migrations only once per environment this is mostly inert in production, but the file should be made one-shot (e.g., guard on a `_migration_marker` or move to a manual backfill) and the current admin list audited.

### L7. `avatars` storage bucket policies absent from migrations **[LIVE-DB]**
- **File:** `src/components/dashboard/DashboardTabs.tsx:447-451` (avatar upload path `{userId}/avatar-…`); no `storage.objects` policy for the `avatars` bucket in `supabase/migrations/`
- **Issue:** The bucket was created out-of-band. `property-images` correctly scopes writes to `storage.foldername(name)[1] = auth.uid()`, but if `avatars` lacks equivalent policies, any authenticated user can overwrite another user's avatar (displayed across their listings) or exhaust bucket quota. Must verify live and mirror the `property-images` hardening (owner-scoped INSERT/UPDATE/DELETE + MIME/size limits).

### L8. CSP relies on `'unsafe-inline'` for scripts
- **File:** `next.config.ts:19`
- **Issue:** `script-src 'self' 'unsafe-inline'` weakens XSS mitigation (inline scripts execute). This is the standard Next.js trade-off without a nonce; if the app grows to store more user content, move to nonce-based CSP (`script-src 'self' 'nonce-…'`).

### L9. `neighborhoods` retains the only literal `USING (true)` policy
- **File:** `supabase/migrations/20260702161400_create_neighborhoods.sql:14`
- **Issue:** Benign reference data, but it is the single remaining unrestricted policy in the codebase. Restrict to `is_active = true` for consistency and future-proofing.

---

## Verified Clean (checked, no issues found)

- **Dependencies:** `npm audit` — 0 vulnerabilities (0 info/low/moderate/high/critical) across 871 packages.
- **Secrets:** No `service_role` key, API keys, or credentials in git history (all `sk_*` matches are inside skill-documentation markdown); `.env.local` contains only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` and is gitignored; no `.env*` files tracked.
- **JSON-LD stored XSS (Aug-7 H1):** FIXED — `src/components/seo/JsonLd.tsx:7-13` escapes `<`, `>`, `&`, U+2028/U+2029 before `dangerouslySetInnerHTML`. No other raw `JSON.stringify` into `<script>` exists in `src/`.
- **Listing moderation bypass (Aug-7 H2):** FIXED — trigger forces `moderation_status='pending'` on non-admin insert and blocks non-admin moderation changes (`20260807000000`); public read requires `status='active' AND moderation_status='approved'`.
- **Anonymous space_requests PII (Aug-7 H3):** PARTIALLY FIXED — anon can no longer read `whatsapp_number`/`user_id` or insert; **authenticated** exposure remains open (see H2).
- **Security headers (Aug-7 M5):** FIXED — `next.config.ts:14-50` sets CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, HSTS, Permissions-Policy.
- **Admin elevation (Aug-7 M4):** FIXED — role-based `platform_admin` in `app_metadata` via `is_platform_admin()`; all email-domain policies dropped; admin RPCs internally guarded.
- **Suspension enforcement (Aug-7 L5):** FIXED end-to-end — `src/proxy.ts` edge check, `getActiveUser`/`assertActiveUser` guards, `revoke_sessions_on_suspend` trigger, `is_active_user()` RLS predicate.
- **Open redirect (OAuth path):** `safeDestination()` in `src/app/auth/callback/route.ts:13-31` correctly rejects off-origin, `//`, `\`, `:`, and control characters.
- **XSS sinks:** No `eval`, `new Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` anywhere in `src/`; all user-generated content renders as React text nodes.
- **`target="_blank"`:** all 10 occurrences carry `rel="noopener noreferrer"`.
- **Client-side admin gating:** none — every admin check is server-side (`assertAdmin()`).
- **SQL injection:** zero dynamic SQL in migrations (no `EXECUTE`, `format()`, `quote_ident` misuse).
- **SSRF:** no user-controlled URLs reach server-side fetches; `/api/geocode` is pinned to `nominatim.openstreetmap.org` with length caps; `images.remotePatterns` pinned to the Supabase storage host.
- **Sitemap:** anon-key queries pass through RLS, so only approved+active listings are emitted.
- **Realtime:** `system_alerts` subscription is admin-layout-gated and only triggers `router.refresh()` (no payload rendering).
- **obsidian-vault:** no longer tracked in git (0 files).
- **Audit logs:** `admin_audit_logs` immutable (INSERT/SELECT admin-only), every admin mutation logged.
- **Verification documents:** private bucket, 15-min signed URLs, admin-only read policy.
- **IDOR:** `fetchTimeframeAnalytics` re-derives identity from session and rejects `posterId !== user.id` (`src/app/actions/analytics.ts`).

---

## Prioritized Remediation Plan

1. **H1 (immediate):** Revoke anon/authenticated EXECUTE on `report_listing`; per-reporter throttle + distinct-reporter auto-flag.
2. **H2 (immediate):** Restrict `space_requests` public read to `anon`-only (or drop it) and extend column revokes to `authenticated`.
3. **H3 (immediate):** Run Appendix A verification; ship migration enabling RLS on `property_analytics` and creating `saved_listings`/`property_reports` with RLS + owner policies.
4. **M1 (this week):** Server-side URL allowlists + DB CHECK constraints on `whatsapp_link` / `floor_plan_url`.
5. **M3/M5/M6 (this week):** Move webhook to server-only env; harden IP extraction; restrict counter RPCs and throttle per caller.
6. **M2/M4, L1–L9 (scheduled):** Open-redirect validation, reauthentication for account mutations, mass-assignment allowlist, GET-mutation removal, OTP server throttle, `getUser()` consistency, grant lockdowns, avatar-bucket policies, CSP nonce, neighborhoods policy.

---

## Appendix A — Live-DB verification queries (required to close H3, L7)

```sql
-- 1. RLS state of every public table
SELECT relname, relrowsecurity FROM pg_class
WHERE relnamespace = 'public'::regnamespace AND relkind='r' ORDER BY relname;

-- 2. Policies per table (focus: property_analytics, saved_listings, property_reports)
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies WHERE schemaname='public'
  AND tablename IN ('property_analytics','saved_listings','property_reports')
ORDER BY tablename;

-- 3. anon privileges on the three tables (expect: NONE)
SELECT grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema='public'
  AND table_name IN ('property_analytics','saved_listings','property_reports')
  AND grantee IN ('anon','authenticated');

-- 4. RPC EXECUTE grants (expect: report_listing/increment_* NOT anon)
SELECT p.proname, g.grantee FROM pg_proc p
JOIN information_schema.routine_privileges g
  ON g.routine_name = p.proname AND g.routine_schema='public'
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN ('report_listing','increment_listing_views','increment_whatsapp_leads',
                    'is_active_user','revoke_sessions_on_suspend')
  AND g.grantee IN ('anon','authenticated','PUBLIC');

-- 5. avatars bucket policies
SELECT bucket_id, name, created_at FROM storage.buckets WHERE name='avatars';
SELECT * FROM storage.policies WHERE bucket_id='avatars';
```

---

## Appendix B — Audit Methodology

- OWASP Top 10 (2021) checklist-driven source review (owasp-audit skill)
- OWASP API Security Top 10 (2023) review of all RPC endpoints, server actions, and route handlers (api-security-review skill)
- Independent adversarial second-opinion pass (fresh reviewer, "assume the author is overconfident" framing)
- Full migration-set policy/function/grant analysis; `npm audit`; git-history secret sweep; env-file key-name review
- Findings were verified against actual file contents at the cited line numbers before classification

*Report generated 2026-08-11. Findings marked **[LIVE-DB]** must be re-validated against the live project once accessible; a re-audit is recommended after the remediation migrations ship.*

# Plan: Suspended account login UX — permanent suspension modal

## Problem

When a suspended user attempts to log in, GoTrue allows the sign-in (the ban marker `banned_until` is set to the past as an immediate-revoke marker), a live session is issued, and the user is sent to `/rentals`. The proxy bounces them on the next request, but meanwhile:

1. The user experiences "login succeeded then thrown out" confusion.
2. Once the pre-suspension access token expires, `proxy.ts`'s `getUser()` cannot refresh (refresh tokens were deleted) → returns `null` → the suspension check is skipped → stale session cookies pass through → the nav renders a phantom avatar + dashboard shortcuts that don't work.

Desired UX (user-confirmed): a **suspension message modal on the login page** that stays put — no auto-redirect, no "browse anonymously" button. Just "Back to Home" and "Contact Support" links.

## Root cause

- `revoke_sessions_on_suspend()` sets `banned_until = statement_timestamp()` (always in the past) → GoTrue's `banned_until > now()` check never blocks sign-in or refresh.
- `src/proxy.ts` skips the suspension check when `getUser()` returns null (refresh-blocked stale session).

## Changes

### 1. DB migration (applied via MCP apply_migration)

`supabase/migrations/20260813000005_suspended_account_ban.sql` — `CREATE OR REPLACE FUNCTION public.revoke_sessions_on_suspend()`:

- Suspend branch AND delete branch: `banned_until = statement_timestamp() + interval '3650 days'`.
- Active/reactivate branch already sets `banned_until = NULL` — unchanged.
- Refresh-token deletion stays unchanged.

Effect: GoTrue refuses password sign-in (403 "User is banned"), refuses token refresh, and OTP/Google flows fail at the provider boundary. Reactivation clears the ban → user can log in again.

### 2. Login page suspension modal

`src/app/login/page.tsx` (client):

- Add `suspensionOpen` state + detect banned error: `signInWithPassword` error message === `'User is banned'` (and `verifyPhoneOtp` returning the same via `authActions` error passthrough) → set `suspensionOpen = true` instead of rendering the inline error.
- Modal (fixed overlay, navy `#0d1b2a` background, gold `#eab308` accent, design-system styles):
  - Heading: "Account Suspended"
  - Body: "Your account has been suspended by the Property Hub GH trust team. If you believe this is a mistake, please contact our support team."
  - Actions: "Back to Home" (`Link href="/"`, navy solid) + "Contact Support" (`a href="mailto:support@propertyhubgh.com"`, outline) — matches support contact used on the cookie-policy page.
  - Close (X) button + Escape/overlay click to dismiss; modal stays until dismissed (no auto-redirect, no sign-out button — GoTrue refused the session, nothing to sign out).
- Do not touch the `?next=` post-login logic.

### 3. OAuth callback catch

`src/app/auth/callback/route.ts`: after successful `exchangeCodeForSession`, query `profiles.account_status` for the session user; if `suspended` or `deleted` → `signOut()` + redirect to `/login?suspended=1` (login page consumes the param and shows the suspension modal). Covers Google OAuth (and any future provider) where GoTrue issues a session without a password check.

### 4. Proxy stale-session fix

`src/proxy.ts`: when auth cookies exist but `getUser()` returns `null`, fall back to `getSession()`; if it yields a session user → check `profiles.account_status`; if `suspended`/`deleted` → `signOut()` + redirect `/unauthorized?reason=<status>` (existing redirect block, reused). Fixes the phantom-avatar pass-through.

## Verification

1. Migration applied via MCP; SQL checks: after suspend, `banned_until` is ~3650 days in the future; after reactivate, NULL.
2. `npm run lint` (0 errors) + `npx tsc --noEmit`.
3. Manual (dev server):
   - Suspend azikitey → login attempt → modal appears, no redirect, no session (avatar stays hidden on public pages after refresh).
   - Modal dismiss → "Back to Home" works; "Contact Support" opens mailto.
   - Reactivate → login succeeds normally.
   - Stale-session case: with azikitey logged in, suspend them → navigate → `/unauthorized` (not a pass-through with avatar).
   - Google OAuth path: suspended user signs in with Google → bounced to login with modal (if testable).
4. Resume user-management walkthrough steps 5–10 afterwards.

## Notes

- `/unauthorized` page remains the server-side fallback surface for sessions suspended mid-flight (correct — those sessions were already live).
- Register page for a suspended email: out of scope (GoTrue bans also block signup for existing users; error already surfaces inline).
- No changes to admin drawer flows (suspend/delete/reactivate/restore already verified).
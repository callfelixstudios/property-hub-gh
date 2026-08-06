# Milestone Update — Footer Social Links + Address Update

## 1. Execution Timestamp

`Executed on: 2026-08-06 at 17:00:58 GMT`

## 2. Milestone Summary

**Update performed:** Footer social links wired to real brand profiles and contact address updated in `src/components/Footer.tsx`.

- **Social links:** Replaced placeholder `#` hrefs with live profiles — new **Facebook** (`facebook.com/prophub.gh`), **Instagram** (`instagram.com/propertyhub.gh/`), new **TikTok** (`tiktok.com/@propertyhub.gh`), and **Twitter/X** (`x.com/propertyhub_gh`). All open in a new tab (`target="_blank" rel="noopener noreferrer"`) with correct SVGs (replaced old LinkedIn icon with TikTok, added Facebook icon, kept X icon). LinkedIn icon removed.
- **Address update:** Changed office address from `14 Nima Crescent, Building A` to **`Tumu Road, Kanda`** (Accra, Ghana retained) and removed the landline `+233 (0) 302 171 200`; email `hello@propertyhubgh.com` unchanged.

Pushed commit `7f75df5` on `main` — **feat: add phone OTP and Google OAuth auth with strict type safety**.

- **Phone OTP authentication (Ghana):** Added `sendPhoneOtp` / `verifyPhoneOtp` server-bound actions backed by Supabase SMS OTP (type `sms`). Phone numbers are validated and normalized to E.164 (`+233XXXXXXXXX`) via new `phoneUtils.ts`.
- **Google OAuth:** Added `signInWithGoogle` action using `signInWithOAuth` with a redirect back to `/auth/callback` (supports `?next=` deep-link). New callback route exchanges the auth code for a session and redirects to `/rentals` (or the `next` target).
- **Centralized `AuthModal`:** New modal with a 5-step flow (`select`, `phone_input`, `otp_verify`, `email_login`, `email_register`), 60s OTP resend cooldown, inline Google "G" logo, and Escape/backdrop close. Refactored `NavigationHeader` to use it; expanded `/login` and `/register` pages.
- **Profile trigger migration:** `handle_new_user()` updated to populate `contact_phone` from `auth.users.phone` and fallback `full_name` for phone/email sign-ups, with `ON CONFLICT` upsert semantics.
- **Strict type safety cleanup:** Removed the `setState`-in-`useEffect` violation in `AuthModal` (replaced with render-time adjustment on open) and removed unused imports.

## 3. Files Modified

- `src/app/actions/authActions.ts`
- `src/app/auth/callback/route.ts`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/components/Footer.tsx`
- `src/components/NavigationHeader.tsx`
- `src/components/auth/AuthModal.tsx`
- `src/utils/phoneUtils.ts`
- `supabase/migrations/20260806000000_update_profile_trigger_for_phone.sql`

## 4. Data/UI Architecture State

- **Auth modal step states (`AuthModal.tsx`):** `Step = 'select' | 'phone_input' | 'otp_verify' | 'email_login' | 'email_register'`. Flow resets to `'select'` and clears all fields on each modal open (render-time reset, no `useEffect` setState). OTP resend uses a `resendCooldown` state counting down from 60s.
- **Forms:** Phone form collects local `0XX` input and formats to `+233` before sending; OTP input is numeric, 6-digit max (`tracking-[0.5em]`); email forms share `fullName/email/password` state between login/register steps.
- **Auth actions:** `sendPhoneOtp`/`verifyPhoneOtp` validate input locally, return discriminated `success: true|false` results; `signInWithGoogle` builds callback URL from `window.location.origin` and redirects browser to Google.
- **Callback route:** Stateless — exchanges `code` for session via `exchangeCodeForSession`, redirects to `${origin}${next}` (default `/rentals`), else to `/login?message=Authentication failed...`.
- **Supabase auth config:** Provider-based flows — phone SMS OTP + Google OAuth enabled client-side; phone numbers stored as `+233` E.164 in `auth.users.phone`. Session cookie handled by `@supabase/ssr`.
- **Database trigger state:** `migration 20260806000000` applied — `public.handle_new_user()` now inserts `{id, full_name, contact_phone}` with `COALESCE` fallbacks (name defaults to `'User'`) and upserts on conflict (`contact_phone` then `full_name` coalesce). Trigger remains `SECURITY DEFINER`.
- **Footer (`Footer.tsx`) — active state:**
  - Social icon links: Facebook `https://www.facebook.com/prophub.gh`, Instagram `https://www.instagram.com/propertyhub.gh/`, TikTok `https://www.tiktok.com/@propertyhub.gh`, X/Twitter `https://x.com/propertyhub_gh` — each `target="_blank" rel="noopener noreferrer"` with `aria-label`.
  - Contact block: address = `Tumu Road, Kanda` + `Accra, Ghana`; phone landline removed; email `hello@propertyhubgh.com` active.
- **Working tree:** clean on `main` (only untracked `.agents/task.md`).

## 5. Next Immediate Steps

- Verify end-to-end phone OTP SMS delivery and OTP verification against a live Supabase project (local testing of the migration before any prod apply; confirm trigger works for phone vs email sign-ups).
- Confirm Google OAuth redirect/callback against a deployed URL (redirect URL registered in Supabase provider config).
- Validate the profile upsert does not clobber existing `full_name`/`contact_phone` for existing users.
- Extend `NextAuth`/session-aware UI (NavBar user state) to surface authenticated user across pages.
- Run `next build`, lint, and typecheck clean-up pass after live verification.
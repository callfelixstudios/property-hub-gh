# User Management Admin Powers — Design

**Date:** 2026-08-14
**Status:** Approved by user (sections 1–3 reviewed individually)
**Project:** Property Hub GH (`property-hub-gh`)

## 1. Problem

The admin User Management page (`/admin/users`) only supports three quick toggles: verification badge, membership tier, and account suspend/reactivate. There is:

- No delete-user mechanism anywhere (no `auth.admin.deleteUser`, no RPC, no action).
- No profile editing (name, company, phone, WhatsApp, currency).
- No user detail view (listings, verification docs, audit history).
- No notify-user capability from the admin UI.
- No password-reset or impersonation tooling.
- No service-role client (`auth.admin` operations impossible).

## 2. Design decisions (locked with user)

1. **Delete = soft delete + archive, restorable, email retained.** `account_status='deleted'` (new state), sessions revoked, all listings archived/hidden. Restore is one-click back to `'active'`; listings go to the review queue (`pending`/`pending`). PII is NOT anonymized.
2. **Suspend also takes down listings.** Suspending a user flips their active listings to `status='pending'`, `moderation_status='suspended'` (same state as listing-level suspend). Reactivating returns them to the review queue.
3. **Auth-level powers: reset password AND impersonate.** Impersonation = admin-only session swap in the admin's own browser, red banner, full audit, 30-minute auto-expiry. Never for other platform admins.
4. **Account actions notify the user** via the `notifications` table (`account_suspended`, `account_deleted`, `account_reactivated`).
5. **Architecture: DB-enforced (approach B).** Invariants live in triggers/migrations, mirroring `enforce_listing_moderation`, `revoke_sessions_on_suspend`, `check_free_tier_listing_limit`. Server actions are thin orchestrators: assert admin → trigger-backed update → audit → revalidate.

## 3. Database changes

Single migration `supabase/migrations/20260813000004_user_management_admin_powers.sql`:

### 3.1 `account_status` CHECK constraint
Extend from `('active','suspended')` to `('active','suspended','deleted')`.

### 3.2 `is_active_user()` (RLS helper)
Also exclude `account_status = 'deleted'`, so deleted accounts cannot write anywhere RLS gates on `is_active_user()` (listings, saved_listings, space_requests, notifications UPDATE, profiles UPDATE).

### 3.3 `revoke_sessions_on_suspend()`
Treat transition-to-`'deleted'` like suspension: delete `auth.refresh_tokens` for the user and set `auth.users.banned_until = statement_timestamp()`. Clear `banned_until` on transition back to `'active'` (unchanged).

### 3.4 New guard: `enforce_account_status_guard()`
BEFORE UPDATE OF `account_status` ON `profiles`:
- Raise unless `public.is_platform_admin()` — prevents users from self-changing status via the "Users can update their own profile" RLS policy.
- Raise if the target profile is itself a platform admin and the NEW status is not `'active'` (cannot suspend/delete another admin).

### 3.5 New trigger: `sync_listings_with_account_status()`
AFTER UPDATE OF `account_status` ON `profiles`, per affected profile row:
- → `'suspended'`: all their `status='active'` listings → `status='pending'`, `moderation_status='suspended'`, `moderation_note='Account suspended by admin'`, `moderated_by`/`moderated_at` set (admin email from `auth.jwt()`).
- → `'deleted'`: all their `status='active'` listings → `status='archived'`, `moderation_status='deleted'`, `listing_health='archived'` (mirrors existing `deleteListing` server action).
- → `'active'` (reactivate/restore): listings touched by the takedown return to `status='pending'`, `moderation_status='pending'` (review queue). Restore condition is explicit per takedown state: `(moderation_status='suspended' AND status='pending')` OR `(moderation_status='deleted' AND status='archived')`. Listings in any other state (e.g. a listing individually suspended before the account takedown) are not touched.
- Insert account-level notifications: `account_suspended`, `account_deleted`, `account_reactivated` (SECURITY DEFINER bypasses RLS; atomic with the status change).

## 4. New service-role client

`src/utils/supabase/admin.ts` — `createServerClient` using `SUPABASE_SERVICE_ROLE_KEY` env var (server-only). Used exclusively by admin-guarded server actions for `auth.admin.generateLink` (password recovery, impersonation magic link). Never exposed to the client bundle. Requires adding `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

## 5. Server actions

New file `src/app/actions/userManagementActions.ts` (keeps `adminActions.ts` listing-focused). Every mutation: `assertAdmin()` → DB write → `logAdminAction` → `revalidatePath('/admin/users')`.

| Action | Behavior |
|---|---|
| `getUserDetail(userId)` | Read-only: full profile, user's listings (status/moderation/health), `admin_audit_logs` history for the user. |
| `updateUserProfile(userId, fields)` | Edit `full_name`, `company_name`, `contact_phone`, `whatsapp_link`, `preferred_currency`; validate WhatsApp link against existing `chk_profiles_whatsapp_link` regex. Audit `USER_PROFILE_UPDATE`. |
| `sendUserNotification(userId, title, body)` | Insert into `notifications` (admin INSERT policy exists). Audit `USER_NOTIFY`. |
| `suspendUser(userId, reason?)` | `account_status='suspended'`; trigger handles listings/sessions/notification. Audit `USER_SUSPEND`. |
| `reactivateUser(userId)` | `account_status='active'`; listings → review queue. Audit `USER_REACTIVATE`. |
| `deleteUser(userId)` | `account_status='deleted'`; listings archived. Audit `USER_DELETE`. |
| `restoreUser(userId)` | `account_status='active'`; listings → review queue. Audit `USER_RESTORE`. |
| `resetUserPassword(userId)` | Service-role `auth.admin.generateLink({type:'recovery', email})`; returns link for admin to copy/send (no email infra in app). Audit `USER_PASSWORD_RESET`. |
| `impersonateUser(userId)` | `auth.admin.generateLink({type:'magiclink', email})` → `verifyOtp` with token → store admin's current session in httpOnly `ph_admin_session` cookie → swap to user session → set `ph_impersonating` cookie (`{userId, adminId, expiresAt: now+30min}`). Blocked for platform admins. Audit `USER_IMPERSONATE_START`. |
| `exitImpersonation()` | Restore admin session from `ph_admin_session`, clear both cookies. Audit `USER_IMPERSONATE_END`. Expiry checked on banner mount + server-side. |

All four account-status actions block targeting self or another platform admin (app-side; DB guard is the backstop).

## 6. UI changes

### 6.1 New: `src/components/admin/UserDetailDrawer.tsx` (client)
Right-side drawer, opened by row click on `UserManagementTable`:
- Header: avatar, name, email, status/tier/verified badges.
- Profile edit form: 5 editable fields, inline save → `updateUserProfile`.
- Account actions: Suspend (reason prompt) / Reactivate, Delete (confirm modal) / Restore, Send notification (title + body modal), Reset password (modal with copyable recovery link), Impersonate (confirm modal warning + 30-min expiry).
- Listings section: user's listings with status/moderation badges (from `getUserDetail`).
- Audit trail: `admin_audit_logs` rows (action type, before/after JSON, timestamp).

### 6.2 Update: `src/components/admin/UserManagementTable.tsx`
- Row click → opens drawer (keep existing quick toggles: verify, tier, suspend).
- Status filter gains `deleted` option; suspended/deleted rows keep visual distinction (dimmed).

### 6.3 Update: `src/app/admin/users/page.tsx`
- KPI cards gain Deleted Accounts. `AdminUser` type unchanged — new status flows through existing `account_status` field.

### 6.4 New: `src/components/admin/ImpersonationBanner.tsx` (client)
- Sticky red banner "Viewing as [name] — Exit" when `ph_impersonating` cookie present; exit → `exitImpersonation`; auto-expiry check on mount. Mounted in admin layout.

### 6.5 Update: `src/proxy.ts`
- Extend suspended-account check to also catch `account_status='deleted'` (redirect to `/unauthorized?reason=deleted`), consistent with L5 hardening.

## 7. Environment

- New server-only env var `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

## 8. Verification plan

- SQL checks in rollback transactions (via MCP):
  - `'deleted'` writes pass the new CHECK constraint.
  - `is_active_user()` returns false for deleted accounts.
  - Suspend takedown → listings `pending`/`suspended`.
  - Delete → listings `archived`/`deleted`.
  - Reactivate/restore → listings `pending`/`pending`.
  - Non-admin `account_status` change blocked by guard.
  - Admin-targeting blocked by guard.
  - Account notifications inserted on suspend/delete/reactivate.
- `npm run lint` + `npm run build`.
- Manual UI walkthrough on `/admin/users` (drawer, all actions, impersonation banner, exit flow).

## 9. Out of scope

- Email/SMS delivery of recovery links (app has none; admin copies the link).
- Hard deletion / GDPR PII anonymization (deliberately deferred — soft delete with email retained).
- Impersonation for platform admins (blocked by design).

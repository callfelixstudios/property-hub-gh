# User Management Admin Powers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admins full account powers on `/admin/users`: soft-delete/restore, profile editing, notifications, password reset, impersonation, and DB-enforced takedown of listings on suspend/delete.

**Architecture:** DB-enforced (approach B). All invariants live in a single SQL migration (CHECK constraint, RLS helper, session-revocation, a status guard, and a listings-sync trigger). Thin server actions orchestrate: `assertAdmin()` → write → audit (`admin_audit_logs`) → `revalidatePath`. UI adds a detail drawer, an impersonation banner (mounted in the root layout), and a Deleted KPI. A new service-role client (`auth.admin.generateLink`) powers password reset and impersonation.

**Tech Stack:** Next.js 16 (App Router, Turbopack), @supabase/ssr, supabase-js, lucide-react, Tailwind. Shell is PowerShell. Supabase project `lqitnsvtqhsowvmaxjio`; migrations are plain SQL in `supabase/migrations/` applied via MCP `apply_migration` (NO drizzle).

## Global Constraints

- All migrations go to `supabase/migrations/` as SQL files, then applied via MCP `apply_migration` to project `lqitnsvtqhsowvmaxjio`. Never `drizzle push`.
- Every mutation server action: `assertAdmin()` first, then `logAdminAction(...)`, then `revalidatePath('/admin/users')`.
- DB-side admin identity: `public.is_platform_admin()` reads `auth.jwt()->'app_metadata'->>'role' = 'platform_admin'`; app-side `isPlatformAdmin(user)` checks `user.app_metadata?.role === 'platform_admin'`.
- Admin user (tests): `39500ec0-0845-4943-a12e-5f22548aff7e` / `envision7954@propertyhubgh.com`. Non-admin free-tier test user: `8d1f15c9-955d-4e69-a802-684c33761535`. Test listings: `6980b2a6-4ed6-4386-87c7-db0582802016` (active/approved), `7742a7c2-0134-4481-b26f-4590303e4392` (pending/suspended, poster `8d1f15c9`).
- Design system: follow `DESIGN.md` (navy `#0d1b2a`, gold `#eab308`, white cards, rounded-xl, slate borders).
- Verification: SQL rollback tests via MCP `execute_sql` for DB work; `npm run lint` and `npm run build` for all code. No test framework exists in this repo.
- No comments in code unless required by existing file patterns.
- Shell is PowerShell 5.1 — no `&&`; chain with `; if ($?) { ... }`.

---

### Task 1: DB migration — account statuses, guards, listings sync

**Files:**
- Create: `supabase/migrations/20260813000004_user_management_admin_powers.sql`
- Verify: via MCP `execute_sql` on `lqitnsvtqhsowvmaxjio`

**Interfaces:**
- Consumes: existing `public.is_platform_admin()`, `public.revoke_sessions_on_suspend()`, `public.is_active_user()`, `profiles` (id, account_status, membership_tier), `auth.users` (id, app_metadata, banned_until), `auth.refresh_tokens` (user_id text), `public.listings` (poster_id, status, moderation_status, listing_health, moderation_note, moderated_by, moderated_at), `public.notifications` (user_id, type, title, body, metadata).
- Produces: functions `public.enforce_account_status_guard()`, `public.sync_listings_with_account_status()`; extended `account_status` CHECK with `'deleted'`; updated `is_active_user()`, `revoke_sessions_on_suspend()`; trigger `sync_listings_with_account_status` on profiles AFTER UPDATE OF account_status; trigger `enforce_account_status_guard` on profiles BEFORE UPDATE OF account_status. Notification types: `account_suspended`, `account_deleted`, `account_reactivated`.

- [ ] **Step 1: Write the migration file**

```sql
-- migration file: supabase/migrations/20260813000004_user_management_admin_powers.sql
-- Admin account powers: soft-delete status, guards, and listings takedown/restore.

-- 1) Allow the 'deleted' account status.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended', 'deleted'));

-- 2) Deleted accounts are treated as inactive by RLS (write-blocked everywhere).
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND account_status IN ('suspended', 'deleted')
  );
$$;

-- 3) Revoke sessions + ban on 'deleted' just like 'suspended'.
CREATE OR REPLACE FUNCTION public.revoke_sessions_on_suspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.account_status IN ('suspended', 'deleted')
     AND OLD.account_status IS DISTINCT FROM NEW.account_status THEN
    DELETE FROM auth.refresh_tokens WHERE user_id = NEW.id::text;
    UPDATE auth.users
    SET banned_until = statement_timestamp()
    WHERE id = NEW.id
      AND (banned_until IS NULL OR banned_until <= statement_timestamp());
  ELSIF NEW.account_status = 'active'
        AND OLD.account_status IS DISTINCT FROM 'active' THEN
    UPDATE auth.users
    SET banned_until = NULL
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Guard: only platform admins change account_status; admins cannot be
--    suspended/deleted. Mirrors enforce_listing_moderation's admin bypass.
CREATE OR REPLACE FUNCTION public.enforce_account_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can change account status.';
  END IF;

  IF NEW.account_status <> 'active'
     AND EXISTS (
       SELECT 1 FROM auth.users
       WHERE id = NEW.id
         AND COALESCE(app_metadata->>'role', '') = 'platform_admin'
     ) THEN
    RAISE EXCEPTION 'Cannot suspend or delete a platform admin.';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_account_status_guard ON public.profiles;
CREATE TRIGGER enforce_account_status_guard
BEFORE UPDATE OF account_status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_account_status_guard();

-- 5) Takedown/restore listings atomically with account status changes,
--    and notify the owner.
CREATE OR REPLACE FUNCTION public.sync_listings_with_account_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_admin_email text := COALESCE(auth.jwt() ->> 'email', 'system');
BEGIN
  IF NEW.account_status = 'suspended'
     AND OLD.account_status IS DISTINCT FROM 'suspended' THEN
    UPDATE public.listings
    SET moderation_status = 'suspended',
        status = 'pending',
        moderation_note = 'Account suspended by admin',
        moderated_by = v_admin_email,
        moderated_at = statement_timestamp()
    WHERE poster_id = NEW.id AND status = 'active';

    INSERT INTO public.notifications (user_id, type, title, body, metadata)
    VALUES (
      NEW.id, 'account_suspended', 'Account Suspended',
      'Your Property Hub GH account has been suspended by the platform team.',
      jsonb_build_object('reason', 'Account suspended by admin')
    );

  ELSIF NEW.account_status = 'deleted'
        AND OLD.account_status IS DISTINCT FROM 'deleted' THEN
    UPDATE public.listings
    SET status = 'archived',
        moderation_status = 'deleted',
        listing_health = 'archived',
        moderated_by = v_admin_email,
        moderated_at = statement_timestamp()
    WHERE poster_id = NEW.id AND status = 'active';

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.id, 'account_deleted', 'Account Deleted',
      'Your Property Hub GH account has been deleted by the platform team.'
    );

  ELSIF NEW.account_status = 'active'
        AND OLD.account_status IS DISTINCT FROM 'active' THEN
    UPDATE public.listings
    SET status = 'pending',
        moderation_status = 'pending',
        moderation_note = NULL,
        moderated_by = NULL,
        moderated_at = NULL
    WHERE poster_id = NEW.id
      AND (   (moderation_status = 'suspended' AND status = 'pending')
           OR (moderation_status = 'deleted'   AND status = 'archived') );

    INSERT INTO public.notifications (user_id, type, title, body)
    VALUES (
      NEW.id, 'account_reactivated', 'Account Reactivated',
      'Your Property Hub GH account has been reactivated. Your listings are back in the review queue.'
    );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_listings_with_account_status ON public.profiles;
CREATE TRIGGER sync_listings_with_account_status
AFTER UPDATE OF account_status ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_listings_with_account_status();
```

- [ ] **Step 2: Apply the migration**

Run: MCP `apply_migration` on `lqitnsvtqhsowvmaxjio`, name `user_management_admin_powers`, query = the exact SQL above. Expected: `success: true`.

- [ ] **Step 3: Verify 'deleted' passes the CHECK and deleted accounts fail `is_active_user()`**

Run (MCP `execute_sql`, project `lqitnsvtqhsowvmaxjio`):

```sql
select set_config('request.jwt.claims', '{"sub":"39500ec0-0845-4943-a12e-5f22548aff7e","app_metadata":{"role":"platform_admin"}}', false);
BEGIN;
UPDATE public.profiles SET account_status='deleted' WHERE id='8d1f15c9-955d-4e69-a802-684c33761535';
select public.is_active_user();
ROLLBACK;
```

Expected: UPDATE succeeds (no 23514), `is_active_user()` returns `false` (deleted now blocks writes).

- [ ] **Step 4: Verify suspend takedown, delete archive, and restore to review queue**

Run (MCP `execute_sql`):

```sql
select set_config('request.jwt.claims', '{"sub":"39500ec0-0845-4943-a12e-5f22548aff7e","app_metadata":{"role":"platform_admin"}}', false);
BEGIN;
-- ensure the non-admin user has an active listing to take down
UPDATE public.listings SET status='active', moderation_status='approved' WHERE id='7742a7c2-0134-4481-b26f-4590303e4392';
-- suspend the user
UPDATE public.profiles SET account_status='suspended' WHERE id='8d1f15c9-955d-4e69-a802-684c33761535';
SELECT 'after-suspend' as stage, status, moderation_status FROM public.listings WHERE id='7742a7c2-0134-4481-b26f-4590303e4392';
SELECT type, title FROM public.notifications WHERE user_id='8d1f15c9-955d-4e69-a802-684c33761535' ORDER BY created_at DESC LIMIT 1;
-- reactivate -> listings to review queue
UPDATE public.profiles SET account_status='active' WHERE id='8d1f15c9-955d-4e69-a802-684c33761535';
SELECT 'after-reactivate' as stage, status, moderation_status FROM public.listings WHERE id='7742a7c2-0134-4481-b26f-4590303e4392';
-- delete -> archive
UPDATE public.profiles SET account_status='deleted' WHERE id='8d1f15c9-955d-4e69-a802-684c33761535';
SELECT 'after-delete' as stage, status, moderation_status, listing_health FROM public.listings WHERE id='7742a7c2-0134-4481-b26f-4590303e4392';
ROLLBACK;
```

Expected: after-suspend = `pending/suspended`; notification `account_suspended` exists; after-reactivate = `pending/pending`; after-delete = `archived/deleted/archived`.

- [ ] **Step 5: Verify guards — non-admin blocked; admin-targeting blocked**

Run (MCP `execute_sql`):

```sql
select set_config('request.jwt.claims', '{"sub":"8d1f15c9-955d-4e69-a802-684c33761535","app_metadata":{"role":null}}', false);
BEGIN;
UPDATE public.profiles SET account_status='suspended' WHERE id='8d1f15c9-955d-4e69-a802-684c33761535';
ROLLBACK;
```

Expected: error `P0001: Only platform admins can change account status.`

Then (MCP `execute_sql`):

```sql
select set_config('request.jwt.claims', '{"sub":"39500ec0-0845-4943-a12e-5f22548aff7e","app_metadata":{"role":"platform_admin"}}', false);
BEGIN;
UPDATE public.profiles SET account_status='suspended' WHERE id='39500ec0-0845-4943-a12e-5f22548aff7e';
ROLLBACK;
```

Expected: error `P0001: Cannot suspend or delete a platform admin.`

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260813000004_user_management_admin_powers.sql
git commit -m "feat: admin account powers - deleted status, guards, listings sync trigger"
```

---

### Task 2: Service-role client + env var

**Files:**
- Create: `src/utils/supabase/admin.ts`
- Modify: `.env.local` (add `SUPABASE_SERVICE_ROLE_KEY=...`) — obtain the key from the Supabase dashboard settings; do not commit it.

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: `export function createAdminClient()` returning a supabase-js client (NOT @supabase/ssr) with service-role auth, `persistSession: false`, `autoRefreshToken: false`.

- [ ] **Step 1: Write the service-role client**

```ts
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 2: Add the env var**

Run PowerShell:

```powershell
if (Test-Path .env.local) { Write-Output "exists" } else { New-Item -ItemType File .env.local | Out-Null; Write-Output "created" }
```

Then append `SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-dashboard>` to `.env.local` (do not print the value). Confirm the key works: the Supabase project settings → API → `service_role` secret.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` (in project root). Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/supabase/admin.ts
git commit -m "feat: service-role supabase client for auth.admin operations"
```

---

### Task 3: User management server actions

**Files:**
- Create: `src/app/actions/userManagementActions.ts`

**Interfaces:**
- Consumes: `assertAdmin`, `logAdminAction` from `@/utils/adminHelpers`; `createAdminClient` from `@/utils/supabase/admin`; `createClient` from `@/utils/supabase/server`; `cookies` from `next/headers`; `revalidatePath` from `next/cache`; `redirect` from `next/navigation`.
- Produces (all `'use server'`):
  - `getUserDetail(userId: string): Promise<UserDetail>` where `UserDetail = { profile: { id: string; full_name: string | null; company_name: string | null; contact_phone: string | null; whatsapp_link: string | null; preferred_currency: string | null; account_status: string; membership_tier: string; is_verified_agent: boolean; verification_status: string | null; document_type: string | null; license_number: string | null; document_url: string | null; created_at: string; email: string | null }, listings: { id: string; title: string; status: string; moderation_status: string; listing_health: string; created_at: string }[], auditLogs: { id: string; action_type: string; previous_values: unknown; new_values: unknown; created_at: string }[] }`
  - `updateUserProfile(userId: string, fields: { full_name?: string; company_name?: string; contact_phone?: string; whatsapp_link?: string; preferred_currency?: 'GHS' | 'USD' }): Promise<{ success: true }>`
  - `sendUserNotification(userId: string, title: string, body: string): Promise<{ success: true }>`
  - `suspendUser(userId: string, reason?: string): Promise<{ success: true }>`
  - `reactivateUser(userId: string): Promise<{ success: true }>`
  - `deleteUser(userId: string): Promise<{ success: true }>`
  - `restoreUser(userId: string): Promise<{ success: true }>`
  - `resetUserPassword(userId: string): Promise<{ success: true; link: string }>`
  - `impersonateUser(userId: string): Promise<{ success: true }>` (then redirects to `/dashboard`)
  - `exitImpersonation(): Promise<{ success: true }>` (then redirects to `/admin/users`)
- Audit action types: `USER_PROFILE_UPDATE`, `USER_NOTIFY`, `USER_SUSPEND`, `USER_REACTIVATE`, `USER_DELETE`, `USER_RESTORE`, `USER_PASSWORD_RESET`, `USER_IMPERSONATE_START`, `USER_IMPERSONATE_END`.

- [ ] **Step 1: Write the actions file**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

const IMPERSONATION_TTL_MS = 30 * 60 * 1000;

export interface UserDetail {
  profile: {
    id: string;
    full_name: string | null;
    company_name: string | null;
    contact_phone: string | null;
    whatsapp_link: string | null;
    preferred_currency: string | null;
    account_status: string;
    membership_tier: string;
    is_verified_agent: boolean;
    verification_status: string | null;
    document_type: string | null;
    license_number: string | null;
    document_url: string | null;
    created_at: string;
    email: string | null;
  };
  listings: {
    id: string;
    title: string;
    status: string;
    moderation_status: string;
    listing_health: string;
    created_at: string;
  }[];
  auditLogs: {
    id: string;
    action_type: string;
    previous_values: unknown;
    new_values: unknown;
    created_at: string;
  }[];
}

async function assertCanTargetUser(supabase: Awaited<ReturnType<typeof createClient>>, targetUserId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(targetUserId);
  if (error || !data.user) throw new Error('Target user not found');
  if (data.user.id === (await supabase.auth.getUser()).data.user?.id) {
    throw new Error('You cannot perform this action on your own account.');
  }
  if (data.user.app_metadata?.role === 'platform_admin') {
    throw new Error('You cannot perform this action on another platform admin.');
  }
  return data.user;
}

export async function getUserDetail(userId: string): Promise<UserDetail> {
  const { supabase } = await assertAdmin();
  const admin = createAdminClient();
  const { data: authUser } = await admin.auth.admin.getUserById(userId);

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, full_name, company_name, contact_phone, whatsapp_link, preferred_currency, account_status, membership_tier, is_verified_agent, verification_status, document_type, license_number, document_url, created_at'
    )
    .eq('id', userId)
    .single();

  if (!profile) throw new Error('Profile not found');

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status, moderation_status, listing_health, created_at')
    .eq('poster_id', userId)
    .order('created_at', { ascending: false });

  const { data: auditLogs } = await supabase
    .from('admin_audit_logs')
    .select('id, action_type, previous_values, new_values, created_at')
    .eq('target_id', userId)
    .order('created_at', { ascending: false });

  return {
    profile: { ...profile, email: authUser?.user?.email ?? null },
    listings: listings ?? [],
    auditLogs: auditLogs ?? [],
  };
}

export async function updateUserProfile(
  userId: string,
  fields: {
    full_name?: string;
    company_name?: string;
    contact_phone?: string;
    whatsapp_link?: string;
    preferred_currency?: 'GHS' | 'USD';
  }
) {
  const { supabase, user } = await assertAdmin();
  await assertCanTargetUser(supabase, userId);

  const patch: Record<string, string | null> = {};
  if (fields.full_name !== undefined) patch.full_name = fields.full_name.trim() || null;
  if (fields.company_name !== undefined) patch.company_name = fields.company_name.trim() || null;
  if (fields.contact_phone !== undefined) patch.contact_phone = fields.contact_phone.trim() || null;
  if (fields.whatsapp_link !== undefined) {
    const link = fields.whatsapp_link.trim();
    if (link && !/^https:\/\/wa\.me\/[0-9]+$/.test(link)) {
      throw new Error('WhatsApp link must be in the format https://wa.me/XXXXXXXX');
    }
    patch.whatsapp_link = link || null;
  }
  if (fields.preferred_currency !== undefined) patch.preferred_currency = fields.preferred_currency;

  const { data: prev } = await supabase
    .from('profiles')
    .select(
      'full_name, company_name, contact_phone, whatsapp_link, preferred_currency'
    )
    .eq('id', userId)
    .single();

  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(`Failed to update profile: ${error.message}`);

  await logAdminAction(supabase, user.id, 'USER_PROFILE_UPDATE', userId, prev, patch);
  revalidatePath('/admin/users');
  return { success: true as const };
}

export async function sendUserNotification(userId: string, title: string, body: string) {
  const { supabase, user } = await assertAdmin();
  await assertCanTargetUser(supabase, userId);

  if (!title.trim() || title.trim().length > 200) throw new Error('Invalid notification title');
  if (!body.trim() || body.trim().length > 2000) throw new Error('Invalid notification body');

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: 'admin_notice',
    title: title.trim(),
    body: body.trim(),
  });
  if (error) throw new Error(`Failed to send notification: ${error.message}`);

  await logAdminAction(supabase, user.id, 'USER_NOTIFY', userId, null, {
    title: title.trim(),
    body: body.trim(),
  });
  revalidatePath('/admin/users');
  return { success: true as const };
}

async function setAccountStatus(
  userId: string,
  status: 'active' | 'suspended' | 'deleted',
  actionType: string,
  reason?: string
) {
  const { supabase, user } = await assertAdmin();
  await assertCanTargetUser(supabase, userId);

  const { data: prev } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', userId)
    .single();

  const { error } = await supabase
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId);
  if (error) throw new Error(`Failed to update account status: ${error.message}`);

  const logData = reason?.trim() ? { account_status: status, reason: reason.trim() } : { account_status: status };
  await logAdminAction(supabase, user.id, actionType, userId, prev, logData);
  revalidatePath('/admin/users');
  return { success: true as const };
}

export async function suspendUser(userId: string, reason?: string) {
  return setAccountStatus(userId, 'suspended', 'USER_SUSPEND', reason);
}

export async function reactivateUser(userId: string) {
  return setAccountStatus(userId, 'active', 'USER_REACTIVATE');
}

export async function deleteUser(userId: string) {
  return setAccountStatus(userId, 'deleted', 'USER_DELETE');
}

export async function restoreUser(userId: string) {
  return setAccountStatus(userId, 'active', 'USER_RESTORE');
}

export async function resetUserPassword(userId: string) {
  const { supabase, user } = await assertAdmin();
  const target = await assertCanTargetUser(supabase, userId);
  if (!target.email) throw new Error('Target user has no email on file');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: target.email,
  });
  if (error || !data.properties.action_link) {
    throw new Error(`Failed to generate recovery link: ${error?.message ?? 'unknown'}`);
  }

  await logAdminAction(supabase, user.id, 'USER_PASSWORD_RESET', userId, null, {
    email: target.email,
  });
  return { success: true as const, link: data.properties.action_link };
}

export async function impersonateUser(userId: string) {
  const { supabase, user: adminUser } = await assertAdmin();
  const target = await assertCanTargetUser(supabase, userId);
  if (!target.email) throw new Error('Target user has no email on file');

  const cookieStore = await cookies();
  const { data: { session: adminSession } } = await supabase.auth.getSession();
  if (!adminSession) throw new Error('Could not capture your admin session');

  // Capture + audit BEFORE any session mutation, so the audit insert runs
  // under the admin identity.
  cookieStore.set('ph_admin_session', JSON.stringify({
    access_token: adminSession.access_token,
    refresh_token: adminSession.refresh_token,
  }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });

  await logAdminAction(supabase, adminUser.id, 'USER_IMPERSONATE_START', userId, null, {
    expiresInMinutes: 30,
  });

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: target.email,
  });
  if (linkError || !linkData.properties.action_link) {
    throw new Error(`Failed to create impersonation session: ${linkError?.message ?? 'unknown'}`);
  }

  const token = new URL(linkData.properties.action_link).searchParams.get('token');
  if (!token) throw new Error('Failed to create impersonation session');

  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: token,
  });
  if (sessionError || !sessionData.session) {
    throw new Error(`Failed to establish impersonation session: ${sessionError?.message ?? 'unknown'}`);
  }

  await supabase.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });

  cookieStore.set('ph_impersonating', JSON.stringify({
    userId,
    adminId: adminUser.id,
    expiresAt: Date.now() + IMPERSONATION_TTL_MS,
  }), { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: IMPERSONATION_TTL_MS / 1000 });

  redirect('/dashboard');
}

export async function exitImpersonation() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const stored = cookieStore.get('ph_admin_session')?.value;
  const impersonated = cookieStore.get('ph_impersonating')?.value;
  let impersonatedUserId: string | null = null;

  if (impersonated) {
    try {
      impersonatedUserId = JSON.parse(decodeURIComponent(impersonated)).userId ?? null;
    } catch {
      // ignore malformed cookie
    }
  }

  if (stored) {
    try {
      const session = JSON.parse(stored);
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch {
      // Fall through: expired/invalid admin session; user can re-login.
    }
  }

  cookieStore.delete('ph_admin_session');
  cookieStore.delete('ph_impersonating');

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await logAdminAction(supabase, user.id, 'USER_IMPERSONATE_END', impersonatedUserId ?? user.id, null, {});
  }

  redirect('/admin/users');
}
```

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint; if ($?) { npx tsc --noEmit }`
Expected: no errors. (29 pre-existing lint warnings are acceptable.)

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/userManagementActions.ts
git commit -m "feat: user management server actions - profile edit, notify, suspend/delete/restore, password reset, impersonation"
```

---

### Task 4: User detail drawer component

**Files:**
- Create: `src/components/admin/UserDetailDrawer.tsx` (client)

**Interfaces:**
- Consumes: actions from Task 3 (`getUserDetail`, `updateUserProfile`, `sendUserNotification`, `suspendUser`, `reactivateUser`, `deleteUser`, `restoreUser`, `resetUserPassword`, `impersonateUser`); `AdminUser` type from `@/app/admin/users/page`; lucide-react icons; the app's design system.
- Produces: `UserDetailDrawer({ userId, open, onClose }: { userId: string | null; open: boolean; onClose: () => void })`. Manages its own loading/error/toast state. Calls `router.refresh()` after mutations.

- [ ] **Step 1: Write the drawer component**

Skeleton (client component; flesh out each section per the structure below — styling follows `ListingModerationQueue.tsx` conventions):

```tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  X, Loader2, ShieldCheck, ShieldOff, Ban, Trash2, RotateCcw,
  KeyRound, Bell, UserCog, Eye,
} from 'lucide-react';
import {
  getUserDetail, updateUserProfile, sendUserNotification,
  suspendUser, reactivateUser, deleteUser, restoreUser,
  resetUserPassword, impersonateUser,
} from '@/app/actions/userManagementActions';
import type { UserDetail } from '@/app/actions/userManagementActions';

interface Props {
  userId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function UserDetailDrawer({ userId, open, onClose }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmImpersonate, setConfirmImpersonate] = useState(false);
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyBody, setNotifyBody] = useState('');
  const [, startTransition] = useTransition();

  // On open/userId change: startTransition(getUserDetail) -> setDetail; loading spinner while pending.
  // If !open or !userId -> render null.

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Section renderers (see structure below) ──────────────────────────

  return null; // Replace with the full panel JSX (structure below).
}
```

Structure (full JSX, per the locked design):
- **Panel shell:** `{open && userId && (<div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/40" onClick={onClose} /><aside className="absolute inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">...<button onClick={onClose}><X /></button>...</aside></div>)}`.
- While `loading`: centered `Loader2` spinner in the panel body.
- **Sections** (each its own sub-render, header row with icon in a `bg-slate-100 rounded-lg` chip + title, body with `space-y-3`):
  1. Header: avatar circle (initial), `full_name`, `email`, status badge (active=emerald / suspended=red / deleted=gray), tier badge (reuse TIER_STYLES mapping), verified badge (gold when `is_verified_agent`).
  2. Account actions row: contextual buttons — if suspended: `Reactivate` (emerald); if deleted: `Restore` (emerald); else `Suspend` (red, opens `window.prompt('Reason for suspension (optional):')`) and `Delete` (red outline, sets `confirmDelete`). `Reset password` (navy outline → `resetUserPassword` → `setRecoveryLink(link)`). `Send notification` (navy outline → `setNotifyOpen(true)`). `Impersonate` (gold, confirm modal warning "You will see the app exactly as this user does for 30 minutes. Every action is logged.").
  3. Profile edit form: 5 fields (`full_name`, `company_name`, `contact_phone`, `whatsapp_link`, `preferred_currency` select GHS/USD) pre-filled from `detail.profile`, `Save changes` button → `updateUserProfile` → `router.refresh()` + refresh `detail` via `getUserDetail`.
  4. Listings: table of `detail.listings` (title, status badge, moderation badge, listing_health, created date). Badge classes: active=emerald, pending=amber, archived=gray, suspended=violet, deleted=gray.
  5. Audit trail: list of `detail.auditLogs` (action_type chip, `new Date(created_at).toLocaleString('en-GH')`, collapse toggle showing `previous_values`/`new_values` JSON in `<pre>`).
- **Modals:** delete confirm (`Confirm delete` / `Cancel`), impersonate confirm, recovery-link modal (readOnly input + copy button + close), notify modal (title/body inputs + send).
- All buttons: `disabled={pending}` with `Loader2` when busy; after each action `showToast(...)` and `router.refresh()`.
- Toast: `fixed bottom-6 right-6 z-50`, success navy `bg-[#0d1b2a] text-white`, error `bg-red-600 text-white`.

- [ ] **Step 2: Lint + typecheck**

Run: `npm run lint; if ($?) { npx tsc --noEmit }`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/UserDetailDrawer.tsx
git commit -m "feat: admin user detail drawer with profile edit, account actions, listings, audit trail"
```

---

### Task 5: Wire drawer into the table + Deleted KPI

**Files:**
- Modify: `src/components/admin/UserManagementTable.tsx`
- Modify: `src/app/admin/users/page.tsx`

**Interfaces:**
- Consumes: `UserDetailDrawer` from Task 4; existing `AdminUser` type.
- Produces: row click opens the drawer; status filter includes `deleted`; `deletedUsers` KPI in page header.

- [ ] **Step 1: Add row-click + deleted filter to the table**

In `UserManagementTable.tsx`:
- Add state: `const [selectedUserId, setSelectedUserId] = useState<string | null>(null);`
- Import `UserDetailDrawer` from `@/components/admin/UserDetailDrawer`.
- Extend `StatusFilter` union: `'all' | 'active' | 'suspended' | 'deleted'`.
- Update the filter select with `<option value="deleted">Deleted</option>`.
- Update `matchesStatus`: `statusFilter === 'deleted' ? u.account_status === 'deleted' : statusFilter === 'suspended' ? u.account_status === 'suspended' : u.account_status !== 'suspended' && u.account_status !== 'deleted'`.
- On each `<tr>`: `onClick={() => setSelectedUserId(user.id)}`, `className="cursor-pointer ..."` (keep existing dimmed style for suspended; add same dimming for `account_status === 'deleted'`).
- On the Verified/Status/Tier controls: add `e.stopPropagation()` to `onClick`/`onChange` handlers so quick-toggles don't open the drawer.
- Render `<UserDetailDrawer userId={selectedUserId} open={selectedUserId !== null} onClose={() => setSelectedUserId(null)} />` at the end of the returned JSX.
- The toolbar count line (`{filtered.length} of {users.length}`) still works unchanged.

- [ ] **Step 2: Add Deleted KPI to the page**

In `src/app/admin/users/page.tsx`:
- Import `UserX` icon is already imported as `UserX`; add `Trash2` from lucide-react.
- Compute `const deletedUsers = users.filter((u) => u.account_status === 'deleted').length;`
- Change grid to `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` and add a card:

```tsx
<StatCard label="Deleted" value={deletedUsers} icon={Trash2} color="slate" />
```

- Extend `StatCard`'s color union with `'slate'` and map: `slate: 'bg-slate-100 text-slate-600'`.

- [ ] **Step 3: Lint + typecheck**

Run: `npm run lint; if ($?) { npx tsc --noEmit }`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/UserManagementTable.tsx src/app/admin/users/page.tsx
git commit -m "feat: user management row drawer + deleted filter and KPI"
```

---

### Task 6: Impersonation banner + proxy deleted catch

**Files:**
- Create: `src/components/admin/ImpersonationBanner.tsx` (client)
- Modify: `src/app/layout.tsx`
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `exitImpersonation` from Task 3; `cookies` from `next/headers` (layout).
- Produces: `ImpersonationBanner` — self-contained client component; reads the `ph_impersonating` cookie, shows sticky red banner with "Viewing as [email] — Exit" and an exit button; auto-checks expiry on mount (parse `expiresAt`, if past, call `exitImpersonation`).

- [ ] **Step 1: Write the banner component**

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { exitImpersonation } from '@/app/actions/userManagementActions';

export default function ImpersonationBanner() {
  const [info, setInfo] = useState<{ userId: string; expiresAt: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const raw = document.cookie
      .split('; ')
      .find((c) => c.startsWith('ph_impersonating='))
      ?.split('=')[1];
    if (!raw) return;
    try {
      setInfo(JSON.parse(decodeURIComponent(raw)));
    } catch {
      // ignore malformed cookie
    }
  }, []);

  useEffect(() => {
    if (info && info.expiresAt < Date.now()) {
      startTransition(async () => {
        try {
          await exitImpersonation();
        } catch {
          // already exited server-side
        }
      });
    }
  }, [info]);

  if (!info) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white text-sm font-medium shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>You are viewing the platform as this user. All actions are audited.</span>
        </div>
        <button
          onClick={() => {
            setPending(true);
            startTransition(async () => {
              try {
                await exitImpersonation();
              } catch {
                setPending(false);
              }
            });
          }}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          {pending ? 'Exiting…' : 'Exit'}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount the banner in the root layout**

In `src/app/layout.tsx`:
- Import: `import ImpersonationBanner from '@/components/admin/ImpersonationBanner';`
- Insert `<ImpersonationBanner />` directly after `<Providers ...>` opening tag (before `<NavigationHeader />`).

- [ ] **Step 3: Proxy catch for deleted accounts**

In `src/proxy.ts`, replace the suspended check:

```ts
if (profile?.account_status === 'suspended' || profile?.account_status === 'deleted') {
  await supabase.auth.signOut();

  const url = request.nextUrl.clone();
  url.pathname = '/unauthorized';
  url.search = '';
  url.searchParams.set('reason', profile.account_status);

  const redirect = NextResponse.redirect(url);
  // Carry the cleared session cookies from signOut onto the redirect.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
```

- [ ] **Step 4: Lint + typecheck**

Run: `npm run lint; if ($?) { npx tsc --noEmit }`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ImpersonationBanner.tsx src/app/layout.tsx src/proxy.ts
git commit -m "feat: impersonation banner + proxy deleted-account catch"
```

---

### Task 7: Build + end-to-end verification

**Files:**
- No source changes (fix any failures that surface).

**Interfaces:**
- Consumes: everything from Tasks 1–6.

- [ ] **Step 1: Full lint + build**

Run: `npm run lint; if ($?) { npm run build }`
Expected: lint 0 errors (pre-existing warnings OK); build succeeds (pre-existing font 400 errors in output OK).

- [ ] **Step 2: End-to-end SQL re-verification**

Run the Step 3–5 queries from Task 1 again (MCP `execute_sql`) and confirm all expected outcomes — guards, takedowns, notifications, restore.

- [ ] **Step 3: Manual UI walkthrough**

Ask the user to verify on `/admin/users`:
1. Row click opens drawer; profile data, listings, and audit trail render.
2. Edit profile (change `full_name`) → toast success, row shows updated name.
3. Send notification → appears in the user's dashboard Notifications tab.
4. Suspend user with reason → row dims, status badge Suspended; user's active listings move to the review queue (check `/admin/listings`); user gets `account_suspended` notification.
5. Reactivate → status Active; listings back in the review queue (`pending`/`pending`).
6. Delete → row dims, Deleted KPI increments, listings archived (`archived`/`deleted`).
7. Restore → Active again, listings to review queue.
8. Reset password → modal shows copyable recovery link.
9. Impersonate → redirected to `/dashboard` with red banner; browse a couple of pages; Exit → returns to `/admin/users` with admin session intact.
10. Confirm `/admin/audit`-style history: check `admin_audit_logs` rows exist for all actions via SQL:

```sql
select action_type, target_id, created_at from public.admin_audit_logs order by created_at desc limit 20;
```

- [ ] **Step 4: Update the design spec with implementation notes**

If the walkthrough surfaced behavioral fixes, record them under a new "Implementation notes" section in `docs/superpowers/specs/2026-08-14-user-management-admin-powers-design.md` and commit:

```bash
git add docs/superpowers/specs/2026-08-14-user-management-admin-powers-design.md
git commit -m "docs: implementation notes for user management admin powers"
```

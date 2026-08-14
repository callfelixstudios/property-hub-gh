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

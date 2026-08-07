import { createClient } from '@/utils/supabase/server';
import { isPlatformAdmin } from '@/utils/adminAuth';
import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Guards every server action — re-validates admin identity server-side.
 * This ensures no client-side bypass can call these actions.
 */
export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPlatformAdmin(user)) {
    throw new Error('Unauthorized: admin access required');
  }

  return { supabase, user };
}

/**
 * Guards user-facing server actions — verifies an authenticated session and
 * rejects suspended accounts server-side (defense in depth alongside the
 * DB trigger that revokes suspended users' refresh tokens).
 */
export async function assertActiveUser() {
  const active = await getActiveUser();
  if (!active) {
    throw new Error('Unauthorized: sign-in required');
  }
  return active;
}

/**
 * Same guard as assertActiveUser but tolerant of guests: returns null when no
 * session exists (so callers can branch) and still throws for suspended users.
 */
export async function getActiveUser(): Promise<{ supabase: SupabaseClient; user: User } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.account_status === 'suspended') {
    throw new Error('Unauthorized: your account has been suspended.');
  }

  return { supabase, user };
}

// Helper to log admin actions immutably
export async function logAdminAction(
  supabase: SupabaseClient,
  adminId: string,
  actionType: string,
  targetId: string,
  previousValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
) {
  const { error } = await supabase
    .from('admin_audit_logs')
    .insert({
      admin_id: adminId,
      action_type: actionType,
      target_id: targetId,
      previous_values: previousValues,
      new_values: newValues,
    });

  if (error) {
    console.error('Failed to write admin audit log:', error);
  }
}

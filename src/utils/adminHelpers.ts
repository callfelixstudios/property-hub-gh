import { createClient } from '@/utils/supabase/server';
import { isAuthorizedAdmin } from '@/utils/adminAuth';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Guards every server action — re-validates admin identity server-side.
 * This ensures no client-side bypass can call these actions.
 */
export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAuthorizedAdmin(user.email)) {
    throw new Error('Unauthorized: admin access required');
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

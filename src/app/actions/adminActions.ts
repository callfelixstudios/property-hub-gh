'use server';

import { createClient } from '@/utils/supabase/server';
import { isAuthorizedAdmin } from '@/utils/adminAuth';
import { revalidatePath } from 'next/cache';

/**
 * Guards every server action — re-validates admin identity server-side.
 * This ensures no client-side bypass can call these actions.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAuthorizedAdmin(user.email)) {
    throw new Error('Unauthorized: admin access required');
  }

  return { supabase, user };
}

// ─── Toggle user verification badge ────────────────────────────────────────
export async function toggleUserVerification(userId: string, currentStatus: boolean) {
  const { supabase } = await assertAdmin();

  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: !currentStatus })
    .eq('id', userId);

  if (error) throw new Error(`Failed to toggle verification: ${error.message}`);

  revalidatePath('/admin/users');
  return { success: true, newStatus: !currentStatus };
}

// ─── Set account status (active / suspended) ───────────────────────────────
export async function setAccountStatus(
  userId: string,
  status: 'active' | 'suspended'
) {
  const { supabase } = await assertAdmin();

  const { error } = await supabase
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update account status: ${error.message}`);

  revalidatePath('/admin/users');
  return { success: true, status };
}

// ─── Set membership tier ───────────────────────────────────────────────────
export async function setMembershipTier(
  userId: string,
  tier: 'free' | 'pro' | 'developer'
) {
  const { supabase } = await assertAdmin();

  const { error } = await supabase
    .from('profiles')
    .update({ membership_tier: tier })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update membership tier: ${error.message}`);

  revalidatePath('/admin/users');
  return { success: true, tier };
}

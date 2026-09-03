'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/utils/adminHelpers';

export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';
export type VerificationDocumentType = 'ghana_card' | 'business_registration' | 'greda_license' | 'grepa_license';

/**
 * Generate a 15-minute time-limited signed URL for a private verification document.
 * Only callable server-side by platform admins.
 */
export async function getSecureDocumentUrl(storagePath: string): Promise<string> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase.storage
    .from('verification-documents')
    .createSignedUrl(storagePath, 900); // 15-minute token

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate credential token: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Approve a verification request:
 * - Sets verification_status to 'verified' and flags is_verified_agent
 * - (Tier is managed by the subscription/billing flow, not verification)
 * - Writes immutable delta record to admin_audit_logs
 * - (Stubbed) Fires Moolre/SMS approval notification
 */
export async function approveVerification(targetProfileId: string): Promise<void> {
  const { supabase, user } = await assertAdmin();

  // Capture pre-commit state for delta audit log
  const { data: original } = await supabase
    .from('profiles')
    .select('verification_status, is_verified_agent, full_name')
    .eq('id', targetProfileId)
    .single();

  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'verified',
      is_verified_agent: true,
      rejection_reason: null,
    })
    .eq('id', targetProfileId);

  if (error) throw new Error(`Failed to approve verification: ${error.message}`);

  // Immutable audit log delta record
  await supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action_type: 'VERIFICATION_APPROVE',
    target_id: targetProfileId,
    previous_values: original as Record<string, unknown>,
    new_values: { verification_status: 'verified', is_verified_agent: true },
  });

  // TODO: Trigger Moolre/Hubtel WhatsApp & SMS notification
  // sendApprovalNotification(targetProfileId);
  console.log(
    `[STUB] Approval notification sent for profile ${targetProfileId} by ${user.email}`
  );

  revalidatePath('/admin/verification');
}

/**
 * Reject a verification request:
 * - Sets verification_status to 'rejected'
 * - Stores the specific rejection reason
 * - Writes immutable delta record to admin_audit_logs
 * - (Stubbed) Fires Moolre/SMS rejection notification with template
 */
export async function rejectVerification(
  targetProfileId: string,
  reason: string
): Promise<void> {
  const { supabase, user } = await assertAdmin();

  const { data: original } = await supabase
    .from('profiles')
    .select('verification_status, rejection_reason, full_name')
    .eq('id', targetProfileId)
    .single();

  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', targetProfileId);

  if (error) throw new Error(`Failed to reject verification: ${error.message}`);

  await supabase.from('admin_audit_logs').insert({
    admin_id: user.id,
    action_type: 'VERIFICATION_REJECT',
    target_id: targetProfileId,
    previous_values: original as Record<string, unknown>,
    new_values: { verification_status: 'rejected', rejection_reason: reason },
  });

  // TODO: Trigger Moolre rejection notification template
  // sendRejectionNotification(targetProfileId, reason);
  console.log(
    `[STUB] Rejection notification sent for profile ${targetProfileId} by ${user.email}. Reason: ${reason}`
  );

  revalidatePath('/admin/verification');
}

'use server';

import { revalidatePath } from 'next/cache';

import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';

// ─── Toggle user verification badge ────────────────────────────────────────
export async function toggleUserVerification(userId: string, currentStatus: boolean) {
  const { supabase, user } = await assertAdmin();

  // Get previous value for verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', userId)
    .single();

  const prevVerified = profile ? profile.is_verified : currentStatus;

  const { error } = await supabase
    .from('profiles')
    .update({ is_verified: !prevVerified })
    .eq('id', userId);

  if (error) throw new Error(`Failed to toggle verification: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'USER_VERIFY_TOGGLE',
    userId,
    { is_verified: prevVerified },
    { is_verified: !prevVerified }
  );

  revalidatePath('/admin/users');
  return { success: true, newStatus: !prevVerified };
}

// ─── Set account status (active / suspended) ───────────────────────────────
export async function setAccountStatus(
  userId: string,
  status: 'active' | 'suspended'
) {
  const { supabase, user } = await assertAdmin();

  // Get previous value for account status
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', userId)
    .single();

  const prevStatus = profile ? profile.account_status : null;

  const { error } = await supabase
    .from('profiles')
    .update({ account_status: status })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update account status: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'USER_STATUS_CHANGE',
    userId,
    { account_status: prevStatus },
    { account_status: status }
  );

  revalidatePath('/admin/users');
  return { success: true, status };
}

// ─── Set membership tier ───────────────────────────────────────────────────
export async function setMembershipTier(
  userId: string,
  tier: 'free' | 'pro' | 'developer'
) {
  const { supabase, user } = await assertAdmin();

  // Get previous value for membership tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .single();

  const prevTier = profile ? profile.membership_tier : null;

  const { error } = await supabase
    .from('profiles')
    .update({ membership_tier: tier })
    .eq('id', userId);

  if (error) throw new Error(`Failed to update membership tier: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'USER_TIER_CHANGE',
    userId,
    { membership_tier: prevTier },
    { membership_tier: tier }
  );

  revalidatePath('/admin/users');
  return { success: true, tier };
}

// ─── Approve Listing ───────────────────────────────────────────────────────
export async function approveListing(listingId: string) {
  const { supabase, user } = await assertAdmin();

  // Get previous value for moderation status and status
  const { data: listing } = await supabase
    .from('listings')
    .select('moderation_status, status')
    .eq('id', listingId)
    .single();

  const { error } = await supabase
    .from('listings')
    .update({
      moderation_status: 'approved',
      status: 'active', // Make public
      moderated_at: new Date().toISOString(),
      moderated_by: user.email,
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to approve listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_APPROVE',
    listingId,
    listing ? { moderation_status: listing.moderation_status, status: listing.status } : null,
    { moderation_status: 'approved', status: 'active' }
  );

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}

// ─── Reject Listing ────────────────────────────────────────────────────────
export async function rejectListing(listingId: string, reason: string, note?: string) {
  const { supabase, user } = await assertAdmin();

  // Get previous values
  const { data: listing } = await supabase
    .from('listings')
    .select('moderation_status, status, rejection_reason, moderation_note')
    .eq('id', listingId)
    .single();

  const { error } = await supabase
    .from('listings')
    .update({
      moderation_status: 'rejected',
      status: 'pending', // Keep hidden
      rejection_reason: reason,
      moderation_note: note || null,
      moderated_at: new Date().toISOString(),
      moderated_by: user.email,
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to reject listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_REJECT',
    listingId,
    listing ? { 
      moderation_status: listing.moderation_status, 
      status: listing.status,
      rejection_reason: listing.rejection_reason,
      moderation_note: listing.moderation_note
    } : null,
    { 
      moderation_status: 'rejected', 
      status: 'pending',
      rejection_reason: reason,
      moderation_note: note || null
    }
  );

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}

// ─── Flag Listing ──────────────────────────────────────────────────────────
export async function flagListing(listingId: string, note?: string) {
  const { supabase, user } = await assertAdmin();

  // Get previous values
  const { data: listing } = await supabase
    .from('listings')
    .select('moderation_status, status, moderation_note')
    .eq('id', listingId)
    .single();

  const { error } = await supabase
    .from('listings')
    .update({
      moderation_status: 'flagged',
      status: 'pending', // Keep hidden
      moderation_note: note || null,
      moderated_at: new Date().toISOString(),
      moderated_by: user.email,
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to flag listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_FLAG',
    listingId,
    listing ? {
      moderation_status: listing.moderation_status,
      status: listing.status,
      moderation_note: listing.moderation_note
    } : null,
    {
      moderation_status: 'flagged',
      status: 'pending',
      moderation_note: note || null
    }
  );

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}


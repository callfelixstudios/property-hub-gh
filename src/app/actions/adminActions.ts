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

// ─── Private helper: notify listing owner ───────────────────────────────────
async function notifyListingOwner(
  supabase: Awaited<ReturnType<typeof assertAdmin>>['supabase'],
  userId: string,
  type: string,
  title: string,
  body: string,
  metadata: Record<string, unknown>
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    metadata,
  });

  if (error) throw new Error(`Failed to notify listing owner: ${error.message}`);
}

// ─── Suspend Listing ────────────────────────────────────────────────────────
export async function suspendListing(listingId: string, reason?: string) {
  const { supabase, user } = await assertAdmin();

  const { data: listing } = await supabase
    .from('listings')
    .select('title, poster_id, status, moderation_status, moderated_by, moderated_at, moderation_note')
    .eq('id', listingId)
    .single();

  const next = {
    moderation_status: 'suspended',
    status: 'pending',
    moderation_note: reason || null,
    moderated_by: user.email,
    moderated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('listings')
    .update(next)
    .eq('id', listingId);

  if (error) throw new Error(`Failed to suspend listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_SUSPEND',
    listingId,
    listing ? {
      moderation_status: listing.moderation_status,
      status: listing.status,
    } : null,
    { moderation_status: next.moderation_status, status: next.status }
  );

  if (listing) {
    await notifyListingOwner(
      supabase,
      listing.poster_id,
      'listing_suspended',
      'Listing Suspended',
      `Your listing "${listing.title}" has been suspended by the platform team.${reason ? ' Reason: ' + reason : ''}`,
      { listing_id: listingId, listing_title: listing.title, reason: reason || null }
    );
  }

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}

// ─── Unsuspend Listing ──────────────────────────────────────────────────────
export async function unsuspendListing(listingId: string) {
  const { supabase, user } = await assertAdmin();

  const { data: listing } = await supabase
    .from('listings')
    .select('title, poster_id, status, moderation_status, moderation_note')
    .eq('id', listingId)
    .single();

  const next = {
    moderation_status: 'pending',
    status: 'pending',
    moderation_note: null,
    moderated_by: user.email,
    moderated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('listings')
    .update(next)
    .eq('id', listingId);

  if (error) throw new Error(`Failed to unsuspend listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_UNSUSPEND',
    listingId,
    listing ? {
      moderation_status: listing.moderation_status,
      status: listing.status,
    } : null,
    { moderation_status: next.moderation_status, status: next.status }
  );

  if (listing) {
    await notifyListingOwner(
      supabase,
      listing.poster_id,
      'listing_unsuspended',
      'Listing Returned to Review',
      `Your listing "${listing.title}" is no longer suspended and has been returned to the review queue.`,
      { listing_id: listingId, listing_title: listing.title }
    );
  }

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}

// ─── Delete Listing (soft delete) ───────────────────────────────────────────
export async function deleteListing(listingId: string) {
  const { supabase, user } = await assertAdmin();

  const { data: listing } = await supabase
    .from('listings')
    .select('title, poster_id, status, moderation_status')
    .eq('id', listingId)
    .single();

  const next = {
    status: 'archived',
    moderation_status: 'deleted',
    listing_health: 'archived',
    moderated_by: user.email,
    moderated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('listings')
    .update(next)
    .eq('id', listingId);

  if (error) throw new Error(`Failed to delete listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_DELETE',
    listingId,
    listing ? {
      status: listing.status,
      moderation_status: listing.moderation_status,
    } : null,
    { status: next.status, moderation_status: next.moderation_status }
  );

  if (listing) {
    await notifyListingOwner(
      supabase,
      listing.poster_id,
      'listing_deleted',
      'Listing Removed',
      `Your listing "${listing.title}" has been removed from Property Hub GH by the platform team.`,
      { listing_id: listingId, listing_title: listing.title }
    );
  }

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}

// ─── Renew (un-archive) Listing ─────────────────────────────────────────────
export async function renewListing(listingId: string) {
  const { supabase, user } = await assertAdmin();

  const { data: listing } = await supabase
    .from('listings')
    .select('status, moderation_status, listing_health')
    .eq('id', listingId)
    .single();

  if (!listing || listing.status !== 'archived') {
    throw new Error('Listing is not archived and cannot be renewed');
  }

  if (listing.moderation_status === 'deleted') {
    const next = {
      moderation_status: 'pending',
      status: 'pending',
      moderated_by: null,
      moderated_at: null,
      moderation_note: null,
      rejection_reason: null,
    };

    const { error } = await supabase
      .from('listings')
      .update(next)
      .eq('id', listingId);

    if (error) throw new Error(`Failed to restore listing: ${error.message}`);

    await logAdminAction(
      supabase,
      user.id,
      'LISTING_RESTORE',
      listingId,
      { status: listing.status, moderation_status: listing.moderation_status },
      { status: next.status, moderation_status: next.moderation_status }
    );

    const { data: restored } = await supabase
      .from('listings')
      .select('title, poster_id')
      .eq('id', listingId)
      .single();

    if (restored) {
      await notifyListingOwner(
        supabase,
        restored.poster_id,
        'listing_restored',
        'Listing Restored',
        `Your listing "${restored.title}" has been restored and returned to the review queue.`,
        { listing_id: listingId, listing_title: restored.title }
      );
    }

    revalidatePath('/admin/listings');
    revalidatePath('/admin');
    return { success: true };
  }

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'active',
      listing_health: 'fresh',
      last_verified_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to renew listing: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'LISTING_RENEW',
    listingId,
    { status: listing.status, moderation_status: listing.moderation_status },
    { status: 'active', moderation_status: listing.moderation_status }
  );

  revalidatePath('/admin/listings');
  revalidatePath('/admin');
  return { success: true };
}


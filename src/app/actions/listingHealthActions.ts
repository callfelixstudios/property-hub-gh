'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';

// ─── Ghost Listing / Health Detection ──────────────────────────────────────

export async function markListingVerified(listingId: string) {
  const { supabase, user } = await assertAdmin();

  const { data: prev } = await supabase
    .from('listings')
    .select('listing_health, last_verified_at')
    .eq('id', listingId)
    .single();

  const { error } = await supabase
    .from('listings')
    .update({
      listing_health: 'fresh',
      last_verified_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to verify listing: ${error.message}`);

  await logAdminAction(supabase, user.id, 'LISTING_HEALTH_VERIFY', listingId, prev, {
    listing_health: 'fresh',
    last_verified_at: new Date().toISOString(),
  });

  revalidatePath('/admin/listing-health');
  return { success: true };
}

export async function archiveListing(listingId: string) {
  const { supabase, user } = await assertAdmin();

  const { data: prev } = await supabase
    .from('listings')
    .select('status, listing_health')
    .eq('id', listingId)
    .single();

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'archived',
      listing_health: 'archived',
    })
    .eq('id', listingId);

  if (error) throw new Error(`Failed to archive listing: ${error.message}`);

  await logAdminAction(supabase, user.id, 'LISTING_ARCHIVE', listingId, prev, {
    status: 'archived',
    listing_health: 'archived',
  });

  revalidatePath('/admin/listing-health');
  return { success: true };
}

export async function bulkSendVerificationPing(listingIds: string[]) {
  const { supabase, user } = await assertAdmin();

  // Stub for sending SMS/WhatsApp via alternative provider
  console.log(`[STUB] Sending verification pings for ${listingIds.length} listings...`);

  // Update ping status
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from('listings')
    .update({ verification_ping_sent_at: timestamp })
    .in('id', listingIds);

  if (error) throw new Error(`Failed to send pings: ${error.message}`);

  // Log bulk action
  await logAdminAction(supabase, user.id, 'BULK_VERIFICATION_PING', 'multiple', null, {
    count: listingIds.length,
    timestamp
  });

  revalidatePath('/admin/listing-health');
  return { success: true, count: listingIds.length };
}

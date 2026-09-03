'use server';

import { revalidatePath } from 'next/cache';
import { assertActiveUser } from '@/utils/adminHelpers';
import { mapBoostError } from '@/lib/boostErrors';

export async function boostListing(listingId: string) {
  if (typeof listingId !== 'string' || listingId.length === 0) {
    throw new Error('A listing id is required');
  }

  const { supabase, user } = await assertActiveUser();

  const { error } = await supabase.rpc('spend_credits', {
    p_user_id: user.id,
    p_listing_id: listingId,
  });

  if (error) {
    throw new Error(mapBoostError(error.message ?? ''));
  }

  revalidatePath('/dashboard');
  return { success: true };
}

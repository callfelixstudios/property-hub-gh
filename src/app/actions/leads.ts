'use server'

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getActiveUser } from '@/utils/adminHelpers';
import { getClientIp, rateLimit } from '@/utils/rateLimit';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function trackWhatsAppClick(listingId: string) {
  try {
    if (typeof listingId !== 'string' || !UUID_PATTERN.test(listingId)) {
      return;
    }

    const h = await headers();
    const ip = getClientIp(h);
    if (!rateLimit('wa-click:' + ip, 60, 60_000)) {
      return;
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc('increment_whatsapp_leads', { row_id: listingId });
    if (error) {
      console.error('Error tracking WhatsApp lead:', error);
    }
  } catch (error) {
    console.error('Exception tracking WhatsApp lead:', error);
  }
}

export async function fetchMatchingRequests() {
  const active = await getActiveUser();
  if (!active) return [];

  const { supabase, user } = active;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'new_match')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching matching requests:', error);
    return [];
  }

  // Enrich with space_request data
  const enriched = await Promise.all(
    (data || []).map(async (n) => {
      const requestId = n.metadata?.request_id;
      if (!requestId) return { ...n, request: null };

      const { data: request } = await supabase
        .from('space_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      return { ...n, request: request || null };
    })
  );

  return enriched;
}

export async function markLeadContacted(notificationId: string) {
  const active = await getActiveUser();
  if (!active) throw new Error('Unauthorized');
  const { supabase, user } = active;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to mark as contacted: ${error.message}`);

  return { success: true };
}

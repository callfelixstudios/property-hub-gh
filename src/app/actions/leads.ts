'use server'

import { createClient } from '@/utils/supabase/server';

export async function trackWhatsAppClick(listingId: string) {
  try {
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) throw new Error(`Failed to mark as contacted: ${error.message}`);

  return { success: true };
}

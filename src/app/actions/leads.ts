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

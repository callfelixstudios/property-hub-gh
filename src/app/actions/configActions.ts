'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';
import { createClient } from '@/utils/supabase/server';

// ─── Amenities ───────────────────────────────────────────────────────────
export async function addAmenity(name: string, slug: string, category: string) {
  const { supabase, user } = await assertAdmin();

  const { data, error } = await supabase
    .from('config_amenities')
    .insert({ name, slug, category })
    .select()
    .single();

  if (error) throw new Error(`Failed to add amenity: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_AMENITY_ADD', data.id, null, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

export async function updateAmenity(id: string, updates: { name?: string; is_active?: boolean }) {
  const { supabase, user } = await assertAdmin();

  const safeUpdates: { name?: string; is_active?: boolean } = {};
  if (typeof updates.name === 'string' && updates.name.trim()) safeUpdates.name = updates.name.trim();
  if (typeof updates.is_active === 'boolean') safeUpdates.is_active = updates.is_active;

  if (Object.keys(safeUpdates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const { data: prev } = await supabase.from('config_amenities').select('*').eq('id', id).single();
  
  const { data, error } = await supabase
    .from('config_amenities')
    .update(safeUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update amenity: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_AMENITY_UPDATE', id, prev, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

// ─── Client Fetcher ───────────────────────────────────────────────────────
export async function getConfigData() {
  const supabase = await createClient();
  
  const [neighborhoods, amenities] = await Promise.all([
    supabase.from('neighborhoods').select('name, region').order('name'),
    supabase.from('config_amenities').select('*').eq('is_active', true).order('sort_order')
  ]);
  
  return {
    neighborhoods: neighborhoods.data || [],
    amenities: amenities.data || []
  };
}

'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';
import { createClient } from '@/utils/supabase/server';

// ─── Regions ──────────────────────────────────────────────────────────────
export async function addRegion(name: string, slug: string) {
  const { supabase, user } = await assertAdmin();

  const { data, error } = await supabase
    .from('config_regions')
    .insert({ name, slug })
    .select()
    .single();

  if (error) throw new Error(`Failed to add region: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_REGION_ADD', data.id, null, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

export async function updateRegion(id: string, updates: { name?: string; is_active?: boolean }) {
  const { supabase, user } = await assertAdmin();

  const { data: prev } = await supabase.from('config_regions').select('*').eq('id', id).single();
  
  const { data, error } = await supabase
    .from('config_regions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update region: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_REGION_UPDATE', id, prev, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

// ─── Neighborhoods ────────────────────────────────────────────────────────
export async function addNeighborhood(region_id: string, name: string, slug: string) {
  const { supabase, user } = await assertAdmin();

  const { data, error } = await supabase
    .from('config_neighborhoods')
    .insert({ region_id, name, slug })
    .select()
    .single();

  if (error) throw new Error(`Failed to add neighborhood: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_NEIGHBORHOOD_ADD', data.id, null, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

export async function updateNeighborhood(id: string, updates: { name?: string; is_active?: boolean }) {
  const { supabase, user } = await assertAdmin();

  const { data: prev } = await supabase.from('config_neighborhoods').select('*').eq('id', id).single();
  
  const { data, error } = await supabase
    .from('config_neighborhoods')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update neighborhood: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_NEIGHBORHOOD_UPDATE', id, prev, data);
  revalidatePath('/admin/config');
  return { success: true, data };
}

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

  const { data: prev } = await supabase.from('config_amenities').select('*').eq('id', id).single();
  
  const { data, error } = await supabase
    .from('config_amenities')
    .update(updates)
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
  
  const [regions, neighborhoods, amenities] = await Promise.all([
    supabase.from('config_regions').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('config_neighborhoods').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('config_amenities').select('*').eq('is_active', true).order('sort_order')
  ]);
  
  return {
    regions: regions.data || [],
    neighborhoods: neighborhoods.data || [],
    amenities: amenities.data || []
  };
}

'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';
import { createClient } from '@/utils/supabase/server';

export interface Neighborhood {
  id: string;
  region: string;
  name: string;
  created_at: string;
}

// ─── Fetch neighborhoods by region ────────────────────────────────────────
export async function getNeighborhoodsByRegion(region: string): Promise<Neighborhood[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('region', region)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to load neighborhoods: ${error.message}`);
  return (data ?? []) as Neighborhood[];
}

// ─── Add a single neighborhood ───────────────────────────────────────────
export async function addSingleNeighborhood(region: string, name: string) {
  const { supabase, user } = await assertAdmin();

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Neighborhood name cannot be empty.');

  const { data, error } = await supabase
    .from('neighborhoods')
    .insert({ region, name: trimmedName })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`"${trimmedName}" already exists in ${region}.`);
    }
    throw new Error(`Failed to add neighborhood: ${error.message}`);
  }

  await logAdminAction(supabase, user.id, 'NEIGHBORHOOD_ADD', data.id, null, data);
  revalidatePath('/admin/locations');
  return { success: true, data };
}

// ─── Bulk insert neighborhoods (for CSV upload) ──────────────────────────
export async function bulkAddNeighborhoods(
  region: string,
  names: string[]
): Promise<{ inserted: number; duplicates: number }> {
  const { supabase, user } = await assertAdmin();

  // Deduplicate and sanitize
  const uniqueNames = [...new Set(
    names
      .map(n => n.replace(/^"|"$/g, '').trim())
      .filter(n => n.length > 0)
  )];

  if (uniqueNames.length === 0) throw new Error('No valid entries found.');

  const rows = uniqueNames.map(name => ({ region, name }));

  const { data, error } = await supabase
    .from('neighborhoods')
    .upsert(rows, { onConflict: 'region,name', ignoreDuplicates: true })
    .select();

  if (error) throw new Error(`Bulk upload failed: ${error.message}`);

  const inserted = data?.length ?? 0;
  const duplicates = uniqueNames.length - inserted;

  await logAdminAction(supabase, user.id, 'NEIGHBORHOOD_BULK_ADD', region, null, {
    region,
    count: inserted,
    duplicates,
  });

  revalidatePath('/admin/locations');
  return { inserted, duplicates };
}

// ─── Delete a neighborhood ───────────────────────────────────────────────
export async function deleteNeighborhood(id: string) {
  const { supabase, user } = await assertAdmin();

  const { data: prev } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('neighborhoods')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete neighborhood: ${error.message}`);

  await logAdminAction(supabase, user.id, 'NEIGHBORHOOD_DELETE', id, prev, null);
  revalidatePath('/admin/locations');
  return { success: true };
}

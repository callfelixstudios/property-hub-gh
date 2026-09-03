'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin, logAdminAction } from '@/utils/adminHelpers';
import { createClient } from '@/utils/supabase/server';
import {
  validateCreditPatch,
  validatePlanPatch,
  type CreditConfigPatch,
  type PlanConfigPatch,
} from '@/lib/configValidation';

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

// ─── Pricing & packages ────────────────────────────────────────────────────
export async function updatePlanConfig(planId: string, patch: PlanConfigPatch) {
  const { supabase, user } = await assertAdmin();

  const validationError = validatePlanPatch(patch);
  if (validationError) throw new Error(validationError);

  const updates: Record<string, unknown> = {};
  if (patch.price_ghs !== undefined) updates.price_ghs = patch.price_ghs;
  if (patch.billing_cycle !== undefined) updates.billing_cycle = patch.billing_cycle;
  if (patch.active_listing_cap !== undefined) updates.active_listing_cap = patch.active_listing_cap;
  if (patch.archive_after_days !== undefined) updates.archive_after_days = patch.archive_after_days;
  if (patch.features !== undefined) updates.features = patch.features;
  if (patch.is_active !== undefined) updates.is_active = patch.is_active;

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields to update');
  }

  const { data: prev } = await supabase.from('subscription_plans').select('*').eq('id', planId).single();

  const { data, error } = await supabase
    .from('subscription_plans')
    .update(updates)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update plan: ${error.message}`);

  await logAdminAction(supabase, user.id, 'CONFIG_PLAN_UPDATE', planId, prev, data);
  revalidatePath('/admin/config');
  revalidatePath('/pricing');
  return { success: true, data };
}

const CREDIT_CONFIG_KEYS = [
  'credit_price_ghs',
  'credit_min_qty',
  'credit_max_qty',
  'boost_duration_days',
] as const;

export async function updateCreditConfig(patch: CreditConfigPatch) {
  const { supabase, user } = await assertAdmin();

  const validationError = validateCreditPatch(patch);
  if (validationError) throw new Error(validationError);

  const entries = CREDIT_CONFIG_KEYS.filter((key) => patch[key] !== undefined).map((key) => ({
    key,
    value: patch[key] as number,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }));

  if (entries.length === 0) {
    throw new Error('No valid fields to update');
  }

  const { data: prev } = await supabase
    .from('platform_config')
    .select('*')
    .in('key', entries.map((e) => e.key));

  const { data, error } = await supabase
    .from('platform_config')
    .upsert(entries, { onConflict: 'key' })
    .select();

  if (error) throw new Error(`Failed to update credit config: ${error.message}`);

  await logAdminAction(
    supabase,
    user.id,
    'CONFIG_CREDITS_UPDATE',
    'platform_config',
    { rows: prev } as unknown as Record<string, unknown> | null,
    { rows: data } as unknown as Record<string, unknown> | null
  );
  revalidatePath('/admin/config');
  revalidatePath('/pricing');
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

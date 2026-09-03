import { createClient } from '@/utils/supabase/server';
import { priceToKobo } from '@/utils/paystack';
import { getPlanBySlug } from './plans';
import { CREDIT_DEFAULTS, type CreditConfig } from './creditPurchase';

export interface PlanPricing {
  slug: string;
  name: string;
  price_ghs: number;
  billing_cycle: string;
  features: string[];
  active_listing_cap: number;
  archive_after_days: number;
  is_active: boolean;
}

interface PlanRow {
  slug?: unknown;
  name?: unknown;
  price_ghs?: unknown;
  billing_cycle?: unknown;
  features?: unknown;
  active_listing_cap?: unknown;
  archive_after_days?: unknown;
  is_active?: unknown;
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return typeof n === 'number' && !Number.isNaN(n) ? n : fallback;
}

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return fallback;
}

export function mergePlansWithFallback(rows: PlanRow[]): PlanPricing[] {
  const bySlug = new Map(rows.map((r) => [String(r.slug), r]));
  const slugs = ['free', 'pro', 'developer'];
  return slugs.map((slug) => {
    const fallback = getPlanBySlug(slug);
    const row = bySlug.get(slug);
    return {
      slug,
      name: typeof row?.name === 'string' ? row.name : (fallback?.name ?? slug),
      price_ghs: toNumber(row?.price_ghs, fallback?.price_ghs ?? 0),
      billing_cycle: typeof row?.billing_cycle === 'string' ? row.billing_cycle : 'monthly',
      features: toStringArray(row?.features, fallback?.features ?? []),
      active_listing_cap: toNumber(row?.active_listing_cap, fallback?.active_listing_cap ?? 2),
      archive_after_days: toNumber(row?.archive_after_days, fallback?.archive_after_days ?? 30),
      is_active: typeof row?.is_active === 'boolean' ? row.is_active : true,
    };
  });
}

export function parseCreditConfig(rows: Array<{ key?: unknown; value?: unknown }>): CreditConfig {
  const values = new Map(rows.map((r) => [String(r.key), Number(r.value)]));
  const pick = (key: keyof CreditConfig): number => {
    const v = values.get(key);
    return typeof v === 'number' && !Number.isNaN(v) ? v : CREDIT_DEFAULTS[key];
  };
  return {
    credit_price_ghs: pick('credit_price_ghs'),
    credit_min_qty: pick('credit_min_qty'),
    credit_max_qty: pick('credit_max_qty'),
    boost_duration_days: pick('boost_duration_days'),
  };
}

export function getPriceKobo(priceGhs: number): number {
  return priceToKobo(priceGhs);
}

export async function getPlansPricing(): Promise<PlanPricing[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select(
        'slug, name, price_ghs, billing_cycle, features, active_listing_cap, archive_after_days, is_active'
      )
      .order('sort_order', { ascending: true });
    if (error || !data) return mergePlansWithFallback([]);
    return mergePlansWithFallback(data as PlanRow[]);
  } catch {
    return mergePlansWithFallback([]);
  }
}

export async function getCreditConfig(): Promise<CreditConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('platform_config').select('key, value');
    if (error || !data) return { ...CREDIT_DEFAULTS };
    return parseCreditConfig(data as Array<{ key?: unknown; value?: unknown }>);
  } catch {
    return { ...CREDIT_DEFAULTS };
  }
}

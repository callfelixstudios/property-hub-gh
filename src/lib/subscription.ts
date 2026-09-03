import { createClient } from '@/utils/supabase/server';
import type { TierSlug } from './tiers';

export { TIER_LIMITS, TIER_RANK, shouldShowAgentBadge } from './tiers';
export type { TierSlug } from './tiers';

const VALID_TIERS: readonly string[] = ['free', 'pro', 'developer'];

function asTierSlug(value: unknown): TierSlug | null {
  return typeof value === 'string' && VALID_TIERS.includes(value) ? (value as TierSlug) : null;
}

/**
 * Resolve a user's effective tier from subscription truth.
 * Active, unexpired user_subscriptions row (joined to subscription_plans.slug)
 * wins; otherwise falls back to the profiles.membership_tier cache. A stale
 * paid cache (no live subscription backing it) triggers a lazy downgrade via
 * the downgrade_expired_subscriber RPC and resolves to 'free'.
 */
export async function getEffectiveTier(userId: string): Promise<TierSlug> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('ends_at, subscription_plans!inner ( slug )')
    .eq('user_id', userId)
    .eq('status', 'active')
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order('ends_at', { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  const plans = (sub as { subscription_plans?: { slug?: unknown } | Array<{ slug?: unknown }> } | null)
    ?.subscription_plans;
  const liveSlug = asTierSlug(Array.isArray(plans) ? plans[0]?.slug : plans?.slug);
  if (liveSlug) return liveSlug;

  const { data: profile } = await supabase
    .from('profiles')
    .select('membership_tier')
    .eq('id', userId)
    .maybeSingle();

  const cached =
    asTierSlug((profile as { membership_tier?: unknown } | null)?.membership_tier) ?? 'free';

  if (cached === 'pro' || cached === 'developer') {
    try {
      await supabase.rpc('downgrade_expired_subscriber', { p_user_id: userId });
    } catch {
      // Never throw from the downgrade path — stale cache is non-fatal.
    }
    return 'free';
  }

  return cached;
}

/** Read the caller's own credit balance (profiles.credit_balance, coalesced). */
export async function getCreditBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', userId)
    .maybeSingle();

  const balance = (data as { credit_balance?: unknown } | null)?.credit_balance;
  return typeof balance === 'number' ? balance : 0;
}

/** Idempotently ensure this month's Boost/Pin grant (cycle key YYYY-MM). */
export async function ensureGrant(userId: string): Promise<void> {
  const supabase = await createClient();
  const cycleKey = new Date().toISOString().slice(0, 7);
  try {
    await supabase.rpc('ensure_monthly_grant', { p_user_id: userId, p_cycle_key: cycleKey });
  } catch {
    // Grant failures are non-fatal; the next call retries idempotently.
  }
}

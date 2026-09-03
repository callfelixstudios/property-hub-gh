export const TIER_LIMITS = { free: 2, pro: 15, developer: 50 } as const;
export type TierSlug = 'free' | 'pro' | 'developer';
export const TIER_RANK: Record<TierSlug, number> = { free: 0, pro: 1, developer: 2 };

/** Agent badge shows only for verified agents on a paid tier. */
export function shouldShowAgentBadge(isVerifiedAgent: boolean, tier: TierSlug): boolean {
  return isVerifiedAgent && tier !== 'free';
}

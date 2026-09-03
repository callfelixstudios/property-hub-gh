import { describe, expect, it } from 'vitest';
import { TIER_LIMITS, TIER_RANK, shouldShowAgentBadge } from './subscription';

describe('TIER_LIMITS', () => {
  it('caps are free=2, pro=15, developer=50', () => {
    expect(TIER_LIMITS.free).toBe(2);
    expect(TIER_LIMITS.pro).toBe(15);
    expect(TIER_LIMITS.developer).toBe(50);
  });
});

describe('TIER_RANK ordering', () => {
  it('ranks free below pro below developer', () => {
    expect(TIER_RANK.free).toBeLessThan(TIER_RANK.pro);
    expect(TIER_RANK.pro).toBeLessThan(TIER_RANK.developer);
  });
});

describe('shouldShowAgentBadge', () => {
  it('shows for verified agents on paid tiers only', () => {
    expect(shouldShowAgentBadge(true, 'pro')).toBe(true);
    expect(shouldShowAgentBadge(true, 'developer')).toBe(true);
    expect(shouldShowAgentBadge(true, 'free')).toBe(false);
    expect(shouldShowAgentBadge(false, 'pro')).toBe(false);
  });
});

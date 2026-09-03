import { describe, expect, it } from 'vitest';
import { PLANS, getPlanBySlug } from './plans';

describe('PLANS', () => {
  it('has exactly 3 entries', () => {
    expect(PLANS).toHaveLength(3);
  });

  it('has unique slugs', () => {
    const slugs = PLANS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('prices pro at 99.99 and developer at 299.99', () => {
    expect(getPlanBySlug('pro')?.price_ghs).toBe(99.99);
    expect(getPlanBySlug('developer')?.price_ghs).toBe(299.99);
  });

  it('includes key matrix features', () => {
    expect(getPlanBySlug('free')?.features).toContain('2 active listings');
    expect(getPlanBySlug('pro')?.features).toContain('Verified Agent badge');
  });

  it('getPlanBySlug returns pro price and undefined for unknown', () => {
    expect(getPlanBySlug('pro')?.price_ghs).toBe(99.99);
    expect(getPlanBySlug('nope')).toBeUndefined();
  });
});

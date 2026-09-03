import { describe, expect, it } from 'vitest';
import {
  getPriceKobo,
  mergePlansWithFallback,
  parseCreditConfig,
} from './plansPricing';

describe('mergePlansWithFallback', () => {
  it('falls back to code defaults on total DB miss', () => {
    const plans = mergePlansWithFallback([]);
    expect(plans).toHaveLength(3);
    expect(plans.find((p) => p.slug === 'free')).toMatchObject({
      price_ghs: 0,
      active_listing_cap: 2,
      archive_after_days: 30,
    });
    expect(plans.find((p) => p.slug === 'pro')).toMatchObject({
      price_ghs: 99.99,
      active_listing_cap: 15,
      archive_after_days: 60,
    });
    expect(plans.find((p) => p.slug === 'developer')).toMatchObject({
      price_ghs: 299.99,
      active_listing_cap: 50,
      archive_after_days: 90,
    });
  });

  it('prefers DB rows and falls back per missing slug', () => {
    const plans = mergePlansWithFallback([
      {
        slug: 'pro',
        name: 'Pro',
        price_ghs: 149.99,
        billing_cycle: 'monthly',
        features: ['Custom'],
        active_listing_cap: 20,
        archive_after_days: 45,
        is_active: true,
      },
    ]);
    expect(plans.find((p) => p.slug === 'pro')).toMatchObject({
      price_ghs: 149.99,
      active_listing_cap: 20,
      archive_after_days: 45,
      features: ['Custom'],
    });
    expect(plans.find((p) => p.slug === 'free')).toMatchObject({
      price_ghs: 0,
      active_listing_cap: 2,
    });
  });

  it('coerces numeric-string prices from the DB driver', () => {
    const plans = mergePlansWithFallback([{ slug: 'pro', price_ghs: '99.99' }]);
    expect(plans.find((p) => p.slug === 'pro')?.price_ghs).toBe(99.99);
  });
});

describe('parseCreditConfig', () => {
  it('returns 20/1/10/7 defaults on DB miss', () => {
    expect(parseCreditConfig([])).toEqual({
      credit_price_ghs: 20,
      credit_min_qty: 1,
      credit_max_qty: 10,
      boost_duration_days: 7,
    });
  });

  it('overrides with DB values and ignores unknown keys', () => {
    expect(
      parseCreditConfig([
        { key: 'credit_price_ghs', value: 25 },
        { key: 'credit_max_qty', value: 5 },
        { key: 'something_else', value: 999 },
      ])
    ).toEqual({
      credit_price_ghs: 25,
      credit_min_qty: 1,
      credit_max_qty: 5,
      boost_duration_days: 7,
    });
  });
});

describe('getPriceKobo', () => {
  it('converts GHS prices to kobo', () => {
    expect(getPriceKobo(99.99)).toBe(9999);
    expect(getPriceKobo(20)).toBe(2000);
  });
});

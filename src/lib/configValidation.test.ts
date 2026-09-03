import { describe, expect, it } from 'vitest';
import { validateCreditPatch, validatePlanPatch } from './configValidation';

describe('validatePlanPatch', () => {
  it('accepts a valid patch', () => {
    expect(
      validatePlanPatch({
        price_ghs: 0,
        billing_cycle: 'monthly',
        active_listing_cap: 2,
        archive_after_days: 30,
        features: ['a'],
        is_active: true,
      })
    ).toBeNull();
  });

  it('rejects negative prices', () => {
    expect(validatePlanPatch({ price_ghs: -1 })).toBe('Plan price must be a number ≥ 0');
  });

  it('rejects unknown billing cycles', () => {
    expect(validatePlanPatch({ billing_cycle: 'weekly' })).toBe(
      'Billing cycle must be monthly, quarterly, yearly, or one_time'
    );
    expect(validatePlanPatch({ billing_cycle: 'one_time' })).toBeNull();
  });

  it('rejects caps and windows below 1', () => {
    expect(validatePlanPatch({ active_listing_cap: 0 })).toBe(
      'Active listing cap must be an integer ≥ 1'
    );
    expect(validatePlanPatch({ active_listing_cap: 1.5 })).toBe(
      'Active listing cap must be an integer ≥ 1'
    );
    expect(validatePlanPatch({ archive_after_days: 0 })).toBe(
      'Archive window must be an integer ≥ 1 day'
    );
  });

  it('rejects non-string features', () => {
    expect(validatePlanPatch({ features: ['ok', 42 as unknown as string] })).toBe(
      'Features must be an array of strings'
    );
  });
});

describe('validateCreditPatch', () => {
  it('accepts a valid patch', () => {
    expect(
      validateCreditPatch({
        credit_price_ghs: 20,
        credit_min_qty: 1,
        credit_max_qty: 10,
        boost_duration_days: 7,
      })
    ).toBeNull();
  });

  it('rejects non-positive credit prices', () => {
    expect(validateCreditPatch({ credit_price_ghs: 0 })).toBe(
      'Credit price must be a number > 0'
    );
  });

  it('rejects min below 1 and max below min', () => {
    expect(validateCreditPatch({ credit_min_qty: 0 })).toBe(
      'Minimum quantity must be an integer ≥ 1'
    );
    expect(validateCreditPatch({ credit_min_qty: 5, credit_max_qty: 3 })).toBe(
      'Maximum quantity must be ≥ minimum quantity'
    );
  });

  it('rejects boost durations below 1', () => {
    expect(validateCreditPatch({ boost_duration_days: 0 })).toBe(
      'Boost duration must be an integer ≥ 1 day'
    );
  });
});

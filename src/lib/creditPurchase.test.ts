import { describe, expect, it } from 'vitest';
import {
  creditsKobo,
  buildCreditsReference,
  isValidQty,
  validateCreditsAmount,
  parseCreditsMetadata,
  CREDIT_DEFAULTS,
} from './creditPurchase';

describe('creditsKobo', () => {
  it('multiplies qty by credit price into kobo', () => {
    expect(creditsKobo(1, 20)).toBe(2000);
    expect(creditsKobo(10, 20)).toBe(20000);
    expect(creditsKobo(3, 99.99)).toBe(29997);
  });
});

describe('buildCreditsReference', () => {
  it('formats ph_credits_ plus hyphen-free uuid', () => {
    const ref = buildCreditsReference('123e4567-e89b-12d3-a456-426614174000');
    expect(ref).toBe('ph_credits_123e4567e89b12d3a456426614174000');
    expect(ref).toMatch(/^ph_credits_[0-9a-f]{32}$/);
  });
});

describe('isValidQty', () => {
  it('accepts integers within min/max', () => {
    expect(isValidQty(1, CREDIT_DEFAULTS)).toBe(true);
    expect(isValidQty(10, CREDIT_DEFAULTS)).toBe(true);
    expect(isValidQty(5, CREDIT_DEFAULTS)).toBe(true);
  });

  it('rejects out-of-range, fractional, and non-numeric qty', () => {
    expect(isValidQty(0, CREDIT_DEFAULTS)).toBe(false);
    expect(isValidQty(11, CREDIT_DEFAULTS)).toBe(false);
    expect(isValidQty(2.5, CREDIT_DEFAULTS)).toBe(false);
    expect(isValidQty('3', CREDIT_DEFAULTS)).toBe(false);
    expect(isValidQty(NaN, CREDIT_DEFAULTS)).toBe(false);
  });
});

describe('validateCreditsAmount', () => {
  it('matches received amount against the stamped expectation', () => {
    expect(validateCreditsAmount(6000, 6000)).toBe(true);
    expect(validateCreditsAmount(6000, 6001)).toBe(false);
    expect(validateCreditsAmount('6000', 6000)).toBe(true);
  });
});

describe('parseCreditsMetadata', () => {
  it('parses valid credits metadata', () => {
    expect(
      parseCreditsMetadata({ kind: 'credits', user_id: 'u1', qty: 3, expected_amount_kobo: 6000 })
    ).toEqual({ user_id: 'u1', qty: 3, expected_amount_kobo: 6000 });
  });

  it('rejects missing user, bad qty, or missing stamp', () => {
    expect(parseCreditsMetadata({ qty: 3, expected_amount_kobo: 6000 })).toBeNull();
    expect(parseCreditsMetadata({ user_id: 'u1', qty: 0, expected_amount_kobo: 0 })).toBeNull();
    expect(parseCreditsMetadata({ user_id: 'u1', qty: 1.5, expected_amount_kobo: 3000 })).toBeNull();
    expect(parseCreditsMetadata({ user_id: 'u1', qty: 2 })).toBeNull();
    expect(parseCreditsMetadata(null)).toBeNull();
  });
});

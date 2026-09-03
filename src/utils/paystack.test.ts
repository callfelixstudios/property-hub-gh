import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { priceToKobo, validateWebhookSignature } from './paystack';
import { getPlanBySlug } from '@/lib/plans';

function sign(rawBody: string, secret: string): string {
  return createHmac('sha512', secret).update(rawBody).digest('hex');
}

describe('validateWebhookSignature', () => {
  const secret = 'sk_test_1234567890abcdef';
  const body = JSON.stringify({
    event: 'charge.success',
    data: { reference: 'ph_sub_pro_abc123' },
  });

  it('accepts a valid HMAC-SHA512 signature', () => {
    expect(validateWebhookSignature(body, sign(body, secret), secret)).toBe(true);
  });

  it('rejects a signature produced with a different secret', () => {
    expect(validateWebhookSignature(body, sign(body, 'sk_test_wrong'), secret)).toBe(false);
  });

  it('rejects a tampered body', () => {
    const tampered = body.replace('ph_sub_pro_abc123', 'ph_sub_developer_abc123');
    expect(validateWebhookSignature(tampered, sign(body, secret), secret)).toBe(false);
  });

  it('rejects a missing signature', () => {
    expect(validateWebhookSignature(body, null, secret)).toBe(false);
  });

  it('rejects a non-hex signature string', () => {
    expect(validateWebhookSignature(body, 'not-a-valid-hex-signature', secret)).toBe(false);
  });
});

describe('priceToKobo', () => {
  it('rounds GHS amounts to kobo', () => {
    expect(priceToKobo(99.99)).toBe(9999);
    expect(priceToKobo(0)).toBe(0);
    expect(priceToKobo(299.99)).toBe(29999);
  });
});

describe('getPlanBySlug', () => {
  it('returns the pro plan with a 99.99 GHS monthly price', () => {
    const plan = getPlanBySlug('pro');
    expect(plan).toBeDefined();
    if (!plan) return;
    expect(plan.price_ghs).toBe(99.99);
    expect(plan.billing_cycle).toBe('monthly');
  });

  it('returns undefined for unknown slugs', () => {
    expect(getPlanBySlug('enterprise')).toBeUndefined();
  });
});
import { priceToKobo } from '@/utils/paystack';

export interface CreditConfig {
  credit_price_ghs: number;
  credit_min_qty: number;
  credit_max_qty: number;
  boost_duration_days: number;
}

export const CREDIT_DEFAULTS: CreditConfig = {
  credit_price_ghs: 20,
  credit_min_qty: 1,
  credit_max_qty: 10,
  boost_duration_days: 7,
};

export function creditsKobo(qty: number, creditPriceGhs: number): number {
  return priceToKobo(qty * creditPriceGhs);
}

export function buildCreditsReference(uuid: string): string {
  return `ph_credits_${uuid.replace(/-/g, '')}`;
}

export function isValidQty(qty: unknown, config: CreditConfig): qty is number {
  return (
    typeof qty === 'number' &&
    Number.isInteger(qty) &&
    qty >= config.credit_min_qty &&
    qty <= config.credit_max_qty
  );
}

export function validateCreditsAmount(received: unknown, expectedKobo: unknown): boolean {
  return Number(received) === Number(expectedKobo);
}

export interface CreditsMetadata {
  user_id: string;
  qty: number;
  expected_amount_kobo: number;
}

export function parseCreditsMetadata(metadata: unknown): CreditsMetadata | null {
  const m = (metadata ?? {}) as Record<string, unknown>;
  if (typeof m.user_id !== 'string' || m.user_id.length === 0) return null;
  if (typeof m.qty !== 'number' || !Number.isInteger(m.qty) || m.qty < 1) return null;
  if (typeof m.expected_amount_kobo !== 'number') return null;
  return { user_id: m.user_id, qty: m.qty, expected_amount_kobo: m.expected_amount_kobo };
}

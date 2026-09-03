import { createHmac, timingSafeEqual } from 'node:crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

export function hasPaystackConfig(): boolean {
  return typeof PAYSTACK_SECRET_KEY === 'string' && PAYSTACK_SECRET_KEY.length > 0;
}

export function priceToKobo(priceGhs: number): number {
  return Math.round(priceGhs * 100);
}

interface InitializeTransactionParams {
  email: string;
  amountKobo: number;
  reference: string;
  metadata: Record<string, unknown>;
  channels: string[];
  callback_url?: string;
}

export async function initializeTransaction({
  email,
  amountKobo,
  reference,
  metadata,
  channels,
  callback_url,
}: InitializeTransactionParams): Promise<{ authorization_url: string; access_code: string | null }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: 'GHS',
      reference,
      metadata,
      channels,
      ...(callback_url ? { callback_url } : {}),
    }),
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string | null };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? 'Paystack transaction initialize failed');
  }

  return {
    authorization_url: json.data.authorization_url ?? '',
    access_code: json.data.access_code ?? null,
  };
}

export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });

  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; amount?: number | string };
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? 'Paystack transaction verify failed');
  }

  return {
    status: json.data.status ?? '',
    amount: Number(json.data.amount),
  };
}

export function validateWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = Buffer.from(
    createHmac('sha512', secret).update(rawBody).digest('hex'),
    'hex'
  );
  const provided = Buffer.from(signature, 'hex');

  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/utils/supabase/server';
import { hasPaystackConfig, initializeTransaction } from '@/utils/paystack';
import { getCreditConfig } from '@/lib/plansPricing';
import { buildCreditsReference, creditsKobo, isValidQty } from '@/lib/creditPurchase';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!hasPaystackConfig()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const config = await getCreditConfig();
  const { qty } = (body ?? {}) as { qty?: unknown };

  if (!isValidQty(qty, config)) {
    return NextResponse.json(
      { error: `Quantity must be an integer between ${config.credit_min_qty} and ${config.credit_max_qty}` },
      { status: 400 }
    );
  }

  const amountKobo = creditsKobo(qty, config.credit_price_ghs);
  const reference = buildCreditsReference(crypto.randomUUID());

  const origin =
    request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callback_url = `${origin}/pricing?reference=${reference}#credits`;

  try {
    const { authorization_url, access_code } = await initializeTransaction({
      email: user.email ?? '',
      amountKobo,
      reference,
      metadata: {
        kind: 'credits',
        user_id: user.id,
        qty,
        expected_amount_kobo: amountKobo,
      },
      channels: ['card', 'mobile_money'],
      callback_url,
    });

    return NextResponse.json({ authorization_url, access_code, reference });
  } catch (error) {
    console.error('paystack credits initialize error:', error);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }
}

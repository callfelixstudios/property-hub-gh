import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@/utils/supabase/server';
import { hasPaystackConfig, initializeTransaction, priceToKobo } from '@/utils/paystack';
import { getPlansPricing } from '@/lib/plansPricing';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { planSlug } = (body ?? {}) as { planSlug?: unknown };

  if (typeof planSlug !== 'string' || (planSlug !== 'pro' && planSlug !== 'developer')) {
    return NextResponse.json(
      { error: 'A valid plan slug is required' },
      { status: 400 }
    );
  }

  if (!hasPaystackConfig()) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const plans = await getPlansPricing();
  const plan = plans.find((p) => p.slug === planSlug);
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
  }

  const amountKobo = priceToKobo(plan.price_ghs);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const reference = `ph_sub_${plan.slug}_${crypto.randomUUID().replace(/-/g, '')}`;

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callback_url = `${origin}/pricing?reference=${reference}`;

  try {
    const { authorization_url, access_code } = await initializeTransaction({
      email: user.email ?? '',
      amountKobo,
      reference,
      metadata: {
        kind: 'subscription',
        user_id: user.id,
        plan_slug: plan.slug,
        plan_name: plan.name,
        expected_amount_kobo: amountKobo,
      },
      channels: ['card', 'mobile_money'],
      callback_url,
    });

    return NextResponse.json({ authorization_url, access_code, reference });
  } catch (error) {
    console.error('paystack initialize error:', error);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }
}
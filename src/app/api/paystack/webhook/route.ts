import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { priceToKobo, validateWebhookSignature } from '@/utils/paystack';
import { getPlanBySlug } from '@/lib/plans';

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get('x-paystack-signature');
  if (!secret || !validateWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const parsed = payload as { event?: string; data?: { metadata?: unknown; amount?: unknown; reference?: unknown } };
  if (parsed.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const d = parsed.data ?? {};
  const metadata = (d.metadata ?? {}) as { user_id?: unknown; plan_slug?: unknown };
  const { user_id, plan_slug } = metadata;
  const plan = getPlanBySlug(typeof plan_slug === 'string' ? plan_slug : '');

  if (typeof user_id !== 'string' || user_id.length === 0 || !plan) {
    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
  }

  if (Number(d.amount) !== priceToKobo(plan.price_ghs)) {
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from('payment_transactions')
      .select('id')
      .eq('provider_reference', String(d.reference))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const { data: planRow } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('slug', plan.slug)
      .maybeSingle();

    // Expire existing actives first so tier truth keeps a single active row.
    const { error: expireError } = await admin
      .from('user_subscriptions')
      .update({ status: 'expired' })
      .eq('user_id', user_id)
      .eq('status', 'active');

    if (expireError) throw expireError;

    let subscriptionId: string | null = null;

    if (planRow) {
      const { data: newSub, error: subError } = await admin
        .from('user_subscriptions')
        .insert({
          user_id,
          plan_id: planRow.id,
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelled_at: null,
        })
        .select('id')
        .single();

      if (subError) throw subError;
      subscriptionId = newSub?.id ?? null;
    }

    const { error: txError } = await admin
      .from('payment_transactions')
      .insert({
        user_id,
        amount_ghs: plan.price_ghs,
        provider: 'paystack',
        provider_reference: String(d.reference),
        subscription_id: subscriptionId,
        status: 'completed',
        metadata: { event: parsed },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (txError) throw txError;

    const { error: profileError } = await admin
      .from('profiles')
      .update({ membership_tier: plan.slug })
      .eq('id', user_id);

    if (profileError) {
      console.error('profiles.membership_tier update failed:', profileError);
    }

    // Monthly Boost/Pin grant: pro → 1, developer → 3. Free never reaches the
    // webhook (initialize rejects zero-amount plans), so no free branch needed.
    const creditAmount = plan.slug === 'developer' ? 3 : plan.slug === 'pro' ? 1 : 0;
    if (creditAmount > 0) {
      const { error: grantError } = await admin.rpc('grant_credits', {
        p_user_id: user_id,
        p_cycle_key: new Date().toISOString().slice(0, 7),
        p_amount: creditAmount,
      });

      if (grantError) {
        console.error('grant_credits failed:', grantError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('paystack webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
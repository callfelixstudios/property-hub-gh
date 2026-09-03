import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { priceToKobo, validateWebhookSignature } from '@/utils/paystack';
import { getPlanBySlug } from '@/lib/plans';
import { parseCreditsMetadata, validateCreditsAmount } from '@/lib/creditPurchase';

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

  const parsed = payload as {
    event?: string;
    data?: { metadata?: unknown; amount?: unknown; reference?: unknown };
  };
  if (parsed.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const d = parsed.data ?? {};
  const metadata = (d.metadata ?? {}) as { kind?: unknown };

  if (metadata.kind === 'credits') {
    return handleCreditsPurchase(String(d.reference), Number(d.amount), metadata);
  }

  const subMeta = metadata as { user_id?: unknown; plan_slug?: unknown; expected_amount_kobo?: unknown };
  const { user_id, plan_slug } = subMeta;
  const plan = getPlanBySlug(typeof plan_slug === 'string' ? plan_slug : '');

  if (typeof user_id !== 'string' || user_id.length === 0 || !plan) {
    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
  }

  const expected =
    typeof subMeta.expected_amount_kobo === 'number'
      ? subMeta.expected_amount_kobo
      : priceToKobo(plan.price_ghs);
  if (Number(d.amount) !== expected) {
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

async function handleCreditsPurchase(
  reference: string,
  amount: number,
  metadata: unknown
): Promise<NextResponse> {
  const credits = parseCreditsMetadata(metadata);
  if (!credits) {
    return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
  }

  if (!validateCreditsAmount(amount, credits.expected_amount_kobo)) {
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from('payment_transactions')
      .select('id')
      .eq('provider_reference', reference)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const { data: tx, error: txError } = await admin
      .from('payment_transactions')
      .insert({
        user_id: credits.user_id,
        amount_ghs: credits.expected_amount_kobo / 100,
        provider: 'paystack',
        provider_reference: reference,
        subscription_id: null,
        status: 'completed',
        metadata: { kind: 'credits', qty: credits.qty, expected_amount_kobo: credits.expected_amount_kobo },
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (txError) throw txError;

    const { error: grantError } = await admin.rpc('grant_credits', {
      p_user_id: credits.user_id,
      p_cycle_key: null,
      p_amount: credits.qty,
      p_reason: 'purchase',
    });

    if (grantError) throw grantError;

    const txId = (tx as { id?: unknown } | null)?.id;
    if (typeof txId === 'string') {
      const { data: ledgerRow } = await admin
        .from('credit_ledger')
        .select('id')
        .eq('user_id', credits.user_id)
        .eq('reason', 'purchase')
        .eq('delta', credits.qty)
        .is('reference', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const ledgerId = (ledgerRow as { id?: unknown } | null)?.id;
      if (typeof ledgerId === 'string') {
        const { error: refError } = await admin
          .from('credit_ledger')
          .update({ reference: txId })
          .eq('id', ledgerId);
        if (refError) {
          console.error('credit_ledger reference stamp failed:', refError);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('paystack credits webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

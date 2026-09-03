import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { verifyTransaction } from '@/utils/paystack';

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get('reference');

  if (!reference) {
    return NextResponse.json({ error: 'A reference is required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: tx } = await admin
    .from('payment_transactions')
    .select('id')
    .eq('provider_reference', reference)
    .maybeSingle();

  if (tx) {
    return NextResponse.json({ status: 'success' });
  }

  try {
    const { status } = await verifyTransaction(reference);
    return NextResponse.json({ status });
  } catch (error) {
    console.error('paystack verify error:', error);
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 });
  }
}
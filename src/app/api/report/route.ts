import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getClientIp, rateLimit } from '@/utils/rateLimit';

const REPORT_IP_LIMIT = 5; // reports per window per IP
const REPORT_WINDOW_MS = 3_600_000; // 1 hour
const MAX_REASON_LENGTH = 200;
const MAX_DETAILS_LENGTH = 2000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`report:${ip}`, REPORT_IP_LIMIT, REPORT_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many reports submitted. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { listingId, reason, details } = (body ?? {}) as {
    listingId?: unknown;
    reason?: unknown;
    details?: unknown;
  };

  if (typeof listingId !== 'string' || !UUID_PATTERN.test(listingId)) {
    return NextResponse.json({ error: 'A valid listingId is required' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return NextResponse.json({ error: 'A reason is required' }, { status: 400 });
  }
  if (reason.trim().length > MAX_REASON_LENGTH) {
    return NextResponse.json({ error: 'Reason is too long' }, { status: 400 });
  }
  if (typeof details !== 'string') {
    return NextResponse.json({ error: 'Details must be a string' }, { status: 400 });
  }
  if (details.length > MAX_DETAILS_LENGTH) {
    return NextResponse.json({ error: 'Details are too long' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  const { error: reportError } = await supabase.rpc('report_listing', {
    p_listing_id: listingId,
    p_reason: reason.trim(),
    p_details: details.trim() || null,
  });

  if (reportError) {
    console.error('report_listing RPC error:', reportError);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
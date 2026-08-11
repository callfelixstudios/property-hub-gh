'use server';

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getClientIp, rateLimit } from '@/utils/rateLimit';

const WEBHOOK_RATE_LIMIT = 5; // notifications per caller per window
const WEBHOOK_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface NotifyAdminInput {
  seekerName: string;
  location: string;
  budget: string;
  paymentTerm: string;
  propertyType: string;
  purpose: string;
  whatsappNumber: string;
}

/**
 * Notifies admins of a new space request via the Discord webhook.
 * Runs server-side so the webhook URL never leaks to the client, with
 * validation + per-caller rate limiting applied before the POST.
 */
export async function notifyAdminNewSpaceRequest(
  input: NotifyAdminInput
): Promise<{ success: boolean; error?: string }> {
  const { seekerName, location, budget, paymentTerm, propertyType, purpose, whatsappNumber } = input ?? {};

  const validateText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 200;

  if (
    !validateText(seekerName) ||
    !validateText(location) ||
    !validateText(propertyType) ||
    !validateText(purpose)
  ) {
    return { success: false, error: 'Invalid notification data' };
  }

  if (typeof whatsappNumber !== 'string' || whatsappNumber.length > 20) {
    return { success: false, error: 'Invalid notification data' };
  }

  if (typeof budget !== 'string' || budget.length > 50) {
    return { success: false, error: 'Invalid notification data' };
  }

  if (
    typeof paymentTerm !== 'string' ||
    (paymentTerm !== 'month' && paymentTerm !== 'year' && paymentTerm.length > 20)
  ) {
    return { success: false, error: 'Invalid notification data' };
  }

  try {
    const h = await headers();
    const ip = getClientIp(h);

    let callerKey = ip;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) callerKey = user.id;
    } catch {
      // Auth lookup failed — fall back to IP-based key.
    }

    if (!rateLimit(`otp:webhook:${callerKey}`, WEBHOOK_RATE_LIMIT, WEBHOOK_RATE_WINDOW_MS)) {
      return { success: false, error: 'Rate limit exceeded' };
    }

    const webhookUrl = process.env.ADMIN_WEBHOOK_URL;
    if (!webhookUrl) {
      return { success: false };
    }

    const content = `🔔 **New Space Request**\n**Seeker:** ${seekerName.trim()}\n**Location:** ${location.trim()}\n**Budget:** ${budget} / ${paymentTerm === 'month' ? 'month' : 'year'}\n**Category:** ${propertyType.trim()} (${purpose.trim()})\n**Contact:** ${whatsappNumber}`;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    return { success: true };
  } catch (error) {
    console.error('Webhook notification failed:', error);
    return { success: false };
  }
}

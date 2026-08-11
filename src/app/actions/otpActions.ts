'use server';

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { formatGhanaPhoneNumber, isValidGhanaPhone } from '@/utils/phoneUtils';
import { getClientIp, rateLimit } from '@/utils/rateLimit';

const PHONE_LIMIT = 5; // sends per phone per window
const PHONE_WINDOW_MS = 15 * 60_000; // 15 minutes
const IP_LIMIT = 20; // sends per IP per window
const IP_WINDOW_MS = 15 * 60_000; // 15 minutes

/**
 * Server-side OTP send with validation + throttling.
 * Mirrors the client-side rules as defense-in-depth so the limits
 * cannot be bypassed by calling Supabase directly.
 */
export async function requestPhoneOtp(
  rawPhone: string
): Promise<{ success: true; formattedPhone: string } | { success: false; error: string }> {
  if (!isValidGhanaPhone(rawPhone)) {
    return {
      success: false,
      error: 'Please enter a valid Ghanaian phone number (e.g., 024 123 4567).',
    };
  }

  const formattedPhone = formatGhanaPhoneNumber(rawPhone);

  const h = await headers();
  const ip = getClientIp(h);

  if (!rateLimit(`otp:phone:${formattedPhone}`, PHONE_LIMIT, PHONE_WINDOW_MS)) {
    return { success: false, error: 'Too many code requests. Please try again later.' };
  }

  if (!rateLimit(`otp:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS)) {
    return { success: false, error: 'Too many code requests. Please try again later.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, formattedPhone };
}

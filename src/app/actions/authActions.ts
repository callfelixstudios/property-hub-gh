'use client';

import { createClient } from '@/utils/supabase/client';
import { formatGhanaPhoneNumber, isValidGhanaPhone } from '@/utils/phoneUtils';

const OTP_RESEND_COOLDOWN_MS = 60_000;
const OTP_WINDOW_MS = 15 * 60_000;
const OTP_MAX_PER_WINDOW = 5;
const OTP_KEY_PREFIX = 'propertyhub_otp_throttle:';

type OtpThrottle = { count: number; firstAt: number; lastSentAt: number };

function readOtpThrottle(key: string): OtpThrottle | null {
  try {
    const raw = localStorage.getItem(OTP_KEY_PREFIX + key);
    return raw ? JSON.parse(raw) as OtpThrottle : null;
  } catch {
    return null;
  }
}

function storeOtpThrottle(key: string, value: OtpThrottle) {
  try {
    localStorage.setItem(OTP_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable — cooldown only applies for this browser tab.
  }
}

/**
 * Sends a one-time password (OTP) to a Ghanaian phone number via SMS.
 * Validates and formats the phone number to E.164 before calling Supabase.
 * Client-side cooldown (60s between sends, max 5 per 15 minutes per phone)
 * lives here as defense-in-depth on top of Supabase's own auth rate limits.
 */
export async function sendPhoneOtp(rawPhone: string) {
  if (!isValidGhanaPhone(rawPhone)) {
    return {
      success: false as const,
      error: 'Please enter a valid Ghanaian phone number (e.g., 024 123 4567).',
    };
  }

  const formattedPhone = formatGhanaPhoneNumber(rawPhone);
  const supabase = createClient();

  const now = Date.now();
  const throttleKey = formattedPhone;
  const existing = readOtpThrottle(throttleKey);

  if (existing) {
    if (now - existing.firstAt >= OTP_WINDOW_MS) {
      storeOtpThrottle(throttleKey, { count: 1, firstAt: now, lastSentAt: now });
    } else if (now - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      const waitSecs = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
      return {
        success: false as const,
        error: `Please wait ${waitSecs} seconds before requesting a new code.`,
      };
    } else if (existing.count >= OTP_MAX_PER_WINDOW) {
      return {
        success: false as const,
        error: 'Too many code requests. Please try again later.',
      };
    } else {
      existing.count += 1;
      existing.lastSentAt = now;
      storeOtpThrottle(throttleKey, existing);
    }
  } else {
    storeOtpThrottle(throttleKey, { count: 1, firstAt: now, lastSentAt: now });
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, formattedPhone };
}

/**
 * Verifies a 6-digit OTP code sent to a phone number.
 * On success, a Supabase session is established (cookie set by @supabase/ssr).
 */
export async function verifyPhoneOtp(formattedPhone: string, otpToken: string) {
  if (!otpToken || otpToken.trim().length !== 6) {
    return {
      success: false as const,
      error: 'Please enter the complete 6-digit OTP code.',
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: otpToken.trim(),
    type: 'sms',
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, session: data.session };
}

/**
 * Initiates Google OAuth sign-in.
 * Redirects the user to Google's consent screen; Supabase handles the callback.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  // The browser will redirect to Google — this return is only reached if something fails silently
  return { success: true as const, url: data.url };
}

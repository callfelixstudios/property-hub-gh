'use client';

import { createClient } from '@/utils/supabase/client';
import { formatGhanaPhoneNumber, isValidGhanaPhone } from '@/utils/phoneUtils';

/**
 * Sends a one-time password (OTP) to a Ghanaian phone number via SMS.
 * Validates and formats the phone number to E.164 before calling Supabase.
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

import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth callback handler for Google (and other OAuth providers).
 * Exchanges the auth code for a session, then redirects to the
 * destination specified via `?next=` or defaults to /rentals.
 */
/**
 * Restrict `next` to a same-origin local path to prevent open-redirects.
 * Anything that is not a plain relative path falls back to the default.
 */
function safeDestination(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith('/')) return fallback;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (raw.includes('\\') || raw.includes(':')) return fallback;
  if (/[\u0000-\u0020]/u.test(raw[0])) return fallback;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeDestination(searchParams.get('next'), '/rentals');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If code exchange fails, redirect to login with an error message
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Authentication failed. Please try again.')}`
  );
}

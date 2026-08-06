import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth callback handler for Google (and other OAuth providers).
 * Exchanges the auth code for a session, then redirects to the
 * destination specified via `?next=` or defaults to /rentals.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/rentals';

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

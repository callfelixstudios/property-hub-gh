import { createClient } from '@/utils/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';
import { resolvePostLoginDestination } from '@/utils/postLoginDestination';

/**
 * OAuth callback handler for Google (and other OAuth providers).
 * Exchanges the auth code for a session, then redirects to the
 * destination specified via `?next=` or defaults to /rentals.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_status')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.account_status === 'suspended' || profile?.account_status === 'deleted') {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?suspended=1`);
        }
      }

      const destination = await resolvePostLoginDestination(supabase, searchParams.get('next'));
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // If code exchange fails, redirect to login with an error message
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Authentication failed. Please try again.')}`
  );
}

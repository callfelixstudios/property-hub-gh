import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE_PREFIX = 'sb-';

/**
 * Redirects to /unauthorized when the profile is suspended or deleted.
 * Returns null when the user may proceed.
 */
async function redirectIfBlocked(
  supabase: SupabaseClient,
  request: NextRequest,
  user: User,
  response: NextResponse
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.account_status === 'suspended' || profile?.account_status === 'deleted') {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    url.search = '';
    url.searchParams.set('reason', profile.account_status);

    const redirect = NextResponse.redirect(url);
    // Carry the cleared session cookies from signOut onto the redirect.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return null;
}

/**
 * L5 hardening: reject suspended/deleted accounts at the network edge.
 * Only runs when a Supabase auth cookie exists (avoids work for anonymous
 * visitors / public endpoints), validates the session, and — if the signed-in
 * profile is suspended or deleted — signs the session out and redirects to /unauthorized.
 */
export async function proxy(request: NextRequest) {
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith(SESSION_COOKIE_PREFIX));

  if (!hasAuthCookie) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const blocked = await redirectIfBlocked(supabase, request, user, response);
    if (blocked) return blocked;
  } else {
    // Fall back to the cookie session when the token is expired/refresh is
    // blocked, so stale sessions can still be rejected at the edge.
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      const blocked = await redirectIfBlocked(supabase, request, data.session.user, response);
      if (blocked) return blocked;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|json|map)$).*)',
  ],
};
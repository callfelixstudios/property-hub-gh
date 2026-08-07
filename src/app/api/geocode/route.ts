import { NextResponse } from 'next/server';
import { getClientIp, rateLimit } from '@/utils/rateLimit';

const GEOCODE_IP_LIMIT = 30; // requests per window per IP
const GEOCODE_WINDOW_MS = 60_000;
const MAX_QUERY_LENGTH = 300;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  if (q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: 'Query parameter q is too long' }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (!rateLimit(`geocode:${ip}`, GEOCODE_IP_LIMIT, GEOCODE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many geocoding requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    
    // Server-side fetch allows us to securely set the User-Agent without browser CORS/Forbidden header blocks
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'PropertyHubGH-Platform',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Nominatim API returned ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Geocoding API Route Error:', error);
    return NextResponse.json({ error: 'Failed to geocode' }, { status: 500 });
  }
}

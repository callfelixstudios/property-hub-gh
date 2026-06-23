import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
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

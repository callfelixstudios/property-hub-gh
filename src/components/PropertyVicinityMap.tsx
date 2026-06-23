'use client';

import { useEffect, useState } from 'react';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  location?: string;
}

export default function PropertyVicinityMap({ lat, lng, location }: PropertyVicinityMapProps) {
  const defaultLat = lat ?? 5.6037;
  const defaultLng = lng ?? -0.1870;

  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({
    lat: defaultLat,
    lon: defaultLng,
  });

  useEffect(() => {
    let isMounted = true;

    // Convert to Number to handle string values from Supabase before checking
    const numLat = Number(lat);
    const numLng = Number(lng);
    const isPlaceholder = 
      (Math.abs(numLat - 5.6037) < 0.001 && Math.abs(numLng - (-0.1870)) < 0.001) || 
      (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001);
    
    // Skip geocoding only if we have genuine coordinates from the database
    if (lat != null && lng != null && !isPlaceholder) {
      setCoordinates({ lat: numLat, lon: numLng });
      return;
    }

    async function fetchWithFallback() {
      const queries = [];
      
      // Tier 1: User explicitly requested `${listing.location}, Ghana`
      if (location) {
        queries.push(`${location}, Ghana`);
        
        // Tier 2: Split and fallback if the explicit string is too complex for Nominatim
        if (location.includes(',')) {
          const parts = location.split(',').map(s => s.trim());
          if (parts.length > 0) queries.push(`${parts[0]}, Ghana`); // E.g. "East Legon, Ghana"
        }
      }
      
      // Tier 3: Ultimate fallback
      queries.push(`Accra, Ghana`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        for (const query of queries) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            
            // CRITICAL FIX: Browsers block custom 'User-Agent' headers in client-side fetch.
            // Using a standard fetch without it allows the browser's native User-Agent to pass through, satisfying Nominatim.
            const res = await fetch(url, { signal: controller.signal });
            
            if (!res.ok) {
              console.warn(`Nominatim returned ${res.status} for ${query}`);
              continue;
            }
            
            const data = await res.json();
            
            if (data && data.length > 0 && isMounted) {
              clearTimeout(timeoutId);
              setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
              return; // Stop searching once we find a valid coordinate
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            console.error(`Geocoding lookup failed for query "${query}":`, err);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('Geocoding timed out after 5000ms.');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchWithFallback();

    return () => { isMounted = false; };
  }, [lat, lng, location]);

  const offset = 0.008;
  const bbox = `${coordinates.lon - offset},${coordinates.lat - offset},${coordinates.lon + offset},${coordinates.lat + offset}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative bg-slate-100">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={iframeSrc}
        style={{ border: 0 }}
        title="Property Vicinity Map"
        className="w-full h-full"
      />
      {/* Privacy-focused vicinity circle overlay */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          border: '2px solid #0f172a',
          backgroundColor: 'rgba(56, 189, 248, 0.35)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  );
}

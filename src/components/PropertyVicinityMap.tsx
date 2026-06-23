'use client';

import { useEffect, useState } from 'react';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
}

export default function PropertyVicinityMap({ lat, lng, neighborhood, region }: PropertyVicinityMapProps) {
  const defaultLat = lat ?? 5.6037;
  const defaultLng = lng ?? -0.1870;

  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number }>({
    lat: defaultLat,
    lon: defaultLng,
  });

  useEffect(() => {
    let isMounted = true;

    // If we already have explicit GPS coordinates, don't geocode
    if (lat != null && lng != null) return;

    async function fetchWithFallback() {
      // Build a multi-tier fallback array using the exact format requested
      const queries = [];
      
      // Tier 1: Highly specific Neighborhood + Region
      if (neighborhood && region) queries.push(`${neighborhood}, ${region}, Ghana`);
      // Tier 2: Just Neighborhood
      else if (neighborhood) queries.push(`${neighborhood}, Ghana`);
      
      // Tier 3: Just Region (Fallback)
      if (region) {
        // Nominatim sometimes needs "Region" appended to resolve Ghanaian regions properly
        queries.push(`${region} Region, Ghana`);
        queries.push(`${region}, Ghana`);
      }
      
      // Tier 4: Ultimate fallback
      queries.push(`Accra, Ghana`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      try {
        for (const query of queries) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const res = await fetch(url, {
              headers: { 'User-Agent': 'PropertyHubGH' },
              signal: controller.signal,
            });
            const data = await res.json();
            
            if (data && data.length > 0 && isMounted) {
              clearTimeout(timeoutId);
              setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
              return; // Stop searching once we find a valid coordinate
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err; // Bubble up timeout to break the loop entirely
            console.error(`Geocoding lookup failed for query "${query}":`, err);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('Geocoding timed out after 2500ms. Falling back to default.');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchWithFallback();

    return () => { isMounted = false; };
  }, [lat, lng, neighborhood, region]);

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

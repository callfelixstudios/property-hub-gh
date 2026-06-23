'use client';

import { useEffect, useState } from 'react';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

export default function PropertyVicinityMap({ lat, lng, neighborhood, region, country }: PropertyVicinityMapProps) {
  // Optimistically initialize with passed coordinates or the Accra fallback
  // This completely eliminates any initial spinner UI state
  const defaultLat = lat ?? 5.6037;
  const defaultLng = lng ?? -0.1870;
  
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number}>({ 
    lat: defaultLat, 
    lon: defaultLng 
  });
  
  // We no longer block the UI with an isLoading state. 
  // We render the iframe immediately with default/passed coords.

  useEffect(() => {
    let isMounted = true;

    // If coordinates were explicitly provided in props, we don't need to geocode.
    if (lat != null && lng != null) {
      return;
    }

    async function fetchWithFallback() {
      const queries = [];
      
      if (neighborhood && region) queries.push(`${neighborhood}, ${region}, ${country || "Ghana"}`);
      else if (neighborhood) queries.push(`${neighborhood}, ${country || "Ghana"}`);
      if (region) queries.push(`${region}, ${country || "Ghana"}`);
      queries.push(`Accra, ${country || "Ghana"}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 2500);

      try {
        for (const query of queries) {
          try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const res = await fetch(url, { 
              headers: { 'User-Agent': 'PropertyHubGH-App' },
              signal: controller.signal 
            });
            const data = await res.json();
            
            if (data && data.length > 0) {
              if (isMounted) {
                clearTimeout(timeoutId);
                setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
              }
              return; 
            }
          } catch (err: any) {
            if (err.name === 'AbortError') throw err; 
            console.error(`Geocoding lookup failed for query "${query}":`, err);
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn("Geocoding API timed out after 2500ms.");
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchWithFallback();

    return () => {
      isMounted = false;
    };
  }, [lat, lng, neighborhood, region, country]);

  // The spinner is completely removed. We ALWAYS have coordinates.

  // Calculate a reasonable bounding box for the iframe
  const offset = 0.005; // Roughly 500 meters
  const bbox = `${coordinates.lon - offset},${coordinates.lat - offset},${coordinates.lon + offset},${coordinates.lat + offset}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coordinates.lat},${coordinates.lon}`;

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
      ></iframe>
    </div>
  );
}

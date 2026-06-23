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
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Ultimate Safety Kill Switch: Force render after 2500ms no matter what
    const hardTimeout = setTimeout(() => {
      if (isMounted) {
        setCoordinates(prev => prev || { lat: 5.6037, lon: -0.1870 });
        setIsLoading(false);
      }
    }, 2500);

    // If coordinates are explicitly provided
    if (lat != null && lng != null) {
      setCoordinates({ lat, lon: lng });
      setIsLoading(false);
      clearTimeout(hardTimeout);
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
                setIsLoading(false);
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
          console.warn("Geocoding API timed out after 2500ms. Forcing fallback.");
        }
      } finally {
        clearTimeout(timeoutId);
      }

      // Final Safe Coordinates Catch
      if (isMounted) {
        setCoordinates({ lat: 5.6037, lon: -0.1870 });
        setIsLoading(false);
      }
    }

    fetchWithFallback();

    return () => {
      isMounted = false;
      clearTimeout(hardTimeout);
    };
  }, [lat, lng, neighborhood, region, country]);

  if (isLoading || !coordinates) {
    return (
      <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center relative">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-navy-base border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Fetching neighborhood map view...</p>
        </div>
      </div>
    );
  }

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

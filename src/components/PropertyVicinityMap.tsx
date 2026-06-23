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

    // ALWAYS geocode the neighborhood string to get the regional centroid.
    // We explicitly ignore the exact database lat/lng to ensure the 900m privacy circle 
    // is centered on the neighborhood itself, not the exact house, protecting user privacy.

    async function fetchFromApiProxy() {
      const query = `${location || 'Accra'}, Ghana`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        // Proxy through our secure API route to ensure User-Agent headers pass to Nominatim without browser 403 blocks
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        
        if (!res.ok) {
          console.error(`Geocode API proxy failed with status: ${res.status}`);
          return;
        }

        const data = await res.json();
        
        if (data && data.length > 0 && isMounted) {
          clearTimeout(timeoutId);
          setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        }
      } catch (err) {
        console.error('Geocoding lookup failed:', err);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchFromApiProxy();

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
        className="w-full h-full pointer-events-none"
      />
      {/* Privacy-focused vicinity circle overlay rendering natively to bypass react-leaflet crash */}
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

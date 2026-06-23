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

    if (lat != null && lng != null) return;

    async function geocode() {
      const query = `${location || 'Accra'}, Ghana`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

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
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('Geocoding timed out after 2500ms.');
        } else {
          console.error('Geocoding failed:', err);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    geocode();
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

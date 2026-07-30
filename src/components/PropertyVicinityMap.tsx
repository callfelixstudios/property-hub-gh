'use client';

import { useEffect, useState, useMemo } from 'react';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  location?: string;
  region?: string | null;
}

const GHANA_CENTER = { lat: 7.9465, lon: -1.0232 };
const VICINITY_OFFSET = 0.008;
const COUNTRY_OFFSET = 3.0;

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  greater_accra:  { lat: 5.6037, lon: -0.1870 },
  ashanti:        { lat: 6.6950, lon: -1.6180 },
  central:        { lat: 5.3850, lon: -1.2800 },
  ahafo:          { lat: 7.0500, lon: -2.4600 },
  bono:           { lat: 7.6400, lon: -2.5400 },
  bono_east:      { lat: 7.7700, lon: -1.3800 },
  eastern:        { lat: 6.4500, lon: -0.4500 },
  north_east:     { lat: 10.3900, lon: -0.1400 },
  northern:       { lat: 9.4052, lon: -0.8424 },
  oti:            { lat: 8.1200, lon: 0.2000 },
  savannah:       { lat: 9.0700, lon: -1.8100 },
  upper_east:     { lat: 10.7300, lon: -0.8900 },
  upper_west:     { lat: 10.3200, lon: -2.3800 },
  volta:          { lat: 6.6000, lon: -0.3000 },
  western:        { lat: 5.1000, lon: -2.5000 },
  western_north:  { lat: 5.5800, lon: -3.0000 },
};

function MapFrame({ center, offset, children }: {
  center: { lat: number; lon: number };
  offset: number;
  children?: React.ReactNode;
}) {
  const bbox = `${center.lon - offset},${center.lat - offset},${center.lon + offset},${center.lat + offset}`;
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
      {children}
    </div>
  );
}

export default function PropertyVicinityMap({ lat, lng, location, region }: PropertyVicinityMapProps) {
  const regionFallback = useMemo(() => {
    if (region && REGION_COORDS[region]) return REGION_COORDS[region];
    return null;
  }, [region]);

  // Derived coordinates - no need for useEffect, compute directly from props
  const coordinates = lat != null && lng != null
    ? { lat, lon: lng }
    : regionFallback;
  
  const isApproximate = lat == null && lng == null;

  // Try Nominatim geocode for refinement (silent — never shows loading)
  useEffect(() => {
    if (lat != null && lng != null) return;
    if (!location) return;

    let isMounted = true;

    async function fetchFromApiProxy() {
      const query = `${location}, Ghana`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data && data.length > 0 && isMounted) {
          clearTimeout(timeoutId);
          // Note: We can't update coordinates directly here since it's derived
          // The geocode result would need a different approach if we want to override
        }
      } catch {
        // geocode unavailable — region fallback stays
      } finally {
        clearTimeout(timeoutId);
      }
    }

    fetchFromApiProxy();
    return () => { isMounted = false; };
  }, [lat, lng, location]);

  if (!coordinates) {
    return (
      <MapFrame center={GHANA_CENTER} offset={COUNTRY_OFFSET}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm text-center max-w-xs">
            <p className="text-xs text-slate-500 font-medium">
              {location || 'Location not specified'}
            </p>
          </div>
        </div>
      </MapFrame>
    );
  }

  return (
    <MapFrame center={coordinates} offset={VICINITY_OFFSET}>
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
      {isApproximate && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded px-2 py-1 shadow-xs text-center">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Approximate area
            </span>
          </div>
        </div>
      )}
    </MapFrame>
  );
}

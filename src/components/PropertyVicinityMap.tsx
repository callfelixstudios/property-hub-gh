'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  location?: string;
}

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.setView([lat, lon], 14);
      const timeoutId = setTimeout(() => {
        map.invalidateSize();
      }, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [lat, lon, map]);
  return null;
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

    // If coordinates were explicitly provided in props, no geocoding needed.
    if (lat != null && lng != null) {
      return;
    }

    async function geocode() {
      // Build the query directly from the pre-formatted location string
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

    return () => {
      isMounted = false;
    };
  }, [lat, lng, location]);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative bg-slate-100">
      <MapContainer
        key={`${coordinates.lat}-${coordinates.lon}`}
        center={[coordinates.lat, coordinates.lon]}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: '400px', width: '100%', zIndex: 0 }}
      >
        <RecenterMap lat={coordinates.lat} lon={coordinates.lon} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[coordinates.lat, coordinates.lon]}
          radius={900}
          pathOptions={{
            color: '#0f172a',
            fillColor: '#38bdf8',
            fillOpacity: 0.35,
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
}

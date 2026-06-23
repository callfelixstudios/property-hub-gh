'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Force Map Frame View Reset on Coordinate Update as requested
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14);
      setTimeout(() => map.invalidateSize(), 100);
    }
  }, [center, map]);
  return null;
}

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

    // Check for false DB default placeholders
    const numLat = Number(lat);
    const numLng = Number(lng);
    const isPlaceholder = 
      (Math.abs(numLat - 5.6037) < 0.001 && Math.abs(numLng - (-0.1870)) < 0.001) || 
      (Math.abs(numLat) < 0.0001 && Math.abs(numLng) < 0.0001);
    
    if (lat != null && lng != null && !isPlaceholder) {
      setCoordinates({ lat: numLat, lon: numLng });
      return;
    }

    async function fetchFromApiProxy() {
      // Hardcode the Country Boundary into the Map Search Query per user instruction
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

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer 
        center={[coordinates.lat, coordinates.lon]} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '400px', width: '100%', zIndex: 0 }}
      >
        <ChangeView center={[coordinates.lat, coordinates.lon]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle 
          center={[coordinates.lat, coordinates.lon]} 
          radius={900} 
          pathOptions={{ color: '#0f172a', fillColor: '#38bdf8', fillOpacity: 0.35, weight: 2 }} 
        />
      </MapContainer>
    </div>
  );
}

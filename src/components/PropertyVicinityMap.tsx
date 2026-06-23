'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [center, map]);
  return null;
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

  const centerTuple: [number, number] = [coordinates.lat, coordinates.lon];

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 z-0 relative bg-slate-100">
      <MapContainer 
        key={`${centerTuple[0]}-${centerTuple[1]}`}
        center={centerTuple} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: '400px', width: '100%', zIndex: 0 }}
      >
        <MapUpdater center={centerTuple} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle 
          center={centerTuple} 
          radius={900} 
          pathOptions={{ 
            color: '#0f172a',      
            fillColor: '#38bdf8',  
            fillOpacity: 0.35,     
            weight: 2              
          }} 
        />
      </MapContainer>
    </div>
  );
}

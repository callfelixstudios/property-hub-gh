'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';

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
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // If coordinates are explicitly provided
    if (lat != null && lng != null) {
      setCoordinates({ lat, lon: lng });
      setIsLoading(false);
      return;
    }

    async function fetchWithFallback() {
      const queries = [];
      
      // Tier 1: Specific
      if (neighborhood && region) {
        queries.push(`${neighborhood}, ${region}, ${country || "Ghana"}`);
      } else if (neighborhood) {
        queries.push(`${neighborhood}, ${country || "Ghana"}`);
      }

      // Tier 2: Regional Fallback
      if (region) {
        queries.push(`${region}, ${country || "Ghana"}`);
      }

      // Tier 3: National Baseline Fallback
      queries.push(`Accra, ${country || "Ghana"}`);

      for (const query of queries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
          const res = await fetch(url, { headers: { 'User-Agent': 'PropertyHubGH-Directory-Agent' } });
          const data = await res.json();
          
          if (data && data.length > 0) {
            if (isMounted) {
              setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
              setIsLoading(false);
            }
            return; // Stop searching once we find a valid result
          }
        } catch (err) {
          console.error(`Geocoding lookup failed for query "${query}":`, err);
          // Continue to the next fallback tier
        }
      }

      // Final Safe Coordinates Catch
      if (isMounted) {
        console.warn("All geocoding tiers failed. Falling back to default Accra coordinates.");
        setCoordinates({ lat: 5.6037, lon: -0.1870 });
        setIsLoading(false);
      }
    }

    fetchWithFallback();

    return () => {
      isMounted = false;
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

  const centerTuple: [number, number] = [coordinates.lat, coordinates.lon];

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-200 z-0 relative">
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
          radius={400} 
          pathOptions={{ fillColor: "#ef4444", color: "#ef4444", fillOpacity: 0.15 }} 
        />
      </MapContainer>
    </div>
  );
}

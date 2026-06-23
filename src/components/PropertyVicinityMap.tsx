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
    // If coordinates are explicitly provided
    if (lat != null && lng != null) {
      setCoordinates({ lat, lon: lng });
      setIsLoading(false);
      return;
    }

    // Otherwise attempt to geocode
    if (neighborhood || region) {
      const searchParts = [];
      if (neighborhood) searchParts.push(neighborhood);
      searchParts.push(region || "Greater Accra");
      searchParts.push(country || "Ghana");
      
      const queryString = searchParts.join(', ');
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryString)}&limit=1`;

      fetch(url, {
        headers: {
          'User-Agent': 'PropertyHubGH-Directory-Agent'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoordinates({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
        } else {
          // Fallback if geocoding yields no results
          setCoordinates({ lat: 5.6037, lon: -0.1870 });
        }
      })
      .catch(err => {
        console.error("Geocoding failed:", err);
        setCoordinates({ lat: 5.6037, lon: -0.1870 });
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      // Fallback if no location data is provided at all
      setCoordinates({ lat: 5.6037, lon: -0.1870 });
      setIsLoading(false);
    }
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

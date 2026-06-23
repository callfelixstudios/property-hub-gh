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
  // Fallback to Accra central if coordinates are missing
  const defaultLat = lat ?? 5.6037;
  const defaultLng = lng ?? -0.1870;

  const [center, setCenter] = useState<[number, number]>([defaultLat, defaultLng]);

  useEffect(() => {
    // Only geocode if we have at least a neighborhood or region, and explicit lat/lng weren't fully provided
    if ((lat == null || lng == null) && (neighborhood || region)) {
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
          setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      })
      .catch(err => {
        console.error("Geocoding failed:", err);
      });
    } else if (lat != null && lng != null) {
      setCenter([lat, lng]);
    }
  }, [lat, lng, neighborhood, region, country]);

  return (
    <div className="w-full h-[350px] rounded-xl overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
        style={{ zIndex: 0 }}
      >
        <MapUpdater center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle 
          center={center} 
          radius={400} 
          pathOptions={{ fillColor: "#ef4444", color: "#ef4444", fillOpacity: 0.15 }} 
        />
      </MapContainer>
    </div>
  );
}

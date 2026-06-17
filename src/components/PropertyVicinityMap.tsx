'use client';

import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyVicinityMapProps {
  lat?: number | null;
  lng?: number | null;
}

export default function PropertyVicinityMap({ lat, lng }: PropertyVicinityMapProps) {
  // Fallback to Accra central if coordinates are missing
  const centerLat = lat ?? 5.6037;
  const centerLng = lng ?? -0.1870;

  return (
    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-slate-200 z-0 relative">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={14} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle 
          center={[centerLat, centerLng]} 
          radius={400} 
          pathOptions={{ fillColor: "#ef4444", color: "#ef4444", fillOpacity: 0.15 }} 
        />
      </MapContainer>
    </div>
  );
}

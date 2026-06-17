'use client';

import dynamic from 'next/dynamic';

const PropertyVicinityMap = dynamic(() => import('./PropertyVicinityMap'), { ssr: false });

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

export default function MapLoader({ lat, lng, neighborhood, region, country }: MapLoaderProps) {
  return <PropertyVicinityMap lat={lat} lng={lng} neighborhood={neighborhood} region={region} country={country} />;
}

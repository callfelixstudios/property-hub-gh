'use client';

import dynamic from 'next/dynamic';

const PropertyVicinityMap = dynamic(() => import('./PropertyVicinityMap'), { ssr: false });

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
}

export default function MapLoader({ lat, lng }: MapLoaderProps) {
  return <PropertyVicinityMap lat={lat} lng={lng} />;
}

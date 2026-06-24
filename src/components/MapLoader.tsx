'use client';

import PropertyVicinityMap from './PropertyVicinityMap';

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  location?: string;
  region?: string | null;
}

export default function MapLoader(props: MapLoaderProps) {
  return <PropertyVicinityMap {...props} />;
}

import PropertyVicinityMap from './PropertyVicinityMap';

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

export default function MapLoader(props: MapLoaderProps) {
  return <PropertyVicinityMap {...props} />;
}

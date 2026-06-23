'use client';

import dynamic from 'next/dynamic';

const PropertyVicinityMap = dynamic(
  () => import('./PropertyVicinityMap').catch((err) => {
    console.error('Failed to load map component:', err);
    return { default: () => <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center"><p className="text-sm text-slate-400">Map could not be loaded.</p></div> };
  }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading map...</p>
        </div>
      </div>
    ),
  }
);

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

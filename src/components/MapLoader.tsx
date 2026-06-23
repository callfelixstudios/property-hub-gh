'use client';

import dynamic from 'next/dynamic';

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

const PropertyVicinityMap = dynamic(
  () => import('./PropertyVicinityMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center relative">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-navy-base border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading map bundle...</p>
        </div>
      </div>
    )
  }
);

export default function MapLoader(props: MapLoaderProps) {
  return <PropertyVicinityMap {...props} />;
}

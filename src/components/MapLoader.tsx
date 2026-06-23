'use client';

import dynamic from 'next/dynamic';

const PropertyVicinityMap = dynamic(() => import('./PropertyVicinityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center">
      <span className="text-slate-400 font-medium">Loading map...</span>
    </div>
  ),
});

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  location?: string;
}

export default function MapLoader(props: MapLoaderProps) {
  return <PropertyVicinityMap {...props} />;
}

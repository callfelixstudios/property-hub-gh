'use client';

import { useState, useEffect } from 'react';

interface MapLoaderProps {
  lat?: number | null;
  lng?: number | null;
  neighborhood?: string;
  region?: string;
  country?: string;
}

export default function MapLoader(props: MapLoaderProps) {
  const [MapComponent, setMapComponent] = useState<any>(null);

  useEffect(() => {
    // Manually import the component strictly on the client side
    // This bypasses Next.js's dynamic() Webpack chunk hang
    let isMounted = true;
    import('./PropertyVicinityMap')
      .then((mod) => {
        if (isMounted) setMapComponent(() => mod.default);
      })
      .catch((err) => {
        console.error("Manual map import failed:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-[400px] rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium text-slate-500">Loading map bundle...</p>
        </div>
      </div>
    );
  }

  return <MapComponent {...props} />;
}

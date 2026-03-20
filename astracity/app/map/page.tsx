'use client';

import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-73px)] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      <p className="text-white/50 animate-pulse font-medium">Initializing AstraCity Geospatial Interface...</p>
    </div>
  )
});

export default function MapPage() {
  return (
    <MapContainer />
  );
}

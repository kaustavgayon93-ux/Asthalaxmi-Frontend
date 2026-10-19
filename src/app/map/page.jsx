'use client';

import dynamic from 'next/dynamic';

const MapViewClient = dynamic(() => import('@/components/Map/MapViewClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[700px] w-full flex flex-col items-center justify-center bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 shadow-xl gap-3">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold tracking-wide">Initializing Assam Spatial GIS Engine...</p>
    </div>
  ),
});

export default function MapPage() {
  return <MapViewClient />;
}

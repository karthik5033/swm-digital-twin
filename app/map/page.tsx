'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Keep both components pre-loaded and hidden/shown via CSS for instant switching
const SmartMap = dynamic(() => import('@/components/map/SmartMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0f1a] space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00d4aa]" />
      <p className="text-white/40 text-sm animate-pulse tracking-wide">Loading HSR Layout map…</p>
    </div>
  ),
});

const CityMap = dynamic(() => import('@/components/map/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0f1a] space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400" />
      <p className="text-white/40 text-sm animate-pulse tracking-wide">Loading Bengaluru City map…</p>
    </div>
  ),
});

type MapView = 'hsr' | 'city';

export default function MapPage() {
  const [activeView, setActiveView] = useState<MapView>('hsr');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>

      {/* ── View Switcher Bar ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-center gap-3 py-2.5 px-4"
        style={{
          background: 'rgba(10,15,26,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span className="text-xs font-semibold text-slate-400 tracking-wide select-none">
          Switch View:
        </span>

        {/* Pill toggle */}
        <div
          className="relative flex items-center p-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* sliding highlight */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-in-out"
            style={{
              width: 'calc(50% - 2px)',
              background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)',
              boxShadow: '0 0 16px rgba(0,212,170,0.35)',
              left: activeView === 'city' ? 'calc(50% + 2px)' : '2px',
            }}
          />

          <button
            id="view-btn-hsr"
            onClick={() => setActiveView('hsr')}
            className="relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 flex items-center gap-1.5 select-none"
            style={{ color: activeView === 'hsr' ? '#fff' : '#64748b', minWidth: 130 }}
          >
            <span>📍</span>
            <span>HSR Layout</span>
          </button>

          <button
            id="view-btn-city"
            onClick={() => setActiveView('city')}
            className="relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 flex items-center gap-1.5 select-none"
            style={{ color: activeView === 'city' ? '#fff' : '#64748b', minWidth: 130 }}
          >
            <span>🗺️</span>
            <span>City View</span>
          </button>
        </div>

        {/* Active view descriptor */}
        <span className="text-[11px] text-slate-500 hidden sm:block select-none">
          {activeView === 'hsr'
            ? 'Detailed HSR Layout · Satellite data · Real dump sites'
            : 'BBMP 243 Wards · Vulnerability scoring · City-wide view'}
        </span>
      </div>

      {/* ── Map Frames — both mounted, CSS-toggled for instant switch ─────── */}
      <div className="relative flex-1 overflow-hidden">
        {/* HSR Detailed Map */}
        <div
          className="absolute inset-0"
          style={{ display: activeView === 'hsr' ? 'block' : 'none' }}
        >
          <SmartMap />
        </div>

        {/* City-wide BBMP Map */}
        <div
          className="absolute inset-0"
          style={{ display: activeView === 'city' ? 'block' : 'none' }}
        >
          <CityMap />
        </div>
      </div>
    </div>
  );
}

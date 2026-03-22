'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const SmartMap = dynamic(() => import('@/components/map/SmartMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0f1a] space-y-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00d4aa]" />
      <p className="text-slate-900/40 text-sm animate-pulse tracking-wide">Loading HSR Layout map…</p>
    </div>
  ),
});

export default function MapPage() {
  const router = useRouter();

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
        <span className="text-xs font-semibold text-slate-600 tracking-wide select-none">
          Switch View:
        </span>

        {/* Pill toggle */}
        <div
          className="relative flex items-center p-0.5 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          {/* sliding highlight — always on left (HSR) */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-full"
            style={{
              width: 'calc(50% - 2px)',
              background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)',
              boxShadow: '0 0 16px rgba(0,212,170,0.35)',
              left: '2px',
            }}
          />

          <button
            id="view-btn-hsr"
            className="relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 flex items-center gap-1.5 select-none"
            style={{ color: '#fff', minWidth: 130 }}
          >
            <span>📍</span>
            <span>HSR Layout</span>
          </button>

          <button
            id="view-btn-vehicle"
            onClick={() => router.push('/vehicle-sim')}
            className="relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 flex items-center gap-1.5 select-none"
            style={{ color: '#64748b', minWidth: 130 }}
          >
            <span>🚛</span>
            <span>Vehicle Sim</span>
          </button>
        </div>

        {/* Active view descriptor */}
        <span className="text-[11px] text-slate-500 hidden sm:block select-none">
          Detailed HSR Layout · Real BBMP data · 9,471 buildings
        </span>
      </div>

      {/* ── Map Frame — HSR Layout only ─────── */}
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <SmartMap />
        </div>
      </div>
    </div>
  );
}

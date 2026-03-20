'use client';

import { useStore, LayerId } from '@/lib/store';
import { useState } from 'react';

const LAYERS: { id: LayerId; label: string; color: string; glowColor: string }[] = [
  { id: 'dumps',             label: 'Illegal dump sites',       color: '#f97316', glowColor: 'rgba(249,115,22,0.35)' },
  { id: 'methane',           label: 'Methane heatmap',          color: '#ef4444', glowColor: 'rgba(239,68,68,0.35)' },
  { id: 'waste',             label: 'Waste generation heatmap', color: '#eab308', glowColor: 'rgba(234,179,8,0.35)' },
  { id: 'dumpProbability',   label: 'Dumping probability',      color: '#3b82f6', glowColor: 'rgba(59,130,246,0.35)' },
  { id: 'routes',            label: 'Optimized truck routes',   color: '#10b981', glowColor: 'rgba(16,185,129,0.35)' },
  { id: 'wardVulnerability', label: 'Ward vulnerability',       color: '#e2e8f0', glowColor: 'rgba(226,232,240,0.25)' },
];

export default function LayerToggle() {
  const { activeLayers, toggleLayer } = useStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      id="layer-toggle-panel"
      className="absolute top-6 left-6 z-10 select-none"
      style={{ width: collapsed ? 'auto' : 280 }}
    >
      {/* ---- Header ---- */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-xl cursor-pointer"
        style={{
          background: 'rgba(12, 17, 33, 0.82)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          borderRadius: collapsed ? 12 : undefined,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/60">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold text-white/80 tracking-wide uppercase" style={{ letterSpacing: '0.06em' }}>
            Layers
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2"
          className={`text-white/40 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
        >
          <polyline points="18 15 12 9 6 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* ---- Body ---- */}
      <div
        className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          maxHeight: collapsed ? 0 : 440,
          opacity: collapsed ? 0 : 1,
          background: 'rgba(12, 17, 33, 0.78)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="p-3 space-y-1">
          {LAYERS.map((layer) => {
            const isOn = activeLayers[layer.id];
            return (
              <button
                key={layer.id}
                id={`layer-btn-${layer.id}`}
                onClick={() => toggleLayer(layer.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
                style={{
                  background: isOn ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                {/* Colored dot */}
                <span
                  className="flex-shrink-0 rounded-full transition-all duration-300"
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: layer.color,
                    boxShadow: isOn ? `0 0 10px ${layer.glowColor}` : 'none',
                    opacity: isOn ? 1 : 0.4,
                  }}
                />

                {/* Label */}
                <span
                  className="flex-1 text-left text-[13px] font-medium transition-colors duration-200"
                  style={{ color: isOn ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}
                >
                  {layer.label}
                </span>

                {/* Toggle switch */}
                <div
                  className="relative flex-shrink-0 transition-colors duration-300 rounded-full"
                  style={{
                    width: 36,
                    height: 20,
                    background: isOn ? layer.color : 'rgba(255,255,255,0.08)',
                    boxShadow: isOn ? `0 0 12px ${layer.glowColor}` : 'none',
                  }}
                >
                  <div
                    className="absolute top-[2px] rounded-full bg-white transition-transform duration-300 shadow-sm"
                    style={{
                      width: 16,
                      height: 16,
                      transform: isOn ? 'translateX(18px)' : 'translateX(2px)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* ---- Footer status ---- */}
        <div
          className="px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase"
          style={{
            color: 'rgba(255,255,255,0.25)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            letterSpacing: '0.05em',
          }}
        >
          {Object.values(activeLayers).filter(Boolean).length} of {LAYERS.length} active
        </div>
      </div>
    </div>
  );
}

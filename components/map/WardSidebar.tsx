'use client';

import { useStore } from '@/lib/store';
import wardScores from '@/data/ward_scores.json';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function WardSidebar() {
  const selectedWardId = useStore((s) => s.selectedWardId);
  const setSelectedWardId = useStore((s) => s.setSelectedWardId);
  const [isVisible, setIsVisible] = useState(false);

  const wardFound = selectedWardId ? wardScores.find((w: any) => w.name === selectedWardId) : null;
  const isFallback = !wardFound;
  const ward = wardFound || (selectedWardId ? {
    id: selectedWardId,
    name: selectedWardId,
    zone: 'Unmapped',
    score: 50,
    dumpRisk: 0.5,
    methaneIntensity: 0.5,
    routeEfficiency: 0.75,
    complaintRate: 0.5,
    trend: 'stable' as const,
    wasteTons: 100
  } : null);

  // Animate in/out
  useEffect(() => {
    if (ward) {
      // Tiny delay so the transform transition runs
      const t = setTimeout(() => setIsVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [selectedWardId]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setSelectedWardId(null), 350);
  };

  if (!ward && !isVisible) return null;
  if (!ward) return null;

  /* ---- risk helpers ---- */
  const isHigh   = ward.score < 40;
  const isMedium = ward.score >= 40 && ward.score < 70;

  const riskLabel = isHigh ? 'High Risk' : isMedium ? 'Medium Risk' : 'Low Risk';
  const riskColor = isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';
  const riskBg    = isHigh ? 'rgba(239,68,68,0.12)' : isMedium ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
  const riskBorder= isHigh ? 'rgba(239,68,68,0.35)' : isMedium ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)';
  const progressColor = isHigh ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981';

  const trendIcon  = ward.trend === 'up' ? '↑' : ward.trend === 'down' ? '↓' : '→';
  const trendLabel = ward.trend === 'up' ? 'Worsening' : ward.trend === 'down' ? 'Improving' : 'Stable';
  const trendColor = ward.trend === 'up' ? '#ef4444' : ward.trend === 'down' ? '#10b981' : '#9ca3af';
  const trendBg    = ward.trend === 'up' ? 'rgba(239,68,68,0.12)' : ward.trend === 'down' ? 'rgba(16,185,129,0.12)' : 'rgba(156,163,175,0.12)';
  const trendBorder= ward.trend === 'up' ? 'rgba(239,68,68,0.3)' : ward.trend === 'down' ? 'rgba(16,185,129,0.3)' : 'rgba(156,163,175,0.2)';

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 z-10 transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          background: 'linear-gradient(90deg, transparent 60%, rgba(0,0,0,0.3) 100%)',
        }}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        id="ward-sidebar"
        className="absolute top-0 right-0 h-full z-20 flex flex-col overflow-y-auto overflow-x-hidden"
        style={{
          width: 320,
          transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(10, 15, 30, 0.92)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Close button */}
        <button
          id="ward-sidebar-close"
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 z-10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50">
            <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
            <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
          </svg>
        </button>

        {/* ---- Header ---- */}
        <div className="px-6 pt-6 pb-4">
          {/* Ward zone tag */}
          <div
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {ward.zone} Zone
          </div>

          {/* Ward name */}
          <h2
            id="ward-name"
            className="text-[22px] font-bold leading-tight pr-10"
            style={{ color: '#fff' }}
          >
            {ward.name}
          </h2>

          {/* Risk badge */}
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
            style={{ background: riskBg, color: riskColor, border: `1px solid ${riskBorder}` }}
          >
            <span
              className="rounded-full"
              style={{ width: 6, height: 6, backgroundColor: riskColor, boxShadow: `0 0 8px ${riskColor}` }}
            />
            {riskLabel}
          </div>
        </div>

        {/* Separator */}
        <div className="mx-6 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* ---- Score Section ---- */}
        <div className="px-6 py-5">
          <div className="flex justify-between items-end mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Ward Score {isFallback && <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white/50">DEFAULT</span>}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums" style={{ color: '#fff' }}>
                {ward.score}
              </span>
              <span className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                /100
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 6, background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${ward.score}%`,
                background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                boxShadow: `0 0 12px ${progressColor}55`,
              }}
            />
          </div>
        </div>

        {/* ---- Metrics Cards ---- */}
        <div className="px-6 space-y-3 pb-5">
          {/* Dump Probability */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}
                >
                  ⚠
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Dump Probability
                </span>
              </div>
              <span className="text-xl font-bold tabular-nums" style={{ color: '#60a5fa' }}>
                {Math.round(ward.dumpRisk * 100)}%
              </span>
            </div>
          </div>

          {/* Waste Generation */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(234,179,8,0.12)', color: '#facc15' }}
                >
                  🗑
                </div>
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Waste Generation
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold tabular-nums" style={{ color: '#facc15' }}>
                  {ward.wasteTons}
                </span>
                <span className="text-[11px] font-medium ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  tons/day
                </span>
              </div>
            </div>
          </div>

          {/* Trend Indicator */}
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: trendBg, color: trendColor }}
              >
                📊
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Trend
                </span>
                <span className="text-[12px] font-medium" style={{ color: trendColor }}>
                  {trendLabel}
                </span>
              </div>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                background: trendBg,
                color: trendColor,
                border: `1px solid ${trendBorder}`,
                boxShadow: `0 0 16px ${trendBg}`,
              }}
            >
              {trendIcon}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ---- CTA Button ---- */}
        <div className="px-6 pb-6">
          <Link
            id="run-simulation-btn"
            href={`/simulation?ward=${ward.id}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.45)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Run Simulation for this ward
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}

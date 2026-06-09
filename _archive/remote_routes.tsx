"use client";
import React, { useState, useEffect } from 'react';

export default function RoutesPage() {
  const [oldRoute, setOldRoute] = useState<string[]>([]);
  const [oldDistance, setOldDistance] = useState("132.44");
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const [optimizedDistance, setOptimizedDistance] = useState("32.41");
  const [savings, setSavings] = useState("75.5");
  const [annualSavings, setAnnualSavings] = useState("0");
  const [roadCoverageBefore, setRoadCoverageBefore] = useState("0");
  const [roadCoverageAfter, setRoadCoverageAfter] = useState("0");

  useEffect(() => {
    fetch('http://localhost:8000/optimize-routes')
      .then(res => res.json())
      .then(data => {
        setOldRoute(data.old_route)
        setOldDistance(data.old_distance_km)
        setOptimizedRoute(data.optimized_route)
        setOptimizedDistance(data.optimized_distance_km)
        setSavings(data.savings_percent)
        setAnnualSavings(data.annual_fuel_savings_inr)
        setRoadCoverageBefore(data.road_coverage_before)
        setRoadCoverageAfter(data.road_coverage_after)
      })
      .catch(() => {
        setOldDistance("132.44")
        setOptimizedDistance("32.41")
        setSavings("75.5")
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#070b14] p-8 text-white relative flex flex-col items-center">
      <div className="absolute top-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="max-w-4xl w-full mx-auto bg-white/5 p-8 rounded-3xl shadow-xl border border-white/10 z-10 mt-12 backdrop-blur-md">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 mb-8 tracking-tighter">Route Optimization Engine</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-rose-500/10 rounded-2xl border border-rose-500/20">
            <div className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-2">Original Route Grid</div>
            <div className="text-5xl font-black text-rose-300">{oldDistance} <span className="text-xl">km</span></div>
          </div>
          <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <div className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-2">Algorithm Optimized</div>
            <div className="text-5xl font-black text-emerald-300">{optimizedDistance} <span className="text-xl">km</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Route Savings</div>
            <div className="text-2xl font-bold text-emerald-400">{savings}%</div>
          </div>
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ann. Fuel Savings</div>
            <div className="text-2xl font-bold text-white">Γé╣{annualSavings.toLocaleString()}</div>
          </div>
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Coverage Impr.</div>
            <div className="text-xl font-bold text-blue-400">{roadCoverageBefore}% Γ₧ö {roadCoverageAfter}%</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 border border-white/10 rounded-2xl bg-black/30">
            <h2 className="text-xl font-bold mb-4 text-white">Generated Real-time Waypoints</h2>
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              {optimizedRoute.map((stop, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 shadow-sm">
                    {stop.replace('_', ' ')}
                  </span>
                  {i < optimizedRoute.length - 1 && <span className="text-gray-600">ΓåÆ</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

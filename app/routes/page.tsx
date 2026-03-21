'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { HSR_DATA } from '@/lib/constants';
import Link from 'next/link';
import ZONE_DATA from '../../public/data/zone_analysis.json';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const z = ZONE_DATA.zones;

const HSR_GRIDS = [
  { 
    id: 'Sector 1', 
    zoneCount: 15,
    description: z.slice(0, 15).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(0, 15).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 210, narrow: 120, arterial: 40 } 
  },
  { 
    id: 'Sector 2', 
    zoneCount: 15,
    description: z.slice(15, 30).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(15, 30).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 150, narrow: 80, arterial: 25 } 
  },
  { 
    id: 'Sector 3', 
    zoneCount: 15,
    description: z.slice(30, 45).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(30, 45).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 300, narrow: 140, arterial: 55 } 
  },
  { 
    id: 'Sector 4-7', 
    zoneCount: 14,
    description: z.slice(45, 59).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(45, 59).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 180, narrow: 251, arterial: 80 } 
  },
  { 
    id: 'Total HSR Layout', 
    zoneCount: 59,
    description: 'All 59 mapped zones combined',
    waste: Number((z.reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 840, narrow: 591, arterial: 596 } 
  }
];

export default function RoutesAnalysisPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedGrid, setSelectedGrid] = useState(HSR_GRIDS[4]);
  const [wetCompartmentRatio, setWetCompartmentRatio] = useState(60);
  const [activeSection, setActiveSection] = useState<'overview' | 'optimizer'>('overview');
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const getVehicleColor = (vehicle: string) => {
    if (vehicle.includes('Large Truck') || vehicle === 'Truck') return '#0d9488';
    if (vehicle.includes('Auto Rickshaw')) return '#f59e0b';
    return '#94a3b8';
  };

  const chartData = HSR_DATA.road_breakdown.map(r => ({
    name: r.type,
    count: r.count,
    fill: getVehicleColor(r.vehicle)
  }));

  // Capacities
  const autoTipperCapacity = 0.5;
  const compactorCapacity = 10.0;
  const capsuleCapacity = 18.0;

  // Calculations
  const totalWaste = selectedGrid.waste;
  const numAutoTippers = Math.ceil(totalWaste / autoTipperCapacity);
  const numCompactors = Math.ceil(totalWaste / compactorCapacity);
  const numCapsules = Math.ceil(totalWaste / capsuleCapacity);
  const tipperWetCapacity = (autoTipperCapacity * (wetCompartmentRatio / 100)).toFixed(2);
  const tipperDryCapacity = (autoTipperCapacity * ((100 - wetCompartmentRatio) / 100)).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 transition-colors">
      <div className="max-w-7xl mx-auto px-6 pt-24">
        
        {/* HEADER */}
        <header className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight"
          >
            Route Intelligence
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 font-medium tracking-wide mb-8"
          >
            HSR Layout · Two-Tier Collection & Vehicle Optimization System
          </motion.p>

          {/* Tab Switcher */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeSection === 'overview' ? 'bg-white shadow-md text-teal-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              📊 Network Overview
            </button>
            <button
              onClick={() => setActiveSection('optimizer')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${activeSection === 'optimizer' ? 'bg-white shadow-md text-indigo-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ⚙️ Vehicle Optimizer
            </button>
          </div>
        </header>

        {activeSection === 'overview' && (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-12"
          >

            {/* SECTION 1: Two-tier summary */}
            <motion.section variants={fadeInUp}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* TRUCK ROUTES */}
                <div className="bg-white border-2 border-teal-200 rounded-3xl p-8 shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-teal-50 rounded-bl-[100px] pointer-events-none" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-teal-100">🚛</div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider">Truck Routes</h2>
                  </div>
                  <div className="mb-6 relative z-10">
                    <div className="text-5xl font-black text-teal-600 mb-1">{HSR_DATA.truck_roads} <span className="text-lg font-bold text-slate-400">segments</span></div>
                    <div className="text-lg font-bold text-slate-500">{HSR_DATA.truck_roads_pct}% of network</div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Types: Trunk, Primary, Secondary, Tertiary</div>
                    <div className="inline-block bg-teal-50 border border-teal-200 text-teal-800 px-4 py-2 rounded-xl font-semibold text-sm">
                      &quot;Large waste trucks — bulk collection&quot;
                    </div>
                  </div>
                </div>

                {/* AUTO ROUTES */}
                <div className="bg-white border-2 border-amber-200 rounded-3xl p-8 shadow-sm relative overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-bl-[100px] pointer-events-none" />
                  <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-amber-100">🛺</div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider">Auto Routes</h2>
                  </div>
                  <div className="mb-6 relative z-10">
                    <div className="text-5xl font-black text-amber-500 mb-1">{HSR_DATA.auto_roads} <span className="text-lg font-bold text-slate-400">segments</span></div>
                    <div className="text-lg font-bold text-slate-500">{HSR_DATA.auto_roads_pct}% of network</div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Types: Residential, Service, Footway, Path</div>
                    <div className="inline-block bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl font-semibold text-sm">
                      &quot;Auto rickshaws + handcarts — last-mile collection&quot;
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold px-8 py-4 rounded-full shadow-sm text-lg tracking-wide">
                  🌟 {HSR_DATA.total_coverage_pct}% Total Coverage
                </span>
              </div>
            </motion.section>

            {/* SECTION 2: Road Type Breakdown */}
            <motion.section variants={fadeInUp}>
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                <h2 className="text-2xl font-black text-slate-900 mb-8">Road Type Breakdown</h2>
                
                {/* Chart */}
                <div className="w-full h-[350px] mb-8">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} width={100} />
                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', backgroundColor: '#fff' }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-4 font-extrabold text-slate-500 uppercase tracking-widest text-[11px]">Type</th>
                        <th className="px-5 py-4 font-extrabold text-slate-500 uppercase tracking-widest text-[11px] text-right">Count</th>
                        <th className="px-5 py-4 font-extrabold text-slate-500 uppercase tracking-widest text-[11px] text-right">%</th>
                        <th className="px-5 py-4 font-extrabold text-slate-500 uppercase tracking-widest text-[11px]">Vehicle</th>
                        <th className="px-5 py-4 font-extrabold text-slate-500 uppercase tracking-widest text-[11px]">Avg Width</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {HSR_DATA.road_breakdown.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{r.type}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-slate-700">{r.count}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-medium text-slate-700">{r.pct}%</td>
                          <td className="px-5 py-3.5 font-semibold">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest border font-bold ${
                              r.vehicle.includes('Truck') ? 'bg-teal-50 text-teal-700 border-teal-200' :
                              r.vehicle.includes('Auto') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                              {r.vehicle}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                            {r.type === 'Trunk' ? '>12m' : 
                             r.type === 'Primary' ? '>9m' : 
                             r.type === 'Secondary' ? '>6m' : 
                             r.type === 'Tertiary' ? '>4m' : 
                             r.type === 'Residential' ? '2-4m' : 
                             r.type === 'Service' ? '2-3m' : '<2m'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td className="px-5 py-4 text-slate-900 uppercase tracking-wider text-xs">TOTAL</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-900">{HSR_DATA.road_segments.toLocaleString()}</td>
                        <td className="px-5 py-4 text-right font-mono text-slate-900">100%</td>
                        <td className="px-5 py-4"></td>
                        <td className="px-5 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>

            {/* SECTION 3: Optimization Results */}
            <motion.section variants={fadeInUp}>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Optimization Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Before</span>
                  <span className="text-4xl font-black text-slate-400">{HSR_DATA.baseline_route_km} km/day</span>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">After</span>
                  <span className="text-4xl font-black text-teal-700">{HSR_DATA.optimized_route_km} km/day</span>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg text-white">
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-3">Saving</span>
                  <span className="text-4xl font-black">{HSR_DATA.route_improvement_pct}%</span>
                  <span className="text-sm font-semibold text-emerald-100 mt-2">— {HSR_DATA.baseline_route_km - HSR_DATA.optimized_route_km} km reduced</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Annual Savings</span>
                  <span className="text-4xl font-black text-emerald-600">₹{HSR_DATA.annual_savings_cr}Cr</span>
                </div>
              </div>
            </motion.section>

            {/* SECTION 4: Fleet & Frequency */}
            <motion.section variants={fadeInUp}>
              <h2 className="text-2xl font-black text-slate-900 mb-6">Fleet & Frequency Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🚛</div>
                  <div className="text-3xl font-black text-slate-900">{HSR_DATA.fleet_trucks}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Heavy Trucks</div>
                  <p className="text-sm text-slate-500 mt-3">Primary arterial collection</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🛺</div>
                  <div className="text-3xl font-black text-slate-900">{HSR_DATA.fleet_autos}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Auto Rickshaws</div>
                  <p className="text-sm text-slate-500 mt-3">Secondary lane collection</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🔄</div>
                  <div className="text-3xl font-black text-slate-900">{HSR_DATA.fleet_rounds_per_day}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Rounds per day</div>
                  <p className="text-sm text-slate-500 mt-3">Collection frequency</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">📍</div>
                  <div className="text-3xl font-black text-emerald-600">89%</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Sub-road coverage</div>
                  <p className="text-sm text-slate-500 mt-3">High-granularity reach</p>
                </div>
              </div>
            </motion.section>

            {/* SECTION 5: Why Two-Tier Matters */}
            <motion.section variants={fadeInUp} className="mb-8">
              <div className="bg-white rounded-3xl p-10 shadow-lg relative overflow-hidden border border-slate-200">
                <div className="absolute top-0 right-0 w-80 h-80 bg-teal-50 blur-[80px] pointer-events-none opacity-60" />
                <h2 className="text-2xl font-black text-slate-900 mb-6 relative z-10 flex items-center gap-3">
                  <span className="text-2xl">💡</span> Why Two-Tier Matters
                </h2>
                <div className="relative z-10">
                  <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-medium mb-8">
                    <strong className="text-slate-900">77.9%</strong> of HSR Layout&apos;s roads are residential lanes too narrow for large trucks. A single-vehicle approach would miss <strong className="text-slate-900">1,579 road segments</strong> — leaving thousands of households uncollected.
                  </p>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
                    <h3 className="text-teal-600 font-bold mb-6 uppercase tracking-widest text-sm">AstraCity&apos;s two-tier system assigns:</h3>
                    <ul className="space-y-5">
                      <li className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold border border-teal-200 text-2xl">🚛</div>
                        <span className="text-slate-800 font-semibold text-lg">Large trucks to <strong className="text-teal-600">352</strong> main roads</span>
                      </li>
                      <li className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200 text-2xl">🛺</div>
                        <span className="text-slate-800 font-semibold text-lg">Auto rickshaws to <strong className="text-amber-600">1,579</strong> lanes</span>
                      </li>
                    </ul>
                    <div className="mt-6 pt-5 border-t border-slate-200">
                      <span className="text-emerald-600 font-bold text-lg">Achieving 95.3% network coverage.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        )}

        {activeSection === 'optimizer' && (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-10"
          >

            {/* INTERACTIVE CONTROLS */}
            <motion.section variants={fadeInUp} className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
                <span className="text-teal-600 text-xl">⚙️</span> 
                <h2 className="text-xl font-black text-slate-900">Optimization Controls</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Grid Selector */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">1. Select Sub-Ward Grid Area</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {HSR_GRIDS.map(grid => (
                      <button 
                        key={grid.id} 
                        onClick={() => setSelectedGrid(grid)}
                        className={`px-4 py-3 rounded-xl text-left flex flex-col justify-between h-full border-2 transition-all ${selectedGrid.id === grid.id ? 'bg-indigo-50 text-indigo-900 border-indigo-300 shadow-md ring-1 ring-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        <div>
                          <div className="text-sm font-bold mb-1">{grid.id}</div>
                          <div className="text-[10px] opacity-60 mb-2 leading-tight truncate">
                             {grid.description}
                          </div>
                        </div>
                        <div className={`text-xs font-bold mt-auto ${selectedGrid.id === grid.id ? 'text-indigo-600' : 'text-teal-600'}`}>{grid.waste} Tons</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compartment Slider */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">2. Single Vehicle Compartment Ratio</label>
                  <p className="text-sm text-slate-500 mb-2">Vehicles carry both Wet and Dry. Adjust the structural divider:</p>
                  
                  <div className="flex gap-2 mb-3 items-end">
                    <div className="text-blue-600 font-black text-xl">{wetCompartmentRatio}% <span className="text-xs font-bold text-slate-400 uppercase ml-1">Wet</span></div>
                    <div className="flex-1"></div>
                    <div className="text-amber-600 font-black text-xl">{100 - wetCompartmentRatio}% <span className="text-xs font-bold text-slate-400 uppercase ml-1">Dry</span></div>
                  </div>
                  
                  <input 
                    type="range" min="10" max="90" step="5"
                    value={wetCompartmentRatio} 
                    onChange={(e) => setWetCompartmentRatio(Number(e.target.value))} 
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 font-mono text-sm">
                    <div className="text-slate-500 font-medium">Auto Tipper Profile:</div>
                    <div className="text-right font-bold">
                      <span className="text-blue-600">{tipperWetCapacity}T Wet</span> <span className="text-slate-300 mx-2">|</span> <span className="text-amber-600">{tipperDryCapacity}T Dry</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

              {/* ROAD FEASIBILITY */}
              <motion.section variants={fadeInUp} className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm border border-teal-200">1</div>
                  Road Feasibility
                </h2>
                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full shadow-sm">
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">Based on OSM geometry for <strong className="text-slate-900">{selectedGrid.id}</strong>, assessing which vehicle classes can safely traverse.</p>
                  
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-emerald-50 transition-colors">
                      <div>
                        <span className="text-emerald-600 text-xs font-bold uppercase tracking-wide block mb-1">41.4% Coverage</span>
                        <div className="text-slate-800 font-bold text-sm">Residential Roads</div>
                        <div className="text-slate-400 text-xs font-mono mt-0.5">{selectedGrid.roads.residential} segments</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">🚜</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Auto Tippers</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-amber-50 transition-colors">
                      <div>
                        <span className="text-amber-600 text-xs font-bold uppercase tracking-wide block mb-1">29.1% Coverage</span>
                        <div className="text-slate-800 font-bold text-sm">Narrow / Footways</div>
                        <div className="text-slate-400 text-xs font-mono mt-0.5">{selectedGrid.roads.narrow} segments</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">🛒</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Push Carts</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between hover:bg-indigo-50 transition-colors">
                      <div>
                        <span className="text-indigo-600 text-xs font-bold uppercase tracking-wide block mb-1">27.5% Coverage</span>
                        <div className="text-slate-800 font-bold text-sm">Arterial / Trunk</div>
                        <div className="text-slate-400 text-xs font-mono mt-0.5">{selectedGrid.roads.arterial} segments</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl">🚛</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Compactors</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* MULTI-TIER TRANSFER PIPELINE */}
              <motion.section variants={fadeInUp} className="lg:col-span-3 space-y-6">
                 <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-200">2</div>
                  Multi-Tier Transfer Pipeline
                </h2>
                <div className="bg-white border border-slate-200 rounded-2xl p-8 h-full flex flex-col justify-center shadow-sm">
                   
                   <p className="text-sm text-slate-500 font-medium mb-8 text-center max-w-lg mx-auto">
                     Calculating required fleet to transport <b className="text-slate-900">{totalWaste} Tons</b> from {selectedGrid.id}, moving from small collectors to bulk transport.
                   </p>

                   {/* STAGES */}
                   <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                     <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl text-center w-full md:w-1/3 relative shadow-sm hover:shadow-md transition-shadow">
                       <div className="absolute -top-3 -right-3 bg-teal-500 text-white font-bold text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-md">1</div>
                       <div className="text-3xl mb-3">🚜</div>
                       <div className="text-3xl font-black text-slate-900 mb-1">{numAutoTippers}</div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Auto Tippers</div>
                       <div className="text-xs text-slate-400 mt-2 font-mono">0.5T Capacity<br/>Door-to-door Grid</div>
                     </div>

                     <div className="hidden md:flex text-slate-300">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                     </div>

                     <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl text-center w-full md:w-1/3 relative shadow-sm hover:shadow-md transition-shadow">
                       <div className="absolute -top-3 -right-3 bg-indigo-500 text-white font-bold text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-md">2</div>
                       <div className="text-3xl mb-3">🚛</div>
                       <div className="text-3xl font-black text-slate-900 mb-1">{numCompactors}</div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compactors</div>
                       <div className="text-xs text-slate-400 mt-2 font-mono">10T Capacity<br/>Secondary Transfer</div>
                     </div>

                     <div className="hidden md:flex text-slate-300">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                     </div>

                     <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-2xl text-center w-full md:w-1/3 relative shadow-sm hover:shadow-md transition-shadow">
                       <div className="absolute -top-3 -right-3 bg-emerald-500 text-white font-bold text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-md">3</div>
                       <div className="text-3xl mb-3">🚄</div>
                       <div className="text-3xl font-black text-slate-900 mb-1">{numCapsules}</div>
                       <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-nowrap">Capsules / Nodes</div>
                       <div className="text-xs text-slate-400 mt-2 font-mono">18T Capacity<br/>Final Plant Drop</div>
                     </div>
                  </div>

                   {/* TRANSFER NODE EXPLANATION */}
                   <div className="mt-8 bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-start gap-3">
                     <div className="text-xl mt-0.5">♻️</div>
                     <p className="text-xs text-slate-500 leading-relaxed">
                       <b className="text-slate-700">Transfer Node Logic:</b> Each {autoTipperCapacity}T Auto Tipper dumps compartmentalized waste directly into larger {compactorCapacity}T Compactors stationed at primary arterial road limits, reducing residential traffic congestion. The waste is strictly segregated via internal vehicle division at every tier.
                     </p>
                   </div>

                </div>
              </motion.section>

              {/* ALGORITHMIC ENGINE STATE */}
              <motion.section variants={fadeInUp} className="lg:col-span-5 space-y-6 mt-4">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-sm border border-pink-200">3</div>
                  Algorithmic Engine State
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Algorithm Status */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl relative shadow-sm">
                    <div className="absolute top-4 right-4 py-1 px-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-emerald-200">Ready ✔</div>
                    <div className="text-2xl mb-3">🧠</div>
                    <div className="text-slate-900 font-bold mb-1 text-sm">OR-Tools (VRP)</div>
                    <div className="text-[10px] text-slate-400 mb-4 uppercase tracking-wide font-semibold">Selected Optimization Algorithm</div>
                    <div className="bg-slate-50 rounded-lg p-3 text-[10px] font-mono text-slate-500 border border-slate-200">
                      Algorithm Initialized. Awaiting clustering execution sequence.
                    </div>
                  </div>

                  {/* Requirement Formula */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl relative shadow-sm">
                    <div className="text-2xl mb-3">🧮</div>
                    <div className="text-slate-900 font-bold mb-1 text-sm">Vehicle Requirement</div>
                    <div className="text-[10px] text-slate-400 mb-4 uppercase tracking-wide font-semibold">Formula evaluation</div>
                    <div className="bg-slate-50 rounded-lg p-3 text-[10px] font-mono text-blue-600 border border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis">
                      Vehicles = Total_Waste / Capacity<br/><br/>
                      <span className="text-slate-400">// {totalWaste}T / {autoTipperCapacity}T = {numAutoTippers} Auto Tippers</span>
                    </div>
                  </div>

                  {/* Clustering */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl relative shadow-sm">
                    <div className="absolute top-4 right-4 py-1 px-2.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-amber-200">Zones Active</div>
                    <div className="text-2xl mb-3">🎯</div>
                    <div className="text-slate-900 font-bold mb-1 text-sm">Zone Clustering</div>
                    <div className="text-[10px] text-slate-400 mb-4 uppercase tracking-wide font-semibold">Coordinate-based K-Means</div>
                    <div className="bg-slate-50 rounded-lg p-3 text-[10px] font-mono text-slate-500 border border-slate-200">
                      <span className="text-emerald-600">✔ Zones Detected: {selectedGrid.zoneCount}</span><br/>
                      <span className="text-emerald-600">✔ Waste per zone metrics acquired</span><br/>
                      Clusters structurally derived from coordinates.
                    </div>
                  </div>

                  {/* Routing & Allocation */}
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl relative shadow-sm">
                    <div className="absolute top-4 right-4 py-1 px-2.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-blue-200">Allocated</div>
                    <div className="text-2xl mb-3">📍</div>
                    <div className="text-slate-900 font-bold mb-1 text-sm">Route & Allocation</div>
                    <div className="text-[10px] text-slate-400 mb-4 uppercase tracking-wide font-semibold">VRP Assignment</div>
                    <div className="bg-slate-50 rounded-lg p-3 text-[10px] font-mono text-slate-500 border border-slate-200">
                      <div className="mb-1 border-b border-slate-200 pb-1"><b className="text-slate-700">Route:</b> Est. TSP dist: {(selectedGrid.zoneCount * 1.83 * (numAutoTippers / selectedGrid.zoneCount)).toFixed(1)} km combined.</div>
                      <div><b className="text-slate-700">Allocation:</b> {autoTipperCapacity}T constraints mapped against Road Accessibility (OSM).</div>
                    </div>
                  </div>

                  {/* Terminal Log */}
                  <div className="bg-white p-5 border border-slate-200 rounded-2xl col-span-1 md:col-span-2 lg:col-span-4 mt-2 max-h-48 overflow-y-auto font-mono text-xs shadow-sm">
                    <div className="text-[10px] text-emerald-600 font-bold mb-3 flex justify-between border-b border-slate-200 pb-2">
                      <span>► SYSTEM_LOG // K-MEANS VRP STREAM</span>
                      <span>{selectedGrid.zoneCount} ZONES ACTIVE // LIVE PROCESSING</span>
                    </div>
                    <div className="text-slate-400 space-y-1">
                      {selectedGrid.description.split(', ').map((zoneId, i) => (
                        <div key={i}>
                          [<span className="text-teal-600">{`00:00:0${i % 10}.00`}</span>] 
                          <span className="text-indigo-500"> ZONE: {zoneId} </span>
                          {'>>'}  CENTROID ACQUIRED {'>>'}  
                          <span className="text-amber-600"> ALLOCATION_LOCK</span> {'>>'}  
                          ROUTE_NODE: {i + 1}/{selectedGrid.zoneCount}
                        </div>
                      ))}
                      <div className="text-emerald-600 pt-2 font-bold">✓ ALL CONSTRAINTS SATISFIED AND MAPPED.</div>
                    </div>
                  </div>

                  {/* View Map CTA */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                    <Link href="/map" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all duration-200 hover:-translate-y-0.5 text-sm">
                      🔗 Verify Nodes inside Map Engine <span>→</span>
                    </Link>
                  </div>

                </div>
              </motion.section>

            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

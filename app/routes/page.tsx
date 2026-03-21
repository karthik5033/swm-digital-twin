'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { HSR_DATA } from '@/lib/constants';

export default function RoutesAnalysisPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const getVehicleColor = (vehicle: string) => {
    if (vehicle.includes('Large Truck') || vehicle === 'Truck') return '#0d9488'; // Teal for Trucks
    if (vehicle.includes('Auto Rickshaw')) return '#f59e0b'; // Amber for Auto
    return '#64748b'; // Gray for Walk/Cart
  };

  const chartData = HSR_DATA.road_breakdown.map(r => ({
    name: r.type,
    count: r.count,
    fill: getVehicleColor(r.vehicle)
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors">
      <div className="max-w-7xl mx-auto px-6 pt-24">
        
        {/* HEADER */}
        <header className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight"
          >
            Route Intelligence
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 dark:text-slate-400 font-medium tracking-wide"
          >
            HSR Layout · Two-Tier Collection System
          </motion.p>
        </header>

        {/* SECTION 1: Two-tier summary (2 big cards) */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* TRUCK ROUTES */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 border-2 border-teal-500 rounded-3xl p-8 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-[100px] pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center text-2xl">🚛</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">TRUCK ROUTES</h2>
              </div>
              <div className="mb-6">
                <div className="text-5xl font-black text-teal-600 dark:text-teal-400 mb-1">{HSR_DATA.truck_roads} <span className="text-lg font-bold text-slate-400">segments</span></div>
                <div className="text-lg font-bold text-slate-500">{HSR_DATA.truck_roads_pct}% of network</div>
              </div>
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Types: Trunk, Primary, Secondary, Tertiary</div>
                <div className="inline-block bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 px-4 py-2 rounded-lg font-semibold text-sm">
                  "Large waste trucks — bulk collection"
                </div>
              </div>
            </motion.div>

            {/* AUTO ROUTES */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl p-8 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-[100px] pointer-events-none" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-2xl">🛺</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wider">AUTO ROUTES</h2>
              </div>
              <div className="mb-6">
                <div className="text-5xl font-black text-amber-600 dark:text-amber-400 mb-1">{HSR_DATA.auto_roads} <span className="text-lg font-bold text-slate-400">segments</span></div>
                <div className="text-lg font-bold text-slate-500">{HSR_DATA.auto_roads_pct}% of network</div>
              </div>
              <div className="space-y-4">
                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Types: Residential, Service, Footway, Path</div>
                <div className="inline-block bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-2 rounded-lg font-semibold text-sm">
                  "Auto rickshaws + handcarts — last-mile collection"
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="mt-8 text-center">
            <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-400 font-extrabold px-6 py-3 rounded-full shadow-sm text-lg tracking-wide">
              🌟 {HSR_DATA.total_coverage_pct}% Total Coverage
            </span>
          </div>
        </section>

        {/* SECTION 2: Road Type Breakdown Table */}
        <section className="mb-16">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-8">Road Type Breakdown</h2>
            
            {/* Chart */}
            <div className="w-full h-[350px] mb-8">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} width={100} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-4 font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">Type</th>
                    <th className="px-4 py-4 font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px] text-right">Count</th>
                    <th className="px-4 py-4 font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px] text-right">%</th>
                    <th className="px-4 py-4 font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">Vehicle</th>
                    <th className="px-4 py-4 font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-widest text-[11px]">Avg Width</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {HSR_DATA.road_breakdown.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-white">{r.type}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{r.count}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{r.pct}%</td>
                      <td className="px-4 py-3 font-semibold">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest border ${
                          r.vehicle.includes('Truck') ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800' :
                          r.vehicle.includes('Auto') ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' :
                          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                          {r.vehicle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-medium whitespace-nowrap">
                        {r.type === 'Trunk' ? '>12m' : 
                         r.type === 'Primary' ? '>9m' : 
                         r.type === 'Secondary' ? '>6m' : 
                         r.type === 'Tertiary' ? '>4m' : 
                         r.type === 'Residential' ? '2-4m' : 
                         r.type === 'Service' ? '2-3m' : '<2m'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold border-t-2 border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-4 text-slate-800 dark:text-white uppercase tracking-wider text-xs">TOTAL</td>
                    <td className="px-4 py-4 text-right font-mono">{HSR_DATA.road_segments.toLocaleString()}</td>
                    <td className="px-4 py-4 text-right font-mono">100%</td>
                    <td className="px-4 py-4"></td>
                    <td className="px-4 py-4"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 3: Optimization Results */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-6">Optimization Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Before</span>
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300">{HSR_DATA.baseline_route_km} km/day</span>
            </div>
            <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">After</span>
              <span className="text-3xl font-black text-teal-700 dark:text-teal-300">{HSR_DATA.optimized_route_km} km/day</span>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg text-white">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2">Saving</span>
              <span className="text-3xl font-black">{HSR_DATA.route_improvement_pct}%</span>
              <span className="text-sm font-semibold text-emerald-100 mt-1">— {HSR_DATA.baseline_route_km - HSR_DATA.optimized_route_km} km reduced</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Annual Savings</span>
              <span className="text-3xl font-black text-emerald-600">₹{HSR_DATA.annual_savings_cr}Cr</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: Fleet & Frequency */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-6">Fleet & Frequency Analysis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-2">🚛</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{HSR_DATA.fleet_trucks}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Heavy Trucks</div>
              <p className="text-[11px] text-slate-400 mt-2">Primary arterial collection</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-2">🛺</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{HSR_DATA.fleet_autos}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auto Rickshaws</div>
              <p className="text-[11px] text-slate-400 mt-2">Secondary lane collection</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-2">🔄</div>
              <div className="text-2xl font-black text-slate-800 dark:text-white">{HSR_DATA.fleet_rounds_per_day}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rounds per day</div>
              <p className="text-[11px] text-slate-400 mt-2">Collection frequency</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <div className="text-3xl mb-2">📍</div>
              <div className="text-2xl font-black text-emerald-500">89%</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sub-road coverage</div>
              <p className="text-[11px] text-slate-400 mt-2">High-granularity reach</p>
            </div>
          </div>
        </section>

        {/* SECTION 4: Why Two-Tier Matters */}
        <section className="mb-20">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[100px] pointer-events-none" />
            <h2 className="text-2xl font-extrabold text-white mb-6 relative z-10 flex items-center gap-3">
              <span className="text-2xl">💡</span> Why Two-Tier Matters
            </h2>
            <div className="relative z-10">
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-light mb-8">
                <strong className="text-white font-semibold">77.9%</strong> of HSR Layout's roads are residential lanes too narrow for large trucks. A single-vehicle approach would miss <strong className="text-white font-semibold">1,579 road segments</strong> — leaving thousands of households uncollected.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-teal-400 font-bold mb-4 uppercase tracking-widest text-sm">AstraCity's two-tier system assigns:</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">🚛</div>
                    <span className="text-white font-medium text-lg">Large trucks to <strong className="text-teal-300">352</strong> main roads</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">🛺</div>
                    <span className="text-white font-medium text-lg">Auto rickshaws to <strong className="text-amber-300">1,579</strong> lanes</span>
                  </li>
                </ul>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="text-emerald-400 font-bold text-lg">Achieving 95.3% network coverage.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

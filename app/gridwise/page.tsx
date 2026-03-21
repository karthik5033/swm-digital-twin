'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import gridData from '@/public/data/ward_grid_zones.json';
import dynamic from 'next/dynamic';

const GridZoneMap = dynamic(() => import('@/components/map/GridZoneMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading Grid Map…</p>
      </div>
    </div>
  ),
});

type Zone = typeof gridData.zones[number];

const RISK_COLORS: Record<string, { bg: string; border: string; text: string; fill: string; dot: string }> = {
  High:   { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-600',    fill: '#e11d48', dot: 'bg-rose-500' },
  Medium: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-600',   fill: '#d97706', dot: 'bg-amber-500' },
  Low:    { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', fill: '#059669', dot: 'bg-emerald-500' },
};

export default function GridWisePage() {
  const zones = gridData.zones as Zone[];
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [sortKey, setSortKey] = useState<'waste_total_tons' | 'population' | 'total_buildings' | 'total_roads'>('waste_total_tons');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  // Summary stats
  const totalBuildings = useMemo(() => zones.reduce((a, z) => a + z.total_buildings, 0), [zones]);
  const totalPop = useMemo(() => zones.reduce((a, z) => a + z.population, 0), [zones]);
  const totalWaste = useMemo(() => zones.reduce((a, z) => a + z.waste_total_tons, 0), [zones]);

  const riskCounts = useMemo(() => ({
    High: zones.filter(z => z.risk === 'High').length,
    Medium: zones.filter(z => z.risk === 'Medium').length,
    Low: zones.filter(z => z.risk === 'Low').length,
  }), [zones]);

  // Filter & Sort
  const processed = useMemo(() => {
    let result = [...zones];
    if (filterRisk !== 'All') result = result.filter(z => z.risk === filterRisk);
    result.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return result;
  }, [zones, filterRisk, sortKey, sortDir]);



  // Building chart data for bar chart
  const buildingChartData = useMemo(() => {
    return [
      { name: 'Residential Houses', count: zones.reduce((a, z) => a + z.residential_houses, 0), fill: '#F4A460' },
      { name: 'Apartments', count: zones.reduce((a, z) => a + z.apartments, 0), fill: '#E8824A' },
      { name: 'Commercial', count: zones.reduce((a, z) => a + z.commercial, 0), fill: '#6CB4E4' },
      { name: 'Offices', count: zones.reduce((a, z) => a + z.offices, 0), fill: '#4169E1' },
      { name: 'Hospitals', count: zones.reduce((a, z) => a + z.hospitals, 0), fill: '#FF4444' },
      { name: 'Schools', count: zones.reduce((a, z) => a + z.schools, 0), fill: '#FFD700' },
    ].filter(d => d.count > 0);
  }, [zones]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.8 }}
        className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8"
      >

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: Page Header (same as OSM)                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-teal-600 tracking-tight mb-2">
              Grid-Wise Zone Analysis
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xl text-slate-500 font-light">HSR Layout · Bengaluru</span>
              <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full font-mono tracking-wider">
                {zones.length} zones mapped · 500m grid
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[120px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Total Zones</span>
              <span className="text-2xl font-black text-slate-900">{zones.length}</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[120px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Buildings</span>
              <span className="text-2xl font-black text-teal-600">{totalBuildings.toLocaleString()}</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[120px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Population</span>
              <span className="text-2xl font-black text-slate-900">{totalPop.toLocaleString()}</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[120px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Daily Waste</span>
              <span className="text-2xl font-black text-rose-600">{totalWaste.toFixed(1)}T</span>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: Two-Column Layout (LEFT Map, RIGHT Analytics)      */}
        {/* Same pattern as OSM: 55% left / 45% right                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN (55%) — Map + Context */}
          <div className="w-full lg:w-[55%] flex flex-col gap-8">

            {/* Interactive Grid Map */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">HSR Layout Grid Map</h2>
                <span className="bg-teal-50 border border-teal-200 text-teal-600 text-sm font-bold px-4 py-2 rounded-lg">
                  🗺️ Interactive · MapLibre GL
                </span>
              </div>
              
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
                <GridZoneMap
                  selectedZoneId={selectedZone?.zone_id || null}
                  onZoneClick={(zoneId) => {
                    const z = zones.find(z => z.zone_id === zoneId);
                    if (z) setSelectedZone(z);
                  }}
                />
              </div>
              
              <p className="text-slate-500 text-sm font-light text-center mt-4">
                Risk-coded grid zones with waste metrics · Click any zone for detailed popup · HSR Layout, Bengaluru
              </p>
            </motion.div>

            {/* Risk Profile Summary (replaces City View Context) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-teal-600">Risk Profile Summary</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-light mb-6">
                HSR Layout is divided into <strong className="text-slate-900">{zones.length} grid zones</strong> at 500m resolution, covering <strong className="text-slate-900">7.04 sq km</strong> with <strong className="text-slate-900">{totalPop.toLocaleString()} residents</strong>. 
                Daily waste generation: <strong className="text-teal-600">{totalWaste.toFixed(1)} tons</strong> — analyzed by risk level for optimized collection scheduling.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['High', 'Medium', 'Low'] as const).map(risk => {
                  const c = RISK_COLORS[risk];
                  const count = riskCounts[risk];
                  const zns = zones.filter(z => z.risk === risk);
                  const waste = zns.reduce((a, z) => a + z.waste_total_tons, 0);
                  return (
                    <button
                      key={risk}
                      onClick={() => setFilterRisk(filterRisk === risk ? 'All' : risk)}
                      className={`${c.bg} p-4 rounded-2xl border-2 transition-all hover:shadow-md ${filterRisk === risk ? c.border : 'border-transparent'}`}
                    >
                      <div className={`${c.text} font-black text-xl mb-1`}>{count} zones</div>
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">{risk} Risk · {waste.toFixed(1)}T/day</div>
                      {filterRisk === risk && (
                        <div className={`mt-2 text-[10px] font-bold ${c.text}`}>✕ Click to clear</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>

          </div>

          {/* RIGHT COLUMN (45%) — Analytics */}
          <div className="w-full lg:w-[45%] flex flex-col gap-8">

            {/* Building Type Breakdown (bar chart like OSM) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg flex flex-col"
            >
              <h2 className="text-xl font-bold mb-6 text-slate-900">Building Type Breakdown</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={buildingChartData} 
                    layout="vertical" 
                    margin={{ top: 5, right: 50, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      width={130}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
                      {buildingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" fill="#0f172a" fontSize={12} fontFamily="monospace" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Zone Waste Rankings Table (replaces Waste Implication) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col"
            >
              <div className="p-6 pb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Zone Waste Rankings</h2>
                <div className="flex gap-1.5">
                  {['All', 'High', 'Medium', 'Low'].map(r => (
                    <button
                      key={r}
                      onClick={() => setFilterRisk(r)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        filterRisk === r 
                          ? 'bg-teal-500 text-slate-900 shadow-sm' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto flex-grow max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-teal-50 text-teal-900 font-bold border-y border-teal-100 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 cursor-pointer hover:text-teal-700" onClick={() => handleSort('waste_total_tons')}>
                        Zone {sortKey === 'waste_total_tons' ? '' : ''}
                      </th>
                      <th className="py-3 px-4 text-right cursor-pointer hover:text-teal-700" onClick={() => handleSort('total_buildings')}>
                        Buildings {sortKey === 'total_buildings' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </th>
                      <th className="py-3 px-4 text-right cursor-pointer hover:text-teal-700" onClick={() => handleSort('population')}>
                        Pop. {sortKey === 'population' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </th>
                      <th className="py-3 px-4 text-right cursor-pointer hover:text-teal-700" onClick={() => handleSort('waste_total_tons')}>
                        Waste/Day {sortKey === 'waste_total_tons' ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </th>
                      <th className="py-3 px-4 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processed.map((z, idx) => {
                      const rc = RISK_COLORS[z.risk] || RISK_COLORS.Low;
                      const isSelected = selectedZone?.zone_id === z.zone_id;
                      return (
                        <tr 
                          key={z.zone_id}
                          onClick={() => setSelectedZone(isSelected ? null : z)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-teal-50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-teal-50/50`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900" style={{ borderLeft: isSelected ? '3px solid #0d9488' : '3px solid transparent' }}>{z.zone_id}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">{z.total_buildings}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">{z.population.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">{z.waste_total_tons.toFixed(3)}T</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${rc.bg} ${rc.border} ${rc.text}`}>
                              {z.risk}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono tracking-wide">
                Total: {totalWaste.toFixed(2)}T/day across {zones.length} zones · Rate: CPCB 0.5kg/person/day
              </div>
            </motion.div>

          </div>
        </div>



        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 4: Full-Width Spatial Insights (same as OSM)          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl"
        >
          <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b border-slate-200 pb-4">Spatial Distribution Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">🔴</span>
                <h3 className="text-lg font-bold text-rose-600">High-Risk Concentration</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                <strong className="text-slate-900">{riskCounts.High} zones</strong> generate {zones.filter(z => z.risk === 'High').reduce((a, z) => a + z.waste_total_tons, 0).toFixed(1)}T/day, accounting for {((zones.filter(z => z.risk === 'High').reduce((a, z) => a + z.waste_total_tons, 0) / totalWaste) * 100).toFixed(0)}% of total waste. These zones require daily collection routes and priority scheduling.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">🏘️</span>
                <h3 className="text-lg font-bold text-amber-500">Residential Density</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                <strong className="text-slate-900">{buildingChartData[0]?.count?.toLocaleString()} residential houses</strong> form the dominant building type across all {zones.length} zones. Door-to-door wet waste collection is the primary strategy, with auto-rickshaws as the optimal vehicle for narrow lanes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">🗄️</span>
                <h3 className="text-lg font-bold text-blue-600">DWCC Coverage</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                All <strong className="text-slate-900">{zones.length} zones</strong> are assigned across <strong className="text-slate-900">{Array.from(new Set(zones.map(z => z.assigned_dwcc))).length} DWCC centers</strong>, ensuring full coverage. Each center manages 5-7 zones with dedicated vehicle assignments for efficient dry waste collection.
              </p>
            </div>

          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 5: DWCC Assignment Summary                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm"
        >
          <h2 className="text-xl font-extrabold text-slate-900 mb-6">DWCC Assignment Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {Array.from(new Set(zones.map(z => z.assigned_dwcc))).sort().map(dwcc => {
              const assigned = zones.filter(z => z.assigned_dwcc === dwcc);
              const waste = assigned.reduce((a, z) => a + z.waste_total_tons, 0);
              return (
                <div key={dwcc} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center hover:shadow-md transition-shadow">
                  <div className="text-xs font-mono font-bold text-teal-600 mb-2">{dwcc}</div>
                  <div className="text-2xl font-black text-slate-900 mb-1">{assigned.length}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">zones</div>
                  <div className="text-xs font-semibold text-slate-500 mt-2">{waste.toFixed(1)}T/day</div>
                </div>
              );
            })}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

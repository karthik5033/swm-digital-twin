'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Image from 'next/image';

const lulcData = {
  total_area_ha: 704.24,
  source: "Sentinel-2 Multi-Spectral Imagery",
  resolution: "10m / Pixel",
  classes: {
    "Paved Roads & Infrastructure": { pct: 31.31, area: 220.49 },
    "Rooftop / Buildings": { pct: 20.94, area: 147.45, count: 760 },
    "Vegetation / Green Cover": { pct: 4.04, area: 28.45 },
    "Water Bodies": { pct: 3.16, area: 22.23 },
    "Bare Soil": { pct: 1.64, area: 11.57 },
    "Shadows (Deep Urban)": { pct: 0.42, area: 2.96 },
    "Mixed Urban Surface": { pct: 38.49, area: 271.09 }
  },
  rooftop_analysis: {
    large_commercial: 566,
    medium_apartment: 194,
    small_residential: 0
  }
};

const lulcColors: Record<string, string> = {
  "Mixed Urban Surface": "#9ca3af",
  "Paved Roads & Infrastructure": "#4b5563",
  "Rooftop / Buildings": "#ef4444",
  "Vegetation / Green Cover": "#22c55e",
  "Water Bodies": "#3b82f6",
  "Bare Soil": "#f59e0b",
  "Shadows (Deep Urban)": "#111827",
};

const chartData = [
  { name: "Mixed Surface", pct: 38.49, fill: lulcColors["Mixed Urban Surface"] },
  { name: "Paved Roads", pct: 31.31, fill: lulcColors["Paved Roads & Infrastructure"] },
  { name: "Buildings", pct: 20.94, fill: lulcColors["Rooftop / Buildings"] },
  { name: "Vegetation", pct: 4.04, fill: lulcColors["Vegetation / Green Cover"] },
  { name: "Water Bodies", pct: 3.16, fill: lulcColors["Water Bodies"] },
  { name: "Bare Soil", pct: 1.64, fill: lulcColors["Bare Soil"] },
  { name: "Urban Shadows", pct: 0.42, fill: lulcColors["Shadows (Deep Urban)"] }
].sort((a,b) => b.pct - a.pct);

const insightsTable = [
  { insight: "High Impervious Surface", detail: "Over 52% of the ward is paved or built-up, leading to high run-off rates and localized urban heat island effects.", action: "Requires intensive waste sweeping protocols." },
  { insight: "Severely Low Green Cover", detail: "Only 4.04% vegetation (11 patches) recorded, significantly below the WHO recommendation of 9 sq.m per capita.", action: "Prioritize compost application in existing parks." },
  { insight: "Building Density Profiles", detail: "Significant detection of large flat rooftops (566 commercial/industrial) versus medium apartments (194).", action: "Optimize bulk waste collection routes." },
  { insight: "Minimal Bare Soil", detail: "Only 1.64% bare soil detected, confirming HSR Layout is fully developed with minimal vacant lots for illegal dumping.", action: "Focus on preventing dumping in mixed zones." },
];

export default function LulcAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-100 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.8 }}
        className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8"
      >
        
        {/* SECTION 1: Page Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-teal-600 tracking-tight mb-2">
              LULC Satellite Analysis
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xl text-slate-500 font-light">HSR Layout · Bengaluru</span>
              <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full font-mono tracking-wider">
                {lulcData.source} · {lulcData.resolution}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Total Coverage</span>
              <span className="text-2xl font-black text-slate-900">{lulcData.total_area_ha} ha</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Impervious &amp; Built</span>
              <span className="text-2xl font-black text-red-500">52.25%</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Vegetation</span>
              <span className="text-2xl font-black text-green-500">4.04%</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Large Rooftops</span>
              <span className="text-2xl font-black text-slate-900">566</span>
            </div>
          </div>
        </header>

        {/* SECTION 2: Two column layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN (55%) */}
          <div className="w-full lg:w-[55%] flex flex-col gap-8">
            
            {/* Map Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Land Use / Land Cover (LULC) Map</h2>
                <a 
                  href="/data/lulc_dashboard.png" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-600 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  View Full Dashboard ↗
                </a>
              </div>
              
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-4 p-4 text-center">
                <Image 
                  src="/data/lulc_map.png" 
                  alt="HSR Layout LULC Map"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
              
              <p className="text-slate-500 text-sm font-light text-center">
                Algorithmically classified spatial representation using Random Forest over RGB+NIR satellite bands.
              </p>
            </motion.div>

            {/* City View Context */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-teal-600">Environmental &amp; Spectral Context</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-light mb-6">
                The LULC analysis over <strong className="text-slate-900">704.24 hectares</strong> highlights an intense urban landscape with <strong className="text-slate-900">31.3% paved roads</strong> and <strong className="text-slate-900">20.9% building footprints</strong>. The severe lack of bare land ({`1.6%`}) and natural vegetation ({`4.0%`}) shifts waste generation profiles heavily toward commercial and constructed surfaces.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-blue-500 font-black text-xl mb-1">3.16% Water</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Surface Bodies</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-900 font-black text-xl mb-1">760</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Rooftop Clusters</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-amber-500 font-black text-xl mb-1">38.49% Mixed</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Transitional Zones</div>
                </div>
              </div>
            </motion.div>
            
          </div>

          {/* RIGHT COLUMN (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col gap-8">
            
            {/* LULC Composition Chart */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg flex flex-col"
            >
              <h2 className="text-xl font-bold mb-6 text-slate-900">Surface Classification Breakdown</h2>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 13 }}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={((val: any) => [`${val ?? ''}%`, 'Coverage']) as any}
                    />
                    <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="pct" position="right" fill="#0f172a" fontSize={12} fontFamily="monospace" formatter={((val: any) => `${val}%`) as any} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Implications Table */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col"
            >
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Waste Logistics Implications</h2>
              </div>
              <div className="overflow-x-auto w-full flex-grow">
                <table className="w-full text-left text-sm h-full">
                  <thead className="bg-teal-50 text-teal-900 font-bold border-y border-teal-100">
                    <tr>
                      <th className="py-3 px-6 w-1/4">Metric</th>
                      <th className="py-3 px-6 w-1/2">Satellite Observation</th>
                      <th className="py-3 px-6 w-1/4">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insightsTable.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        <td className="py-4 px-6 text-slate-900 font-bold">{row.insight}</td>
                        <td className="py-4 px-6 text-slate-700 leading-relaxed">{row.detail}</td>
                        <td className="py-4 px-6 font-medium text-teal-700">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono tracking-wide flex justify-between">
                <span>Total Analyzed Area: 704.24 ha</span>
                <span>Algorithm: Random Forest spectral segmentation</span>
              </div>
            </motion.div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
// heloo

'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Image from 'next/image';
import { HSR_DATA } from '@/lib/constants';

const buildingData = {
  total: 9471,
  source: "OpenStreetMap",
  types: {
    "Residential (House)": 8998,
    "Residential (Apartment)": 250,
    "Commercial/Retail": 136,
    "Other/Unclassified": 42,
    "Office/IT": 39,
    "Educational": 15,
    "Religious": 10,
    "Government/Civic": 3,
    "Hospital/Medical": 2,
  },
  area_stats: {
    mean_sqm: 163.7,
    median_sqm: 114.8,
    max_sqm: 7081.5,
    total_footprint_ha: 155.21
  }
};

const mapColors: Record<string, string> = {
  "Residential (House)": "#F4A460",
  "Residential (Apartment)": "#E8824A",
  "Commercial/Retail": "#6CB4E4",
  "Office/IT": "#4169E1",
  "Educational": "#FFD700",
  "Religious": "#9370DB",
  "Government/Civic": "#20B2AA",
  "Hospital/Medical": "#FF4444",
  "Other/Unclassified": "#D3D3D3"
};

const chartData = [
  { name: "Residential House", count: 8998, fill: mapColors["Residential (House)"] },
  { name: "Residential Apt", count: 250, fill: mapColors["Residential (Apartment)"] },
  { name: "Commercial/Retail", count: 136, fill: mapColors["Commercial/Retail"] },
  { name: "Other", count: 42, fill: mapColors["Other/Unclassified"] },
  { name: "Office/IT", count: 39, fill: mapColors["Office/IT"] },
  { name: "Educational", count: 15, fill: mapColors["Educational"] },
  { name: "Religious", count: 10, fill: mapColors["Religious"] },
  { name: "Government", count: 3, fill: mapColors["Government/Civic"] },
  { name: "Hospital/Medical", count: 2, fill: mapColors["Hospital/Medical"] }
];

const wasteTable = [
  { type: "Wet/Organic Waste (BBMP)", count: "-", waste: HSR_DATA.waste_wet_kg.toLocaleString(), pct: `${HSR_DATA.waste_wet_pct}%` },
  { type: "Dry/Recyclable (CPCB)", count: "-", waste: HSR_DATA.waste_dry_kg.toLocaleString(), pct: `${HSR_DATA.waste_dry_pct}%` },
  { type: "Hazardous", count: "-", waste: HSR_DATA.waste_hazardous_kg.toLocaleString(), pct: `${HSR_DATA.waste_hazardous_pct}%` },
  { type: "Street Sweeping", count: "-", waste: HSR_DATA.waste_other_kg.toLocaleString(), pct: `${HSR_DATA.waste_other_pct}%` },
];

export default function OsmAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30 overflow-x-hidden">
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
              OSM Building Analysis
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xl text-slate-500 font-light">HSR Layout · Bengaluru</span>
              <span className="bg-slate-100 border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full font-mono tracking-wider">
                {HSR_DATA.buildings_total.toLocaleString()} buildings mapped · OpenStreetMap
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Total Buildings</span>
              <span className="text-2xl font-black text-slate-900">{HSR_DATA.buildings_total.toLocaleString()}</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Total Footprint</span>
              <span className="text-2xl font-black text-teal-600">{HSR_DATA.buildings_footprint_ha} ha</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Avg Size</span>
              <span className="text-2xl font-black text-slate-900">{HSR_DATA.buildings_avg_sqm} m²</span>
            </div>
            <div className="bg-white shadow-sm border border-slate-200 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">Categories</span>
              <span className="text-2xl font-black text-slate-900">9 Types</span>
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
                <h2 className="text-2xl font-bold text-slate-900">HSR Layout Building Map</h2>
                <a 
                  href="/data/building_map_legend.png" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-600 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  View Full Resolution ↗
                </a>
              </div>
              
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 mb-4 p-4 text-center">
                <Image 
                  src="/data/building_map_legend.png" 
                  alt="HSR Layout Building Map"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
              
              <p className="text-slate-500 text-sm font-light text-center">
                Color-coded building types derived from OpenStreetMap data · HSR Layout, Bengaluru
              </p>
            </motion.div>

            {/* City View Context */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-teal-600">City View Context</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-light mb-6">
                HSR Layout has <strong className="text-slate-900">{HSR_DATA.buildings_total.toLocaleString()} mapped buildings</strong> across <strong className="text-slate-900">{HSR_DATA.area_sq_km} sq km</strong>, housing <strong className="text-slate-900">{HSR_DATA.population.toLocaleString()} residents</strong> — calculated from Census 2011 Karnataka household sizes applied to each building type. Daily waste: <strong className="text-teal-600">{HSR_DATA.waste_display}</strong>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-amber-500 font-black text-xl mb-1">{HSR_DATA.buildings_density} /km²</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Building Density</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-teal-600 font-black text-xl mb-1">94.8% Residential</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Ward Character</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-900 font-black text-xl mb-1">{HSR_DATA.waste_daily_tons} tons</div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Daily Waste</div>
                </div>
              </div>
            </motion.div>
            
          </div>

          {/* RIGHT COLUMN (45%) */}
          <div className="w-full lg:w-[45%] flex flex-col gap-8">
            
            {/* Building Type Breakdown */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-lg flex flex-col"
            >
              <h2 className="text-xl font-bold mb-6 text-slate-900">Building Type Breakdown</h2>
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
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" fill="#0f172a" fontSize={12} fontFamily="monospace" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Waste Implication by Type */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-lg flex-1 flex flex-col"
            >
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Waste Implication by Type</h2>
              </div>
              <div className="overflow-x-auto w-full flex-grow">
                <table className="w-full text-left text-sm h-full">
                  <thead className="bg-teal-50 text-teal-900 font-bold border-y border-teal-100">
                    <tr>
                      <th className="py-3 px-6">Type</th>
                      <th className="py-3 px-6 text-right">Count</th>
                      <th className="py-3 px-6 text-right">Est. Waste / day</th>
                      <th className="py-3 px-6 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteTable.map((row, idx) => (
                      <tr 
                        key={idx} 
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                      >
                        <td className="py-4 px-6 text-slate-700">{row.type}</td>
                        <td className="py-4 px-6 text-right font-mono text-slate-700">{row.count}</td>
                        <td className="py-4 px-6 text-right font-mono text-amber-600 font-bold">{row.waste} kg</td>
                        <td className="py-4 px-6 text-right font-mono text-slate-500">{row.pct}</td>
                      </tr>
                    ))}
                    <tr className="bg-teal-600/5 border-t border-teal-600/10">
                      <td className="py-5 px-6 font-bold text-slate-900">TOTAL GENERATED</td>
                      <td className="py-5 px-6 text-right font-mono font-bold text-slate-900">-</td>
                      <td className="py-5 px-6 text-right font-mono font-bold text-teal-700">{HSR_DATA.waste_daily_kg.toLocaleString()} kg</td>
                      <td className="py-5 px-6 text-right font-mono font-bold text-slate-900">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono tracking-wide">
                Note: Overall daily waste calculation based strictly on 0.5kg / capita standard for Census 2025.
              </div>
            </motion.div>

          </div>
        </div>

        {/* SECTION 3: Full width bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-slate-900 border-b border-slate-200 pb-4">Spatial Distribution Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">🏠</span>
                <h3 className="text-lg font-bold text-teal-600">Residential Dominance</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                <strong className="text-slate-900">{HSR_DATA.buildings_residential_pct}%</strong> of HSR Layout&apos;s {HSR_DATA.buildings_total.toLocaleString()} buildings are residential — 8,998 houses and 250 apartments. This makes door-to-door collection the most efficient waste pickup strategy.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">🏪</span>
                <h3 className="text-lg font-bold text-amber-500">Commercial Corridor</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                <strong className="text-slate-900">136</strong> commercial units concentrated along 27th Main Road and Outer Ring Road generate an estimated 340 kg of waste daily — requiring dedicated commercial pickup routes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm">⚕️</span>
                <h3 className="text-lg font-bold text-blue-600">Critical Infrastructure</h3>
              </div>
              <p className="text-slate-600 font-light leading-relaxed">
                <strong className="text-slate-900">2 hospitals</strong> generate high-risk medical waste requiring specialized collection. 15 schools create daily waste spikes during term time. Both need priority scheduling in routes.
              </p>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

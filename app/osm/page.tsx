'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import Image from 'next/image';
import { HSR_DATA } from '@/lib/constants';

const buildingData = {
  total: 9483,
  source: "OpenStreetMap",
  types: {
    "Residential (House)": 8993,
    "Residential (Apartment)": 243,
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
  { name: "Residential House", count: 8993, fill: mapColors["Residential (House)"] },
  { name: "Residential Apt", count: 243, fill: mapColors["Residential (Apartment)"] },
  { name: "Commercial/Retail", count: 136, fill: mapColors["Commercial/Retail"] },
  { name: "Other", count: 42, fill: mapColors["Other/Unclassified"] },
  { name: "Office/IT", count: 39, fill: mapColors["Office/IT"] },
  { name: "Educational", count: 15, fill: mapColors["Educational"] },
  { name: "Religious", count: 10, fill: mapColors["Religious"] },
  { name: "Government", count: 3, fill: mapColors["Government/Civic"] },
  { name: "Hospital/Medical", count: 2, fill: mapColors["Hospital/Medical"] }
];

const facilities = [
  { icon: "🏥", count: 2, label: "Hospitals/Clinics", desc: "Critical waste generators · medical waste risk", type: mapColors["Hospital/Medical"] },
  { icon: "🏫", count: 15, label: "Schools/Colleges", desc: "High footfall · daily waste spikes", type: mapColors["Educational"] },
  { icon: "🏪", count: 136, label: "Commercial Units", desc: "Primary commercial waste source", type: mapColors["Commercial/Retail"] },
  { icon: "💼", count: 39, label: "Offices/IT Parks", desc: "Tech corridor · packaging waste", type: mapColors["Office/IT"] },
  { icon: "🛕", count: 10, label: "Religious Sites", desc: "Festival waste surge zones", type: mapColors["Religious"] },
  { icon: "🏛️", count: 3, label: "Government/Civic", desc: "Public service buildings", type: mapColors["Government/Civic"] }
];

const wasteTable = [
  { type: "Wet/Organic Waste", count: "-", waste: (HSR_DATA.waste_wet_tons * 1000).toLocaleString(), pct: "60%" },
  { type: "Dry/Recyclable", count: "-", waste: (HSR_DATA.waste_dry_tons * 1000).toLocaleString(), pct: "35%" },
  { type: "Hazardous/Other", count: "-", waste: (HSR_DATA.waste_other_tons * 1000).toLocaleString(), pct: "5%" },
];

export default function OsmAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans selection:bg-teal-500/30 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.8 }}
        className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8"
      >
        
        {/* SECTION 1: Page Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#00d4aa] tracking-tight mb-2">
              OSM Building Analysis
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-xl text-gray-400 font-light">HSR Layout · Bengaluru</span>
              <span className="bg-[#111827] border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full font-mono tracking-wider">
                9,483 buildings mapped · OpenStreetMap
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Buildings</span>
              <span className="text-2xl font-black text-white">9,483</span>
            </div>
            <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total Footprint</span>
              <span className="text-2xl font-black text-[#00d4aa]">155 ha</span>
            </div>
            <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Avg Size</span>
              <span className="text-2xl font-black text-white">163 m²</span>
            </div>
            <div className="bg-[#111827] border border-gray-800 px-5 py-3 rounded-2xl flex flex-col min-w-[130px]">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Categories</span>
              <span className="text-2xl font-black text-white">9 Types</span>
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
              className="bg-[#111827] border border-[#00d4aa]/30 rounded-3xl p-6 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">HSR Layout Building Map</h2>
                <a 
                  href="/data/building_map_legend.png" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-[#00d4aa]/10 hover:bg-[#00d4aa]/20 border border-[#00d4aa]/30 text-[#00d4aa] text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                >
                  View Full Resolution ↗
                </a>
              </div>
              
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/50 border border-gray-800 mb-4">
                <Image 
                  src="/data/building_map_legend.png" 
                  alt="HSR Layout Building Map"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                />
              </div>
              
              <p className="text-gray-400 text-sm font-light text-center">
                Color-coded building types derived from OpenStreetMap data · HSR Layout, Bengaluru
              </p>
            </motion.div>

            {/* City View Context */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4 text-[#00d4aa]">City View Context</h2>
              <p className="text-gray-300 text-lg leading-relaxed font-light mb-6">
                HSR Layout contains <strong className="text-white">{HSR_DATA.total_buildings.toLocaleString()} mapped structures</strong> covering <strong className="text-white">{HSR_DATA.area_sq_km} sq km ({HSR_DATA.area_hectares} hectares)</strong> — serving a projected population of <strong className="text-white">{HSR_DATA.population_2025.toLocaleString()} residents</strong>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#0a0f1e] p-4 rounded-2xl border border-gray-800">
                  <div className="text-[#f59e0b] font-black text-xl mb-1">{HSR_DATA.building_density_per_sqkm} /km²</div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Density</div>
                </div>
                <div className="bg-[#0a0f1e] p-4 rounded-2xl border border-gray-800">
                  <div className="text-[#00d4aa] font-black text-xl mb-1">60/30/10</div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Res/Com/Mix</div>
                </div>
                <div className="bg-[#0a0f1e] p-4 rounded-2xl border border-gray-800">
                  <div className="text-white font-black text-xl mb-1">{HSR_DATA.daily_waste_tons} Tons</div>
                  <div className="text-gray-500 text-xs font-bold uppercase tracking-wider">Daily Waste</div>
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
              className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl flex flex-col"
            >
              <h2 className="text-xl font-bold mb-6 text-white">Building Type Breakdown</h2>
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
                      tick={{ fill: '#9ca3af', fontSize: 13 }}
                      width={120}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid #1f2937', borderRadius: '12px', color: '#fff' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" fill="#fff" fontSize={12} fontFamily="monospace" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Key Facilities */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4 text-[#00d4aa]">Key Facilities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {facilities.map((fac, idx) => (
                  <div 
                    key={idx} 
                    className="bg-[#0a0f1e] rounded-2xl p-4 border-l-4 transition-transform hover:scale-[1.02]"
                    style={{ borderLeftColor: fac.type, borderTopColor: '#1f2937', borderRightColor: '#1f2937', borderBottomColor: '#1f2937', borderWidth: '1px 1px 1px 4px' }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{fac.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">{fac.count}</span>
                        <span className="text-gray-400 text-xs font-semibold">{fac.label}</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{fac.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Waste Implication by Type */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#111827] border border-gray-800 rounded-3xl overflow-hidden shadow-xl"
            >
              <div className="p-6 pb-4">
                <h2 className="text-xl font-bold text-white">Waste Implication by Type</h2>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#00d4aa] text-[#0a0f1e] font-bold">
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
                        className={idx % 2 === 0 ? 'bg-[#111827]' : 'bg-[#1a2234]'}
                      >
                        <td className="py-3 px-6 text-gray-300">{row.type}</td>
                        <td className="py-3 px-6 text-right font-mono text-gray-300">{row.count}</td>
                        <td className="py-3 px-6 text-right font-mono text-[#f59e0b] font-bold">{row.waste} kg</td>
                        <td className="py-3 px-6 text-right font-mono text-gray-400">{row.pct}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#00d4aa]/10 border-t border-[#00d4aa]/30">
                      <td className="py-4 px-6 font-bold text-white">TOTAL GENERATED</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">-</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-[#00d4aa]">{HSR_DATA.daily_waste_kg.toLocaleString()} kg</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-[#0a0f1e]/50 border-t border-gray-800 text-xs text-gray-500 font-mono tracking-wide">
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
          className="bg-[#111827] border border-gray-800 rounded-3xl p-8 shadow-xl mt-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-800 pb-4">Spatial Distribution Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-[#0a0f1e] p-3 rounded-xl border border-gray-800 shadow-sm">🏠</span>
                <h3 className="text-lg font-bold text-[#00d4aa]">Residential Dominance</h3>
              </div>
              <p className="text-gray-400 font-light leading-relaxed">
                <strong className="text-gray-200">94.8%</strong> of HSR Layout&apos;s 9,483 buildings are residential — 8,993 houses and 243 apartments. This makes door-to-door collection the most efficient waste pickup strategy.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-[#0a0f1e] p-3 rounded-xl border border-gray-800 shadow-sm">🏪</span>
                <h3 className="text-lg font-bold text-[#f59e0b]">Commercial Corridor</h3>
              </div>
              <p className="text-gray-400 font-light leading-relaxed">
                <strong className="text-gray-200">136</strong> commercial units concentrated along 27th Main Road and Outer Ring Road generate an estimated 340 kg of waste daily — requiring dedicated commercial pickup routes.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl bg-[#0a0f1e] p-3 rounded-xl border border-gray-800 shadow-sm">⚕️</span>
                <h3 className="text-lg font-bold text-[#4169E1]">Critical Infrastructure</h3>
              </div>
              <p className="text-gray-400 font-light leading-relaxed">
                <strong className="text-gray-200">2 hospitals</strong> generate high-risk medical waste requiring specialized collection. 15 schools create daily waste spikes during term time. Both need priority scheduling in routes.
              </p>
            </div>

          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

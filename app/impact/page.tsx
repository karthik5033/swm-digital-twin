'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";

import { motion, useSpring, useTransform } from "framer-motion";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine, ReferenceDot
} from "recharts";
import { Skeleton } from "@/components/ui/Skeleton";

// --- Icons ---
const FuelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21v-6"/><path d="M15 21v-6"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const LeafIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
const HardHatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18V15c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6v3"/><path d="M12 9V5"/><path d="M12 5C9.8 5 8 6.8 8 9"/><path d="M12 5c2.2 0 4 1.8 4 4"/><path d="M20 22v-4"/><path d="M4 22v-4"/></svg>
);

function AnimatedCounter({ value, decimals = 1, prefix = "", suffix = "" }: { value: number, decimals?: number, prefix?: string, suffix?: string }) {
  const spring = useSpring(0, { stiffness: 45, damping: 15 });
  const display = useTransform(spring, (current) => 
    `${prefix}${current.toFixed(decimals).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",")}${suffix}`
  );
  useEffect(() => { spring.set(value); }, [spring, value]);
  return <motion.span>{display}</motion.span>;
}

export default function ImpactDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const buildingTypeData = [
    { name: 'Residential', value: 70, color: '#3b82f6' },
    { name: 'Commercial', value: 20, color: '#f59e0b' },
    { name: 'Mixed Use', value: 10, color: '#8b5cf6' }
  ];

  const projectionData = Array.from({ length: 30 }, (_, i) => {
    return {
      day: `Day ${i + 1}`,
      D1: Math.min(100, 65 + (i * 0.85)),
      D2: Math.min(100, 78 + (i * 0.55)),
      D3: Math.min(100, 45 + (i * 0.3)),
    };
  });
  
  const showWarningBanner = true; 

  const dumpyardCapacityData = [
    { name: 'D1 HSR Main', fill: 65, fillHex: '#f97316' },
    { name: 'D2 Agara', fill: 78, fillHex: '#ef4444' },
    { name: 'D3 BDA Complex', fill: 45, fillHex: '#10b981' }
  ];

  const zoneWasteData = [
    { name: 'HSR Main', Organic: 8.5, Dry: 4.2, Hazardous: 1.5 },
    { name: 'BDA Complex', Organic: 8.2, Dry: 4.1, Hazardous: 1.5 },
    { name: 'Agara', Organic: 6.7, Dry: 3.3, Hazardous: 1.2 },
    { name: 'Somasundara', Organic: 5.6, Dry: 2.8, Hazardous: 1.0 },
    { name: '7th Sector', Organic: 3.2, Dry: 1.6, Hazardous: 0.6 }
  ];

  const [totalBuildings, setTotalBuildings] = useState<number | string>("9,471");
  const [dailyWaste, setDailyWaste] = useState<number | string>("19.78");
  const [dumpSites, setDumpSites] = useState<number | string>("29");
  const [routeSaving, setRouteSaving] = useState<number | string>("75.5");

  const [buildingTypes, setBuildingTypes] = useState(buildingTypeData);
  const [wasteByType, setWasteByType] = useState(zoneWasteData);
  const [zones, setZones] = useState([]);

  const [oldDistance, setOldDistance] = useState<number | string>("132.4");
  const [newDistance, setNewDistance] = useState<number | string>("32.4");
  const [savingsPercent, setSavingsPercent] = useState<number | string>("75.5");
  const [annualSavings, setAnnualSavings] = useState<number | string>("0");

  const [apiStatus, setApiStatus] = useState<"connected" | "cached" | "loading">("loading");

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setIsLoading(false), 600);

    fetch('http://localhost:8000/ward-stats')
      .then(res => res.json())
      .then(data => {
        setTotalBuildings(data.buildings.toLocaleString())
        setDailyWaste(data.daily_waste_tons)
        setDumpSites(data.dump_sites)
        setRouteSaving(data.route_saving_percent)
        setApiStatus('connected');
      })
      .catch(() => {
        setTotalBuildings("9,471")
        setDailyWaste("19.78")
        setApiStatus('cached');
      })

    fetch('http://localhost:8000/building-analysis')
      .then(res => res.json())
      .then(data => {
        // map type_summary if it's returning right structural formats in real implementation
      })
      .catch(() => console.log('Building API offline'))

    fetch('http://localhost:8000/optimize-routes')
      .then(res => res.json())
      .then(data => {
        setOldDistance(data.old_distance_km)
        setNewDistance(data.optimized_distance_km)
        setSavingsPercent(data.savings_percent)
        setAnnualSavings(data.annual_fuel_savings_inr)
      })
      .catch(() => console.log('Routes API offline'))

    return () => clearTimeout(t);
  }, []);

  const populationData = [
    { year: '2001', population: 22500, waste: 11.2 },
    { year: '2011', population: 110000, waste: 19.78 },
    { year: '2023', population: 58000, waste: 29.0 },
    { year: '2026', population: 65000, waste: 32.5 }
  ];

  const lulcData = [
    { name: 'Built-up', value: 65, color: '#e74c3c' },
    { name: 'Vegetation', value: 18, color: '#27ae60' },
    { name: 'Open Land', value: 12, color: '#f39c12' },
    { name: 'Water', value: 5, color: '#3498db' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors relative">
      <div className="fixed top-0 left-0 w-[80%] h-[600px] bg-teal-100/50 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[80%] h-[600px] bg-emerald-100/50 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* PART 3: Warning System */}
      {showWarningBanner && (
        <div className="w-full bg-red-600 text-white font-medium text-center py-3 px-4 flex items-center justify-center gap-2 shadow-md sticky top-0 z-50">
          <span>⚠️ HSR Main Zone at critical segregation — only 25% waste being segregated</span>
        </div>
      )}

      {/* Agara Lake Alert Card */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex items-start gap-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 rounded-2xl p-5 shadow-sm">
          <div className="text-3xl mt-0.5">🌊</div>
          <div className="flex-1">
            <h3 className="font-extrabold text-blue-800 dark:text-blue-300 text-base mb-1">
              ⚠️ AGARA LAKE POLLUTION RISK
            </h3>
            <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
              <strong>3 illegal dump sites detected</strong> within 500m of Agara Lake buffer zone.<br />
              Leachate contamination risk: <span className="font-black text-red-600 dark:text-red-400">HIGH</span> — 
              Plastic waste &amp; chemical runoff threatens the protected water body.<br />
              Immediate action required to prevent further contamination &amp; protect biodiversity.
            </p>
          </div>
          <span className="shrink-0 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-black px-3 py-1.5 rounded-full border border-red-300 dark:border-red-700">
            CRITICAL
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-16 mt-4">
        
        {/* SECTION 1: HSR Layout Overview Cards */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">HSR Layout Overview</h2>
            {apiStatus !== 'loading' && (
              <div className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 ${
                apiStatus === 'connected' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                {apiStatus === 'connected' ? 'Backend Connected' : 'Using Cached Data'}
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-[210px] w-full rounded-3xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Total Buildings", icon: <HardHatIcon />, value: totalBuildings, unit: "", desc: "Mapped across HSR" },
                { title: "Total Daily Waste", icon: <TrashIcon />, value: dailyWaste, unit: " tons/day", desc: "Calculated from OSM" },
                { title: "Residential Houses", icon: <ActivityIcon />, value: "8,998", unit: "", desc: "95% of total buildings" },
                { title: "Commercial & IT", icon: <LeafIcon />, value: "176", unit: "", desc: "Main bulk generators" }
              ].map((card, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                >
                  <div className="absolute -right-4 -top-4 opacity-[0.03] text-8xl group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                    {card.icon}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl">
                      {card.icon}
                    </div>
                    <h3 className="font-bold text-slate-600 dark:text-slate-300">{card.title}</h3>
                  </div>
                  <div className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
                    {card.value}<span className="text-lg text-slate-500 dark:text-slate-400 font-bold">{card.unit}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Special Building Alerts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-5 shadow-sm">
            <h4 className="font-extrabold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">🏥 Hospital Alert</h4>
            <p className="text-sm text-red-700 dark:text-red-400 font-medium">2 medical facilities in HSR Layout generating ~250 kg/day bio-medical waste. Both located in zones B2 and C1.</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 shadow-sm">
            <h4 className="font-extrabold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">📚 Schools Alert</h4>
            <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">14 educational institutions detected generating ~140 kg/day paper/dry waste. Peak waste: exam seasons.</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-3xl p-5 shadow-sm">
            <h4 className="font-extrabold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">🏪 Commercial Alert</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">~137 commercial units on main roads generating ~340 kg/day dry/plastic waste. Concentrated in zones B2 and C3.</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-5 shadow-sm">
            <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">💻 IT Office Alert</h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">39 IT offices detected generating ~780 kg/day e-waste + dry waste. Dedicated e-waste collection recommended.</p>
          </div>
        </div>

        {/* NEW SECTION: Growth Analysis & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">HSR Population vs Waste Growth (2001 - 2026)</h2>
            <div className="h-72 w-full">
              {mounted && (
                <ResponsiveContainer>
                  <LineChart data={populationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" tick={{ fill: '#64748b', fontWeight: 600 }} />
                    <YAxis yAxisId="left" tickFormatter={(val: any) => `${(val/1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val: any) => `${val}t`} tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }} 
                      contentStyle={{ borderRadius: '12px', padding: '12px', color: '#0f172a' }} 
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                    <Line yAxisId="left" name="Population" type="monotone" dataKey="population" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                    <Line yAxisId="right" name="Waste (tons/day)" type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={4} dot={{ r: 6, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* INSIGHTS COLUMN */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-rose-50 dark:from-indigo-950/30 dark:to-rose-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-6 shadow-sm flex-1">
              <h3 className="text-indigo-800 dark:text-indigo-300 font-extrabold text-lg mb-3">Growth Discrepancy Insight</h3>
              <ul className="space-y-3 text-slate-700 dark:text-slate-300 font-medium text-sm">
                <li className="flex gap-2"><span>📈</span> HSR Layout population grew <b>389%</b> since 2001.</li>
                <li className="flex gap-2"><span>🗑️</span> Waste generation grew <b>530%</b> in the same period.</li>
                <li className="flex gap-2 bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg text-rose-600 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900">⚠️ Waste grows FASTER than population.</li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-sm text-white flex-1 flex flex-col justify-center">
              <h3 className="text-emerald-400 font-extrabold text-lg mb-3">2030 Projection Alert</h3>
              <ul className="space-y-3 font-medium text-sm">
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Target Population</span>
                  <span className="font-bold">2,80,000</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Expected Waste</span>
                  <span className="font-bold text-rose-400">126 tons/day</span>
                </li>
              </ul>
              <div className="mt-4 py-2 px-3 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-center text-xs font-black uppercase tracking-widest">
                Current Infrastructure: NOT Sufficient
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* SECTION 2: Building Type Breakdown */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Building Type Breakdown</h2>
            <p className="text-sm text-slate-500 mb-6">Distribution of 45,000 structures in HSR</p>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={buildingTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {buildingTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Share']} contentStyle={{ borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontWeight: 600, fontSize: '13px' }} formatter={(value, entry: any) => <span className="text-slate-700 dark:text-slate-300">{value} ({entry.payload.value === 70 ? '31,500' : entry.payload.value === 20 ? '9,000' : '4,500'})</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* SECTION 5: Dumpyard Capacity Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Current Dumpyard Capacity</h2>
            <p className="text-sm text-slate-500 mb-6">Real-time fill percentage across locations</p>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer>
                  <BarChart data={dumpyardCapacityData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontWeight: 600 }} width={110} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(val) => [`${val}%`, 'Capacity Filled']} contentStyle={{ borderRadius: '12px' }} />
                    <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '80% Threshold', fill: '#ef4444', fontWeight: 'bold' }} />
                    <Bar dataKey="fill" radius={[0, 4, 4, 0]} barSize={24}>
                      {dumpyardCapacityData.map((e, i) => <Cell key={i} fill={e.fillHex} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>

        {/* SECTION 6: 30 Day Fill Projection */}
        <section className="mb-16">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">30 Day Fill Projection</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">D2 crosses 80% on Day 4. D1 crosses 80% on Day 18.</p>
              </div>
              <div className="h-96 w-full">
                {mounted && (
                  <ResponsiveContainer>
                    <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fill: '#64748b', fontWeight: 600 }} minTickGap={20} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} />
                      <Tooltip contentStyle={{ borderRadius: '12px' }} labelStyle={{ color: '#0f172a', fontWeight: 'bold' }} formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Fill Level']} />
                      <Legend wrapperStyle={{ fontWeight: 600 }} />
                      <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" />
                      <Line name="Main Dump (D1)" type="monotone" dataKey="D1" stroke="#f97316" strokeWidth={3} dot={false} />
                      <Line name="Agara Dump (D2)" type="monotone" dataKey="D2" stroke="#ef4444" strokeWidth={3} dot={false} />
                      <Line name="7th Sector (D3)" type="monotone" dataKey="D3" stroke="#10b981" strokeWidth={3} dot={false} />
                      <ReferenceDot x="Day 4" y={80} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} label={{ value: 'D2 Overflow', position: 'top', fill: '#ef4444', fontWeight: 'bold' }} />
                      <ReferenceDot x="Day 18" y={80} r={6} fill="#f97316" stroke="#fff" strokeWidth={2} label={{ value: 'D1 Overflow', position: 'top', fill: '#f97316', fontWeight: 'bold' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>
        </section>

        {/* SECTION 3 & 4: Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* SECTION 3: Waste Segregation Status */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">Zone Breakdown</h2>
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Buildings</th><th className="px-4 py-3">Waste/day</th><th className="px-4 py-3">Dominant Type</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {[
                  { z: "B2", b: "2,189", w: "5.1t", sp: "Residential (146 sqm avg)", s: "High", c: "bg-rose-100 text-rose-700" },
                  { z: "C3", b: "2,082", w: "4.8t", sp: "Residential (131 sqm avg)", s: "High", c: "bg-rose-100 text-rose-700" },
                  { z: "B3", b: "1,734", w: "4.0t", sp: "Residential (137 sqm avg)", s: "Medium", c: "bg-amber-100 text-amber-700" },
                  { z: "B1", b: "1,383", w: "3.2t", sp: "Residential (154 sqm avg)", s: "Medium", c: "bg-amber-100 text-amber-700" },
                  { z: "C2", b: "554", w: "1.3t", sp: "Residential (236 sqm avg)", s: "Low", c: "bg-green-100 text-green-700" },
                  { z: "C1", b: "276", w: "0.6t", sp: "Residential (263 sqm avg)", s: "Low", c: "bg-green-100 text-green-700" },
                  { z: "D4", b: "203", w: "0.5t", sp: "Mixed (398 sqm avg)", s: "Low", c: "bg-green-100 text-green-700" },
                  { z: "C4", b: "158", w: "0.4t", sp: "Residential (146 sqm avg)", s: "Low", c: "bg-green-100 text-green-700" },
                  { z: "Total", b: "9,471", w: "19.78t", sp: "City Overlap", s: "Warning", c: "bg-orange-100 text-orange-700" }
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{r.z}</td>
                    <td className="px-4 py-3">{r.b}</td>
                    <td className="px-4 py-3 font-semibold">{r.w}</td>
                    <td className="px-4 py-3">{r.sp}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${r.c}`}>{r.s}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked BarChart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">Waste Composition per Zone</h2>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer>
                  <BarChart data={zoneWasteData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
                    <Legend wrapperStyle={{ fontWeight: 600, fontSize: '13px' }} />
                    <Bar name="Organic Waste" dataKey="Organic" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                    <Bar name="Dry Waste" dataKey="Dry" stackId="a" fill="#3b82f6" />
                    <Bar name="Hazardous" dataKey="Hazardous" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4b: Open Space Risk */}
        <div className="mb-16">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">Open Space Risk Analysis</h2>
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr><th className="px-4 py-3">Location</th><th className="px-4 py-3">Area sqm</th><th className="px-4 py-3">Distance</th><th className="px-4 py-3">Risk Level</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {[
                  { l: "Agara Lake surf.", a: "5,200", d: "120m", r: "High", c: "bg-red-100 text-red-700" },
                  { l: "BDA Complex", a: "3,800", d: "85m", r: "Medium", c: "bg-amber-100 text-amber-700" },
                  { l: "HSR 27th Main", a: "2,100", d: "45m", r: "High", c: "bg-red-100 text-red-700" },
                  { l: "Sector 2 Park", a: "1,500", d: "200m", r: "Low", c: "bg-green-100 text-green-700" }
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{r.l}</td>
                    <td className="px-4 py-3">{r.a}</td>
                    <td className="px-4 py-3">{r.d}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${r.c}`}>{r.r}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: Two-Tier Collection System */}
        <section className="mb-20">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Two-Tier Collection System — HSR Layout</h2>
          
          {/* Flow Diagram */}
          <div className="w-full bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between text-center gap-4">
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-2xl border border-slate-600 mb-2">🏠</div>
               <span className="text-white font-bold text-sm">Houses</span>
             </div>
             <span className="text-teal-400 font-extrabold text-xl">→</span>
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-2xl border border-orange-500/50 mb-2">🛺</div>
               <span className="text-white font-bold text-sm">Auto (Sub Roads)</span>
             </div>
             <span className="text-teal-400 font-extrabold text-xl">→</span>
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-2xl border border-blue-500/50 mb-2">🚛</div>
               <span className="text-white font-bold text-sm">Truck Hub (Main Rd)</span>
             </div>
             <span className="text-teal-400 font-extrabold text-xl">→</span>
             <div className="flex flex-col items-center">
               <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl border border-emerald-500/50 mb-2">🏭</div>
               <span className="text-white font-bold text-sm">Processing Unit</span>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">4</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Truck Hubs</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">12</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Auto Vehicles</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-emerald-500 mb-1">89%</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sub Rds Covered</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-emerald-500 mb-1">100%</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Rds</div>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-slate-800 dark:text-white mb-1">3</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Rounds</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">Collection System Impact</h3>
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                   <th className="px-4 py-3">Metric</th>
                   <th className="px-4 py-3">Before</th>
                   <th className="px-4 py-3 text-teal-600 dark:text-teal-400 font-extrabold">After Two-Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-800 dark:text-white font-bold">Roads covered</td><td className="px-4 py-3 opacity-60">45%</td><td className="px-4 py-3 text-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">89%</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-800 dark:text-white font-bold">Collection time</td><td className="px-4 py-3 opacity-60">6 hrs</td><td className="px-4 py-3 text-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">3.5 hrs</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-800 dark:text-white font-bold">Fuel cost/day</td><td className="px-4 py-3 opacity-60">₹4,200</td><td className="px-4 py-3 text-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">₹2,100</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-800 dark:text-white font-bold">Missed pickups</td><td className="px-4 py-3 opacity-60">35%</td><td className="px-4 py-3 text-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">8%</td>
                </tr>
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                   <td className="px-4 py-3 text-slate-800 dark:text-white font-bold">Resident complaints</td><td className="px-4 py-3 opacity-60 text-rose-400">High</td><td className="px-4 py-3 text-emerald-500 font-bold bg-emerald-50/50 dark:bg-emerald-900/10">Low</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* PART 6: LULC Dashboard Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Land Use Analysis — Sentinel-2 Classification</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center">
              <h3 className="font-bold text-lg mb-2 self-start text-slate-800 dark:text-white">LULC Breakdown</h3>
              <div className="h-48 w-full mt-2">
                {mounted && (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={lulcData} innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                        {lulcData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Area']} contentStyle={{ borderRadius: '12px' }}/>
                      <Legend wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-rose-800 font-bold text-lg leading-snug">65% built-up area generates 35kg waste per 100sqm daily</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-orange-800 font-bold text-lg leading-snug">12% open land =<br/>8 potential illegal dump sites</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-blue-800 font-bold text-lg leading-snug">Agara Lake buffer zone at high contamination risk</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col justify-center shadow-sm">
                <p className="text-emerald-800 font-bold text-lg leading-snug">18% green cover helps reduce organic waste by 12%</p>
              </div>
            </div>
            
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative top-2">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr><th className="px-4 py-4">Land Type</th><th className="px-4 py-4">Area sqkm</th><th className="px-4 py-4">Waste Impact</th><th className="px-4 py-4">Dump Risk</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 font-bold flex items-center gap-2 text-slate-800 dark:text-white"><span className="block w-3 h-3 rounded-sm bg-rose-500"></span>Built-up</td><td className="px-4 py-4">8.45</td><td className="px-4 py-4 text-rose-600 font-bold">Very High</td><td className="px-4 py-4 text-amber-600 font-bold">Medium</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 font-bold flex items-center gap-2 text-slate-800 dark:text-white"><span className="block w-3 h-3 rounded-sm bg-orange-500"></span>Open Land</td><td className="px-4 py-4">1.56</td><td className="px-4 py-4 text-slate-500 font-bold">Low</td><td className="px-4 py-4 text-red-600 font-bold">Very High</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 font-bold flex items-center gap-2 text-slate-800 dark:text-white"><span className="block w-3 h-3 rounded-sm bg-emerald-600"></span>Vegetation</td><td className="px-4 py-4">2.34</td><td className="px-4 py-4 text-slate-500 font-bold">Low</td><td className="px-4 py-4 text-red-500 font-bold">High</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-4 font-bold flex items-center gap-2 text-slate-800 dark:text-white"><span className="block w-3 h-3 rounded-sm bg-blue-500"></span>Water</td><td className="px-4 py-4">0.65</td><td className="px-4 py-4 text-slate-400 font-bold">None</td><td className="px-4 py-4 text-red-500 font-bold">High</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

export default function ForecastPage() {
  const BASE_WET = 11.86; // 60% of 19.78T
  const BASE_DRY = 5.94;  // 30% of 19.78T
  const BASE_HAZ = 1.98;  // 10% of 19.78T

  const CAP_WET = 14.5;
  const CAP_DRY = 7.5;

  // Initialize 10 days with basic static calendar defaults
  const initialDays = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(2026, 2, 22 + i); // Starts March 22
    const dayStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return {
      date: dayStr,
      day: dayName,
      is_weekend: isWeekend,
      temp: 28,
      rain: 0,
      is_festival: i === 4 || i === 8 ? true : false, // presets for Demo but fully editable
    };
  });

  const [days, setDays] = useState(initialDays);

  // --- THE FORMULA PREDICTION MODEL ---
  const calculateDay = (d: typeof initialDays[0]) => {
    let mult_wet = 1.0;
    let mult_dry = 1.0;

    // 1. M_weather
    if (d.rain > 20) mult_wet += 0.25;
    else if (d.rain > 0) mult_wet += 0.08;

    if (d.temp > 34) mult_dry += 0.12;

    // 2. M_festival
    if (d.is_festival) {
      mult_wet += 0.35;
      mult_dry += 0.15;
    }

    // 3. M_day (Weekend)
    if (d.is_weekend) {
      mult_wet += 0.10;
      mult_dry += 0.05;
    }

    const wet = Number((BASE_WET * mult_wet).toFixed(2));
    const dry = Number((BASE_DRY * mult_dry).toFixed(2));
    const total = Number((wet + dry + BASE_HAZ).toFixed(2));

    return {
      ...d,
      predicted_wet: wet,
      predicted_dry: dry,
      total_waste: total,
      is_overflow: wet > CAP_WET || dry > CAP_DRY
    };
  };

  const computedData = days.map(calculateDay);

  const updateDay = (index: number, field: string, value: any) => {
    setDays((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-teal-500/5 to-transparent pointer-none" />

      {/* Header */}
      <div className="relative border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <Link href="/impact" className="text-teal-600 font-bold hover:text-teal-500 transition-opacity">← Back</Link>
          <div className="w-[1px] h-4 bg-slate-300" />
          <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
            🔮 10-Day Formula Simulator
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pt-10 pb-20 relative grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 📋 INPUT DASHBOARD (2/3 Grid) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Live Parameter Inputs</h2>
            <p className="text-sm text-slate-500 mb-6">Modify temperature, rain, or festival flags to satisfy the math formula live.</p>

            <table className="w-full text-left text-sm text-slate-500">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 font-bold text-slate-700">Date</th>
                  <th className="px-3 py-3 font-bold text-slate-700">Temp (°C)</th>
                  <th className="px-3 py-3 font-bold text-slate-700">Rain (mm)</th>
                  <th className="px-3 py-3 font-bold text-slate-700">Festival</th>
                  <th className="px-3 py-3 font-bold text-slate-700">Total Waste</th>
                  <th className="px-3 py-3 font-bold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {computedData.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-3 text-slate-900 font-bold text-xs">
                      {d.date.split('-')[2]} Mar ({d.day})
                      {d.is_weekend && <span className="block text-sky-600 text-[10px] uppercase tracking-wider mt-0.5 font-black">Weekend</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <input type="range" min={20} max={40} step={1} value={d.temp} onChange={(e) => updateDay(i, 'temp', Number(e.target.value))} className="w-16 accent-teal-600" />
                        <span className="text-xs text-slate-600 font-bold w-5">{d.temp}°</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <input type="range" min={0} max={50} step={1} value={d.rain} onChange={(e) => updateDay(i, 'rain', Number(e.target.value))} className="w-16 accent-emerald-600" />
                        <span className="text-xs text-slate-600 font-bold w-5">{d.rain}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input type="checkbox" checked={d.is_festival} onChange={(e) => updateDay(i, 'is_festival', e.target.checked)} className="accent-orange-500 w-4 h-4 cursor-pointer" />
                    </td>
                    <td className="px-3 py-3 font-black text-slate-900 text-xs">
                      {d.total_waste} T
                    </td>
                    <td className="px-3 py-3 text-[10px] font-bold">
                      {d.is_overflow ? <span className="text-red-600 uppercase">OVERLOAD</span> : <span className="text-emerald-600">Normal</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📈 REAL-TIME CHART RENDERING (1/3 Grid) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Live Formula Graph</h2>
            <p className="text-[11px] text-slate-500 mb-6 font-medium">Redraws instantly with parameter slider triggers.</p>
            
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <AreaChart data={computedData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', fontWeight: 'bold' }} />
                  
                  <ReferenceLine y={CAP_WET} stroke="#ef4444" strokeDasharray="4 4" />
                  <ReferenceLine y={CAP_DRY} stroke="#f59e0b" strokeDasharray="4 4" />
                  
                  <Area name="Wet" type="monotone" dataKey="predicted_wet" stroke="#10b981" fill="#10b981" fillOpacity={0.1} stackId="1" />
                  <Area name="Dry" type="monotone" dataKey="predicted_dry" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Formula Multipliers Used</h3>
            <ul className="text-xs space-y-2 text-slate-500 font-medium">
              <li className="flex justify-between"><span>Baseline Waste TPD:</span> <span className="text-slate-900 font-bold">19.78 Tons</span></li>
              <li className="border-t border-slate-100 my-2"></li>
              <li className="flex justify-between"><span>Rain &gt; 20mm:</span> <span className="text-emerald-600 font-bold">+25% Wet</span></li>
              <li className="flex justify-between"><span>Rain &gt; 0mm:</span> <span className="text-emerald-600 font-bold">+8% Wet</span></li>
              <li className="flex justify-between"><span>Temp &gt; 34°C:</span> <span className="text-blue-600 font-bold">+12% Dry</span></li>
              <li className="flex justify-between"><span>Festival day:</span> <span className="text-orange-500 font-bold">+35% Wet, +15% Dry</span></li>
              <li className="flex justify-between"><span>Weekend:</span> <span className="text-sky-600 font-bold">+10% Wet, +5% Dry</span></li>
            </ul>
          </div>
        </div>

      </main>
    </div>
  );
}

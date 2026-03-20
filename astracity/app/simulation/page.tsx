"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, useSpring, useTransform } from 'framer-motion';

import wardScores from '../../data/ward_scores.json';
import simLookupRaw from '../../data/simulation_lookup.json';

const simLookup = simLookupRaw as Record<string, {
  wasteGenerated: number;
  dumpsPredicted: number;
  landfillInflow: number;
  methaneProjection: number;
}>;

// --- Icons ---
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const WasteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const MapIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
);
const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
);
const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

// --- Animated Number Component ---
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (current) => 
    Number.isInteger(value) ? Math.round(current).toLocaleString() : current.toFixed(1)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export default function SimulationPanel() {
  // --- State for Controls ---
  const [ward, setWard] = useState('All');
  const [popGrowth, setPopGrowth] = useState(0);
  const [rainfall, setRainfall] = useState('Normal');
  const [festival, setFestival] = useState('None');
  const [transferRelocated, setTransferRelocated] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // --- Metrics State ---
  const baselineValues = simLookup['pop_0_rain_normal_festival_none'];
  const [metrics, setMetrics] = useState({ ...baselineValues });

  const handleRunSimulation = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const rainKey = rainfall.toLowerCase();
      const festKey = festival === 'Ganesh Chaturthi' ? 'ganesh' : festival.toLowerCase();
      
      const popValues = [0, 10, 20, 30, 50];
      const closestPop = popValues.reduce((a, b) => Math.abs(b - popGrowth) < Math.abs(a - popGrowth) ? b : a);
      
      const key = `pop_${closestPop}_rain_${rainKey}_festival_${festKey}`;
      
      setMetrics(simLookup[key] || baselineValues);
      setIsRunning(false);
    }, 800);
  };

  const renderMetricDiff = (current: number, base: number) => {
    const diffNum = current - base;
    if (diffNum === 0) return <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">0% vs normal</span>;
    const percentChange = ((diffNum / base) * 100).toFixed(1);
    const isIncrease = diffNum > 0;
    
    // For all 4 metrics, an increase is bad (red) and decrease is good (emerald)
    const colorClass = isIncrease 
      ? 'text-rose-600 bg-rose-50 border border-rose-200' 
      : 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${colorClass}`}>
        {isIncrease ? '+' : ''}{percentChange}% vs normal
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-[35%] bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col gap-8 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-teal-50 text-teal-600 p-2.5 rounded-lg border border-teal-100">
              <SettingsIcon />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800">Scenario Controls</h2>
          </div>

          <div className="flex flex-col gap-6">
            {/* Ward Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ward Focus</label>
              <select 
                value={ward} 
                onChange={(e) => setWard(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow appearance-none cursor-pointer hover:border-slate-300"
              >
                <option value="All">All Bengaluru</option>
                {wardScores.map((w: any) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Population Growth Slider */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Population Growth</label>
                <span className="text-teal-700 font-extrabold bg-teal-50 px-2 py-1 rounded-md text-sm border border-teal-100">+{popGrowth}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="50" step="10" 
                value={popGrowth}
                onChange={(e) => setPopGrowth(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-500 transition-all"
              />
              <div className="flex justify-between text-xs text-slate-400 font-bold">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Rainfall Toggle Group */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rainfall</label>
              <div className="flex w-full bg-slate-50 rounded-xl p-1.5 border border-slate-200 shadow-inner">
                {['Low', 'Normal', 'Heavy'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setRainfall(level)}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${rainfall === level ? 'bg-white text-teal-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Festival Spike Group */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Festival Spike</label>
              <div className="flex w-full bg-slate-50 rounded-xl p-1.5 border border-slate-200 shadow-inner">
                {['None', 'Diwali', 'Ganesh Chaturthi'].map((fest) => (
                  <button
                    key={fest}
                    onClick={() => setFestival(fest)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${festival === fest ? 'bg-white text-teal-700 shadow border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                  >
                    {fest}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer Station Toggle */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-slate-700">Transfer Station</span>
                <span className="text-xs font-medium text-slate-400">{transferRelocated ? 'Relocated out of city limits' : 'Active near city center'}</span>
              </div>
              <button 
                onClick={() => setTransferRelocated(!transferRelocated)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${transferRelocated ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${transferRelocated ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/50 flex items-center justify-center gap-3 py-4 rounded-xl text-white font-extrabold tracking-wide transition-all shadow-[0_8px_20px_rgba(13,148,136,0.25)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.35)] mt-2 hover:-translate-y-0.5"
          >
            {isRunning ? (
              <>
                <SpinnerIcon />
                <span>Simulating AI Model...</span>
              </>
            ) : (
              'Run Simulation'
            )}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[65%] flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full">
            
            {/* Card 1: Waste Generated */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex justify-between items-start mb-6 z-10">
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-100 text-teal-600 shadow-sm">
                  <WasteIcon />
                </div>
                {renderMetricDiff(metrics.wasteGenerated, baselineValues.wasteGenerated)}
              </div>
              <div className="z-10">
                <h3 className="text-slate-500 text-sm font-extrabold uppercase tracking-wider mb-2">Waste Generated</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter">
                    <AnimatedNumber value={metrics.wasteGenerated} />
                  </span>
                  <span className="text-slate-400 text-sm font-bold">tons/day</span>
                </div>
              </div>
            </div>

            {/* Card 2: Dumps Predicted */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex justify-between items-start mb-6 z-10">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-500 shadow-sm">
                  <MapIcon />
                </div>
                {renderMetricDiff(metrics.dumpsPredicted, baselineValues.dumpsPredicted)}
              </div>
              <div className="z-10">
                <h3 className="text-slate-500 text-sm font-extrabold uppercase tracking-wider mb-2">Dumps Predicted</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter">
                    <AnimatedNumber value={metrics.dumpsPredicted} />
                  </span>
                  <span className="text-slate-400 text-sm font-bold">sites</span>
                </div>
              </div>
            </div>

            {/* Card 3: Landfill Inflow */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-50 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex justify-between items-start mb-6 z-10">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-500 shadow-sm">
                  <TrendingDownIcon />
                </div>
                {renderMetricDiff(metrics.landfillInflow, baselineValues.landfillInflow)}
              </div>
              <div className="z-10">
                <h3 className="text-slate-500 text-sm font-extrabold uppercase tracking-wider mb-2">Landfill Inflow (%)</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter">
                    <AnimatedNumber value={metrics.landfillInflow} />
                  </span>
                  <span className="text-slate-400 text-sm font-bold">tons/day</span>
                </div>
                <div className="text-xs text-slate-500 mt-2 font-bold bg-slate-50 inline-block px-2 py-1 rounded-md border border-slate-200">
                  {((metrics.landfillInflow / metrics.wasteGenerated) * 100).toFixed(1)}% of total generated waste
                </div>
              </div>
            </div>

            {/* Card 4: Methane Projection */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-50 blur-[80px] rounded-full pointer-events-none" />
              <div className="flex justify-between items-start mb-6 z-10">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-500 shadow-sm">
                  <CloudIcon />
                </div>
                {renderMetricDiff(metrics.methaneProjection, baselineValues.methaneProjection)}
              </div>
              <div className="z-10">
                <h3 className="text-slate-500 text-sm font-extrabold uppercase tracking-wider mb-2">Methane Projection</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl lg:text-5xl font-black text-slate-800 tracking-tighter">
                    <AnimatedNumber value={metrics.methaneProjection} />
                  </span>
                  <span className="text-slate-400 text-sm font-bold">tons/month</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 mt-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm mb-4 sm:mb-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 mr-3 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              Simulation based on ward-level behavioral AI model
            </p>
            <Link 
              href="/impact" 
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow w-full sm:w-auto justify-center"
            >
              <span>View Economic Impact</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

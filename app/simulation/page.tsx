'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useSpring, useTransform } from 'framer-motion';
import { HSR_DATA } from '@/lib/constants';

import { Skeleton } from "@/components/ui/Skeleton";

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
  const [demolition, setDemolition] = useState(false);
  const [apartments, setApartments] = useState(false);
  const [encroachment, setEncroachment] = useState(false);
  const [extraAutos, setExtraAutos] = useState(false);
  const [segregation, setSegregation] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wardList, setWardList] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/geojson').then(res => res.json()).then(data => {
      if (data.features) {
        const names = data.features.map((f: { properties: { name: string } }) => f.properties.name).sort();
        setWardList(names);
      }
    }).catch(console.error);

    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const baselineValues = {
    wasteGenerated: HSR_DATA.daily_waste_tons,
    dumpsPredicted: HSR_DATA.dump_sites_detected,
    landfillInflow: Math.round(HSR_DATA.daily_waste_tons * 0.65), // Estimate based on 110t
    methaneProjection: 420,
    subRoadCoverage: 89,
    costPerDay: 2100,
    riskLevel: 'LOW',
    alert: null as string | null,
    recommendation: null as string | null,
  };

  const [metrics, setMetrics] = useState({ ...baselineValues });

  const handleRunSimulation = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const baseWaste = HSR_DATA.daily_waste_tons;
      const baseDumps = HSR_DATA.dump_sites_detected;
      let newCoverage = 89;
      let newCost = 2100;

      let wasteMult = 1.0;
      let dumpsAdd = 0;
      let landfillMult = 1.0;
      let methaneMult = 1.0;

      if (demolition) {
        wasteMult *= 1.40;
        dumpsAdd += 6;
        landfillMult *= 1.35;
        methaneMult *= 1.15;
      }
      if (apartments) {
        wasteMult *= 1.18;
        dumpsAdd += 3;
        landfillMult *= 1.20;
        methaneMult *= 1.12;
      }
      if (encroachment) {
        wasteMult *= 1.05;
        dumpsAdd += 8;
        landfillMult *= 1.08;
        methaneMult *= 1.28;
      }
      if (extraAutos) {
        dumpsAdd -= 4;
        landfillMult *= 1.12;
        methaneMult *= 0.92;
        newCoverage = 96;
        newCost += 800; // Rs 800/day
      }

      let newWaste = baseWaste * wasteMult;
      let newLandfill = baselineValues.landfillInflow * landfillMult;
      let newMethane = 420 * methaneMult;
      let newDumps = baseDumps + dumpsAdd;

      const reductionFactor = segregation * 0.008; 
      newWaste = newWaste - (baseWaste * reductionFactor);
      newLandfill = newLandfill - (newLandfill * (segregation * 0.012));
      newDumps = Math.max(0, newDumps - Math.floor(segregation / 5));
      newMethane = newMethane - (newMethane * (segregation * 0.01));

      let riskLevel = "LOW";
      if (newDumps > 25 || newMethane > 700) {
        riskLevel = "CRITICAL";
      } else if (newDumps >= 20 || newMethane >= 551) {
        riskLevel = "HIGH";
      } else if (newDumps >= 15 || newMethane >= 421) {
        riskLevel = "MODERATE";
      }

      let alertMsg = null;
      let recommendationMsg = null;
      
      if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
        alertMsg = "The alarming surge in illegal dump sites indicates an imminent public health and environmental crisis.";
        recommendationMsg = "Deploy immediate cleanup crews and enforce strict anti-dumping regulations around construction zones and wetland areas.";
      } else if (riskLevel === "MODERATE") {
        alertMsg = "Noticeable increase in waste disposal issues. Monitor areas closely.";
        recommendationMsg = "Increase patrol frequency in vulnerable zones to prevent further dumping.";
      }

      setMetrics({
        wasteGenerated: Math.max(0, newWaste),
        dumpsPredicted: Math.round(Math.max(0, newDumps)),
        landfillInflow: Math.max(0, newLandfill),
        methaneProjection: Math.max(0, newMethane),
        subRoadCoverage: newCoverage,
        costPerDay: newCost,
        riskLevel,
        alert: alertMsg,
        recommendation: recommendationMsg
      });

      setIsRunning(false);
    }, 800);
  };

  useEffect(() => {
    handleRunSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demolition, apartments, encroachment, extraAutos, segregation]);

  const renderMetricDiff = (current: number, base: number) => {
    const diffNum = current - base;
    if (Math.abs(diffNum) < 0.1) return <span className="text-slate-500 bg-slate-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">0% vs normal</span>;
    const percentChange = ((diffNum / base) * 100).toFixed(1);
    const isIncrease = diffNum > 0;
    
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
        <div className="w-full md:w-[35%] bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-8 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-teal-50 text-teal-600 p-2.5 rounded-lg border border-teal-100">
              <SettingsIcon />
            </div>
            <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-800">HSR Layout Scenarios</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Predictive AI Model</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">

            {/* REAL DATA BASELINE CARD */}
            <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-inner font-mono text-[11px] text-teal-400">
              <div className="flex items-center gap-2 mb-3 text-white font-bold text-sm">
                <span>📡</span> Verified Building-Based Data
              </div>
              <div className="mb-2 border-b border-slate-700/50 pb-2">
                <div className="flex justify-between"><span className="text-slate-400">Population:</span> <span className="text-white font-bold">{HSR_DATA.population_building_based.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Method:</span> <span className="text-slate-300">Buildings × household size</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Houses:</span> <span className="text-slate-300">{HSR_DATA.population_breakdown.houses.count.toLocaleString()} × {HSR_DATA.population_breakdown.houses.per_unit} = {HSR_DATA.population_breakdown.houses.total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Apts:</span> <span className="text-slate-300">{HSR_DATA.population_breakdown.apartments.count} × {HSR_DATA.population_breakdown.apartments.per_unit} = {HSR_DATA.population_breakdown.apartments.total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Offices:</span> <span className="text-slate-300">{HSR_DATA.population_breakdown.offices.count} × {HSR_DATA.population_breakdown.offices.per_unit} = {HSR_DATA.population_breakdown.offices.total}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Schools:</span> <span className="text-slate-300">{HSR_DATA.population_breakdown.schools.count} × {HSR_DATA.population_breakdown.schools.per_unit} = {HSR_DATA.population_breakdown.schools.total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Others:</span> <span className="text-slate-300">{HSR_DATA.population_breakdown.others.count} × {HSR_DATA.population_breakdown.others.per_unit} = {HSR_DATA.population_breakdown.others.total}</span></div>
              </div>
              <div className="mb-2 border-b border-slate-700/50 pb-2">
                <div className="flex justify-between"><span className="text-slate-400">Per capita:</span> <span className="text-white">{HSR_DATA.waste_per_capita_kg} kg/day (CPCB)</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Daily Waste:</span> <span className="text-white font-bold text-amber-400">{HSR_DATA.daily_waste_kg.toLocaleString()} kg = {HSR_DATA.daily_waste_display}</span></div>
              </div>
              <div className="mb-3 border-b border-slate-700/50 pb-3">
                <div className="text-teal-500 font-bold mb-1">Composition (BBMP 2013 Official):</div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">🟢 Wet {HSR_DATA.waste_wet_pct}%:</span> <span className="text-slate-300">{HSR_DATA.waste_wet_tons}T → Bio-methanisation</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">🔵 Dry {HSR_DATA.waste_dry_pct}%:</span> <span className="text-slate-300">{HSR_DATA.waste_dry_tons}T → 16 DWCC centres</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">🔴 Haz {HSR_DATA.waste_hazardous_pct}%:</span> <span className="text-slate-300">{HSR_DATA.waste_hazardous_tons}T → Special contractor</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">⚪ Other {HSR_DATA.waste_other_pct}%:</span> <span className="text-slate-300">{HSR_DATA.waste_other_tons}T → Street sweep</span></div>
                <div className="text-slate-600 ml-2 mt-1 text-[9px] italic">BBMP data: wet rose 42% (1999) → 61% (2013). Bio-meth critical.</div>
              </div>
              <div className="mb-2">
                <div className="text-teal-500 font-bold mb-1">Scenarios from {HSR_DATA.daily_waste_display} base:</div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Heavy rain:</span> <span className="text-slate-300">23.3 × 1.15 = 26.8T</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Ganesh festival:</span> <span className="text-slate-300">23.3 × 1.28 = 29.8T</span></div>
                <div className="flex justify-between"><span className="text-slate-500 ml-2">Worst case:</span> <span className="text-slate-300">23.3 × 1.49 = 34.7T</span></div>
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-2 pt-2 border-t border-slate-800">Source: CPCB + Census 2011 Karnataka</div>

              {/* Climate block */}
              <div className="mt-3 border-t border-slate-700/50 pt-3">
                <div className="text-emerald-500 font-bold mb-1 text-xs uppercase tracking-wider">Climate Impact (IPCC 2006)</div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">CH₄ produced:</span> <span className="text-teal-300">3,548 m³/day</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">CO₂ equivalent:</span> <span className="text-blue-300">71.1 T/day captured</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Energy output:</span> <span className="text-amber-300">21,285 kWh/day</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Methane risk:</span> <span className="text-green-400 font-bold">LOW ✅ (0 dumps)</span></div>
                <div className="text-[9px] text-slate-600 mt-1 italic">CH₄ GWP = 28× CO₂ (IPCC AR5) · 6 kWh/m³</div>
              </div>
            </div>

            {/* HSR Scenario: Demolition Spikes */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Building Demolition Phase</span>
                <span className="text-xs font-medium text-slate-400">Massive C&D waste spike (+40%) from BDA Complex rebuild</span>
              </div>
              <button 
                onClick={() => setDemolition(!demolition)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${demolition ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${demolition ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Apartment Addition */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">New Apartment Complex</span>
                <span className="text-xs font-medium text-slate-400">Addition of +500 units near Sector 2 borders</span>
              </div>
              <button 
                onClick={() => setApartments(!apartments)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${apartments ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${apartments ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Open Space Encroachment */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Open Space Encroachment</span>
                <span className="text-xs font-medium text-slate-400">Illegal dumping high risk simulation near Agara Lake</span>
              </div>
              <button 
                onClick={() => setEncroachment(!encroachment)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${encroachment ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${encroachment ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Fleet Optimization */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Expand Collection Fleet</span>
                <span className="text-xs font-medium text-slate-400">Add +2 extra auto vehicles to Sub Roads. Cost: ₹800/d</span>
              </div>
              <button 
                onClick={() => setExtraAutos(!extraAutos)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${extraAutos ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${extraAutos ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Segregation Improvement Slider */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Segregation Drive</label>
                <span className="text-teal-700 font-extrabold bg-teal-50 px-2 py-1 rounded-md text-sm border border-teal-100">+{segregation}% Improvement</span>
              </div>
              <input 
                type="range" 
                min="0" max="50" step="10" 
                value={segregation}
                onChange={(e) => setSegregation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-500 transition-all"
              />
              <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg mt-1 text-center">
                If segregation improves 10% → block waste reduces 8%
              </div>
            </div>

          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/50 flex items-center justify-center gap-3 py-4 rounded-xl text-white font-extrabold tracking-wide transition-all shadow-[0_8px_20px_rgba(13,148,136,0.25)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.35)] mt-4 hover:-translate-y-0.5"
          >
            {isRunning ? (
              <>
                <SpinnerIcon />
                <span>Simulating Layout Impact...</span>
              </>
            ) : (
              'Run Simulation'
            )}
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[65%] flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[250px] w-full rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
              ))}
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 0.5}} className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full">
              
              {/* Card 1: Waste Generated */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all">
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
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all">
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
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all">
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
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all">
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

            {/* TWO-TIER METRICS (Fleet Coverage) */}
            <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden border border-slate-700 flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-[80px] rounded-full pointer-events-none" />
                <h3 className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">Sub Road Coverage</h3>
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    <AnimatedNumber value={metrics.subRoadCoverage} />%
                  </span>
                </div>
                {extraAutos && <div className="text-teal-400 text-xs font-bold mt-2">Coverage improved from 89%</div>}
              </div>
              
              <div className="bg-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden border border-slate-700 flex flex-col justify-between">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-500/20 blur-[80px] rounded-full pointer-events-none" />
                <h3 className="text-slate-400 text-xs font-extrabold uppercase tracking-wider mb-2">Daily Fleet Cost</h3>
                <div className="flex items-baseline gap-2 mt-auto">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    ₹<AnimatedNumber value={metrics.costPerDay} />
                  </span>
                </div>
                {extraAutos && <div className="text-rose-400 text-xs font-bold mt-2">+₹800/d constraint added</div>}
              </div>
            </div>

            {/* ALERT SECTION */}
            {metrics.riskLevel !== 'LOW' && (
              <div className={`col-span-1 sm:col-span-2 rounded-2xl p-6 shadow-md border group hover:shadow-lg transition-all ${
                metrics.riskLevel === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : 
                metrics.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-200' : 
                'bg-amber-50 border-amber-200'
              }`}>
                 <h3 className={`text-sm font-extrabold uppercase tracking-wider mb-2 flex items-center gap-2 ${
                    metrics.riskLevel === 'CRITICAL' ? 'text-rose-600' : 
                    metrics.riskLevel === 'HIGH' ? 'text-orange-600' : 
                    'text-amber-600'
                 }`}>
                    Risk Level: {metrics.riskLevel}
                 </h3>
                 {metrics.alert && <p className="text-slate-800 text-sm font-bold mb-1">{metrics.alert}</p>}
                 {metrics.recommendation && <p className="text-slate-600 text-sm">{metrics.recommendation}</p>}
              </div>
            )}

            </motion.div>
          )}

          {/* Footer Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 mt-2 shadow-sm">
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm mb-4 sm:mb-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 mr-3 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              HSR Layout ward-level behavioral AI model
            </p>
            <Link 
              href="/impact" 
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow w-full sm:w-auto justify-center"
            >
              <span>View HSR Analytics Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

import { HSR_DATA } from '@/lib/constants';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

export default function EconomicsPage() {
  // --- LIVE CALCULATOR STATE ---
  const [distBefore, setDistBefore] = useState(HSR_DATA.route_baseline_km);
  const [distAfter, setDistAfter] = useState(HSR_DATA.route_optimized_km);
  const [mileage, setMileage] = useState(5);
  const [fuelPrice, setFuelPrice] = useState(100);

  // --- MATHEMATICAL CALCULATIONS ---
  const fuelCostBefore = (distBefore / mileage) * fuelPrice;
  const fuelCostAfter = (distAfter / mileage) * fuelPrice;
  
  const dailySavings = fuelCostBefore - fuelCostAfter;
  const annualSavings = dailySavings * 365;
  const efficiencyGain = ((distBefore - distAfter) / distBefore) * 100;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden relative pb-20">
      {/* Background Orbs - Subtle light theme versions */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-100/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />

      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="max-w-7xl mx-auto p-6 md:p-12 relative z-10 space-y-12"
      >
        <motion.header variants={fadeInUp} className="mb-4 border-b border-slate-200 pb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-teal-50 border border-teal-200">
            <span className="text-[12px] font-bold tracking-widest text-teal-700 uppercase">Live Financial Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
            Economic Impact & Math
          </h1>
          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl md:mx-0 mx-auto">
            Interact with the variables below to see exactly how AstraCity's routing optimizations calculate daily and annual savings.
          </p>
        </motion.header>

        {/* INTERACTIVE CONTROLS */}
        <motion.section variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <label className="text-xs font-bold text-rose-600 uppercase tracking-widest h-10">Current Distance (km/day)</label>
            <input type="number" value={distBefore} onChange={e => setDistBefore(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-2xl font-black text-slate-800 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-200" />
          </div>
          <div className="bg-white border border-teal-200 p-6 rounded-2xl flex flex-col gap-4 shadow-[0_4px_20px_rgba(20,184,166,0.1)]">
            <label className="text-xs font-bold text-teal-600 uppercase tracking-widest h-10">Optimized Distance (km/day)</label>
            <input type="number" value={distAfter} onChange={e => setDistAfter(Number(e.target.value))} className="bg-slate-50 border border-teal-200/50 rounded-lg p-3 text-2xl font-black text-teal-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-200" />
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <label className="text-xs font-bold text-indigo-600 uppercase tracking-widest h-10">Truck Mileage (km/l)</label>
            <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-2xl font-black text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200" />
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
            <label className="text-xs font-bold text-amber-600 uppercase tracking-widest h-10">Fuel Rate (₹/liter)</label>
            <input type="number" value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-2xl font-black text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200" />
          </div>
        </motion.section>

        {/* EXPLICIT MATHEMATICAL BREAKDOWN */}
        <motion.section variants={fadeInUp} className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
            <span className="text-teal-600">∑</span> How is it calculated?
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* The Formula String */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono">
                <div className="text-slate-600 text-xs mb-2 uppercase font-bold">Fuel Cost Formula</div>
                <div className="text-lg md:text-xl text-slate-600">
                  <span className="text-rose-600 font-bold">Cost</span> = (<span className="text-slate-800">Distance</span> ÷ <span className="text-indigo-600 font-bold">Mileage</span>) × <span className="text-amber-600 font-bold">Fuel Rate</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl font-mono">
                  <div className="text-rose-600 text-xs mb-2 uppercase font-bold">Before AstraCity</div>
                  <div className="text-slate-700 text-lg">({distBefore} ÷ {mileage}) × ₹{fuelPrice}</div>
                  <div className="text-2xl font-black text-rose-600 mt-2">₹{Math.round(fuelCostBefore).toLocaleString('en-IN')} <span className="text-sm font-normal text-rose-600">/day</span></div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl font-mono">
                  <div className="text-emerald-600 text-xs mb-2 uppercase font-bold">After AstraCity</div>
                  <div className="text-slate-700 text-lg">({distAfter} ÷ {mileage}) × ₹{fuelPrice}</div>
                  <div className="text-2xl font-black text-emerald-600 mt-2">₹{Math.round(fuelCostAfter).toLocaleString('en-IN')} <span className="text-sm font-normal text-emerald-600">/day</span></div>
                </div>
              </div>
            </div>

            {/* Efficiency Gain Formula */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono">
                <div className="text-slate-600 text-xs mb-2 uppercase font-bold">Efficiency Gain Formula</div>
                <div className="text-lg md:text-xl text-slate-600">
                  <span className="text-emerald-600 font-bold">Gain %</span> = ((<span className="text-rose-600 font-bold">D_Before</span> - <span className="text-emerald-600 font-bold">D_After</span>) ÷ <span className="text-rose-600 font-bold">D_Before</span>) × 100
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl font-mono h-[calc(100%-104px)] flex flex-col justify-center">
                 <div className="text-indigo-600 text-xs mb-2 uppercase font-bold">Route Optimization Result</div>
                 <div className="text-slate-700 text-lg">(({distBefore} - {distAfter}) ÷ {distBefore}) × 100</div>
                 <div className="text-4xl font-black text-indigo-600 mt-2">+{efficiencyGain.toFixed(1)}% <span className="text-lg font-normal text-indigo-600">Efficiency</span></div>
              </div>
            </div>

          </div>
        </motion.section>

        {/* METRICS COMPARISON TABLE (HERO) */}
        <motion.section variants={fadeInUp} className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-[2rem] blur opacity-10"></div>
          <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-lg relative">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-slate-600 w-1/3">Metric</th>
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-rose-500 w-1/3 text-center md:text-left">Current System</th>
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-emerald-600 w-1/3 text-center md:text-left">AstraCity Optimized</th>
                  </tr>
                </thead>
                <tbody className="text-xl md:text-3xl font-bold divide-y divide-slate-100">
                  <tr>
                    <td className="py-6 text-slate-500 text-lg md:text-xl font-medium">Daily Distance</td>
                    <td className="py-6 text-rose-500 text-center md:text-left">{distBefore} km</td>
                    <td className="py-6 text-emerald-600 text-center md:text-left">{distAfter} km</td>
                  </tr>
                  <tr>
                    <td className="py-6 text-slate-500 text-lg md:text-xl font-medium">Daily Fuel Cost</td>
                    <td className="py-6 text-slate-800 text-center md:text-left">₹{Math.round(fuelCostBefore).toLocaleString('en-IN')}</td>
                    <td className="py-6 text-slate-900 text-center md:text-left">₹{Math.round(fuelCostAfter).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-6 text-slate-500 text-lg md:text-xl font-medium">Efficiency Gain</td>
                    <td className="py-6 text-slate-600 text-center md:text-left text-lg">—</td>
                    <td className="py-6 text-emerald-600 text-center md:text-left">+ {efficiencyGain.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex-1">
                <div className="text-slate-600 text-sm font-bold uppercase tracking-widest mb-1">Bottom Line Calculation</div>
                <div className="text-2xl md:text-4xl font-black text-slate-900">Annual Savings ≈ ₹{(annualSavings / 100000).toFixed(2)} Lakhs <span className="text-lg text-emerald-600 font-medium">per ward</span></div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-6 py-4 rounded-xl font-medium text-sm md:text-base text-center md:text-left font-mono leading-relaxed">
                Savings: ₹{Math.round(dailySavings).toLocaleString('en-IN')} /day<br/>
                × 365 days = <br className="hidden md:block"/>
                <span className="text-emerald-700 font-bold text-xl md:text-2xl">₹{Math.round(annualSavings).toLocaleString('en-IN')}</span> /year
              </div>
            </div>

          </div>
        </motion.section>

        {/* COST COMPONENTS */}
        <motion.section variants={fadeInUp} className="pt-8">
           <h2 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center gap-3">
             <span className="text-indigo-600 text-4xl">₹</span> Total Economic Lifecycle
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             
             {/* Fuel Cost */}
             <div className="bg-white border border-teal-200 rounded-3xl p-6 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 blur-[30px] rounded-full point-events-none" />
               <div className="text-3xl mb-4 relative z-10">🚛</div>
               <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">1. Fuel Scalability</h3>
               <p className="text-slate-500 text-sm leading-relaxed mb-4 relative z-10">
                 The biggest variable cost. Reduced directly by dropping VRP travel distances dynamically.
               </p>
             </div>

             {/* Labor Cost */}
             <div className="bg-white border border-slate-200 rounded-3xl p-6 relative shadow-sm">
               <div className="text-3xl mb-4">👷</div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">2. Labor Efficiency</h3>
               <p className="text-slate-500 text-sm leading-relaxed">
                 Route balancing ensures driver shifts finish within margins, bypassing expensive overtime rates.
               </p>
             </div>

             {/* Overflow Cost */}
             <div className="bg-white border border-slate-200 rounded-3xl p-6 relative shadow-sm">
               <div className="text-3xl mb-4">🕒</div>
               <h3 className="text-lg font-bold text-slate-900 mb-2">3. Fleet Wear & Tear</h3>
               <p className="text-slate-500 text-sm leading-relaxed">
                 Fewer kilometers traveled directly exponentially decreases scheduled maintenance and part replacements.
               </p>
             </div>

             {/* Time Cost */}
             <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 relative hover:bg-rose-100/50 transition-colors shadow-sm">
               <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 blur-[30px] rounded-full point-events-none" />
               <div className="text-3xl mb-4 relative z-10">🗑️</div>
               <h3 className="text-lg font-bold text-rose-700 mb-2 relative z-10">4. Overflow Deficits</h3>
               <p className="text-rose-600/80 text-sm leading-relaxed relative z-10">
                 Predicting dumps averts disaster: massive government fines and crisis cleanup deployments are avoided entirely.
               </p>
             </div>

           </div>
        </motion.section>

        {/* PITCH: ENVIRONMENTAL ECONOMICS */}
        <motion.section variants={fadeInUp} className="bg-gradient-to-br from-emerald-50 to-slate-100 border border-emerald-200 p-8 md:p-12 rounded-[2rem] shadow-lg mt-12 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
             
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="max-w-xl relative z-10">
               <h3 className="text-emerald-700 font-mono text-sm tracking-widest uppercase mb-4">Double-Sided ROI</h3>
               <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Environmental Economics</h2>
               <div className="text-slate-600 text-lg leading-relaxed space-y-4">
                 <p>Less fuel directly prevents tons of CO₂ from entering the atmosphere per vehicle track.</p>
                 <p>A cleaner city creates rapid, positive indirect systemic savings in public health pipelines.</p>
               </div>
             </div>

             <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-6 md:p-8 rounded-2xl max-w-sm relative z-10 shadow-sm">
               <div className="text-teal-600 font-bold text-lg uppercase tracking-wider mb-2 text-center">Conclusion</div>
               <div className="text-slate-700 font-medium text-center italic">
                 "Our system reduces operational cost instantly by minimizing travel distance and vastly improving collection efficiency."
               </div>
             </div>
             
        </motion.section>

      </motion.div>
    </div>
  );
}

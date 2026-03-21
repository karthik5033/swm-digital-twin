'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function EconomicsPage() {
  // --- LIVE CALCULATOR STATE ---
  const [distBefore, setDistBefore] = useState(100);
  const [distAfter, setDistAfter] = useState(75);
  const [mileage, setMileage] = useState(5);
  const [fuelPrice, setFuelPrice] = useState(100);

  // --- MATHEMATICAL CALCULATIONS ---
  const fuelCostBefore = (distBefore / mileage) * fuelPrice;
  const fuelCostAfter = (distAfter / mileage) * fuelPrice;
  
  const dailySavings = fuelCostBefore - fuelCostAfter;
  const annualSavings = dailySavings * 365;
  const efficiencyGain = ((distBefore - distAfter) / distBefore) * 100;

  return (
    <div className="min-h-screen bg-[#050914] text-white font-sans overflow-x-hidden relative pb-20">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="max-w-7xl mx-auto p-6 md:p-12 relative z-10 space-y-12"
      >
        <motion.header variants={fadeInUp} className="mb-4 border-b border-white/10 pb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[12px] font-bold tracking-widest text-emerald-400 uppercase">Live Financial Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 tracking-tighter mb-4">
            Economic Impact & Math
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-3xl md:mx-0 mx-auto">
            Interact with the variables below to see exactly how AstraCity's routing optimizations calculate daily and annual savings.
          </p>
        </motion.header>

        {/* INTERACTIVE CONTROLS */}
        <motion.section variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
            <label className="text-sm font-bold text-rose-400 uppercase tracking-wider h-10">Current Distance (km/day)</label>
            <input type="number" value={distBefore} onChange={e => setDistBefore(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded-lg p-3 text-2xl font-black text-white focus:outline-none focus:border-rose-500" />
          </div>
          <div className="bg-[#0a0f1e]/80 border border-emerald-500/30 p-6 rounded-2xl flex flex-col gap-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <label className="text-sm font-bold text-emerald-400 uppercase tracking-wider h-10">Optimized Distance (km/day)</label>
            <input type="number" value={distAfter} onChange={e => setDistAfter(Number(e.target.value))} className="bg-black/50 border border-emerald-500/50 rounded-lg p-3 text-2xl font-black text-emerald-400 focus:outline-none focus:border-emerald-400" />
          </div>
          <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
            <label className="text-sm font-bold text-indigo-400 uppercase tracking-wider h-10">Truck Mileage (km/l)</label>
            <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded-lg p-3 text-2xl font-black text-white focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-2xl flex flex-col gap-4">
            <label className="text-sm font-bold text-amber-400 uppercase tracking-wider h-10">Fuel Rate (₹/liter)</label>
            <input type="number" value={fuelPrice} onChange={e => setFuelPrice(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded-lg p-3 text-2xl font-black text-white focus:outline-none focus:border-amber-500" />
          </div>
        </motion.section>

        {/* EXPLICIT MATHEMATICAL BREAKDOWN */}
        <motion.section variants={fadeInUp} className="bg-black/40 border border-white/10 p-8 rounded-[2rem]">
          <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
            <span className="text-teal-400">∑</span> How is it calculated?
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* The Formula String */}
            <div className="space-y-6">
              <div className="bg-[#0a0f1e] p-6 rounded-xl border border-white/5 font-mono">
                <div className="text-gray-500 text-xs mb-2 uppercase">Fuel Cost Formula</div>
                <div className="text-lg md:text-xl text-gray-300">
                  <span className="text-rose-400">Cost</span> = (<span className="text-white">Distance</span> ÷ <span className="text-indigo-400">Mileage</span>) × <span className="text-amber-400">Fuel Rate</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-xl font-mono">
                  <div className="text-rose-400 text-xs mb-2 uppercase">Before AstraCity</div>
                  <div className="text-white text-lg">({distBefore} ÷ {mileage}) × ₹{fuelPrice}</div>
                  <div className="text-2xl font-black text-rose-300 mt-2">₹{Math.round(fuelCostBefore).toLocaleString('en-IN')} <span className="text-sm font-normal">/day</span></div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl font-mono">
                  <div className="text-emerald-400 text-xs mb-2 uppercase">After AstraCity</div>
                  <div className="text-white text-lg">({distAfter} ÷ {mileage}) × ₹{fuelPrice}</div>
                  <div className="text-2xl font-black text-emerald-300 mt-2">₹{Math.round(fuelCostAfter).toLocaleString('en-IN')} <span className="text-sm font-normal">/day</span></div>
                </div>
              </div>
            </div>

            {/* Efficiency Gain Formula */}
            <div className="space-y-6">
              <div className="bg-[#0a0f1e] p-6 rounded-xl border border-white/5 font-mono">
                <div className="text-gray-500 text-xs mb-2 uppercase">Efficiency Gain Formula</div>
                <div className="text-lg md:text-xl text-gray-300">
                  <span className="text-emerald-400">Gain %</span> = ((<span className="text-rose-400">D_Before</span> - <span className="text-emerald-400">D_After</span>) ÷ <span className="text-rose-400">D_Before</span>) × 100
                </div>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-xl font-mono h-[calc(100%-104px)] flex flex-col justify-center">
                 <div className="text-indigo-400 text-xs mb-2 uppercase">Route Optimization Result</div>
                 <div className="text-white text-lg">(({distBefore} - {distAfter}) ÷ {distBefore}) × 100</div>
                 <div className="text-4xl font-black text-indigo-300 mt-2">+{efficiencyGain.toFixed(1)}% <span className="text-lg font-normal text-indigo-200">Efficiency</span></div>
              </div>
            </div>

          </div>
        </motion.section>

        {/* METRICS COMPARISON TABLE (HERO) */}
        <motion.section variants={fadeInUp} className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-[2rem] blur opacity-20"></div>
          <div className="bg-[#0a0f1e]/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-12 shadow-2xl relative">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-gray-500 w-1/3">Metric</th>
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-rose-400 w-1/3 text-center md:text-left">Current System</th>
                    <th className="py-4 text-xs font-bold uppercase tracking-widest text-emerald-400 w-1/3 text-center md:text-left">AstraCity Optimized</th>
                  </tr>
                </thead>
                <tbody className="text-xl md:text-3xl font-bold divide-y divide-white/5">
                  <tr>
                    <td className="py-6 text-gray-400 text-lg md:text-xl font-medium">Daily Distance</td>
                    <td className="py-6 text-rose-300 text-center md:text-left">{distBefore} km</td>
                    <td className="py-6 text-emerald-300 text-center md:text-left">{distAfter} km</td>
                  </tr>
                  <tr>
                    <td className="py-6 text-gray-400 text-lg md:text-xl font-medium">Daily Fuel Cost</td>
                    <td className="py-6 text-gray-300 text-center md:text-left">₹{Math.round(fuelCostBefore).toLocaleString('en-IN')}</td>
                    <td className="py-6 text-white text-center md:text-left">₹{Math.round(fuelCostAfter).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="py-6 text-gray-400 text-lg md:text-xl font-medium">Efficiency Gain</td>
                    <td className="py-6 text-gray-500 text-center md:text-left text-lg">—</td>
                    <td className="py-6 text-emerald-400 text-center md:text-left">+ {efficiencyGain.toFixed(1)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex-1">
                <div className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-1">Bottom Line Calculation</div>
                <div className="text-2xl md:text-4xl font-black text-white">Annual Savings ≈ ₹{(annualSavings / 100000).toFixed(2)} Lakhs <span className="text-lg text-emerald-400 font-medium">per ward</span></div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 px-6 py-4 rounded-xl font-medium text-sm md:text-base text-center md:text-left font-mono leading-relaxed">
                Savings: ₹{Math.round(dailySavings).toLocaleString('en-IN')} /day<br/>
                × 365 days = <br className="hidden md:block"/>
                <span className="text-emerald-400 font-bold text-xl md:text-2xl">₹{Math.round(annualSavings).toLocaleString('en-IN')}</span> /year
              </div>
            </div>

          </div>
        </motion.section>

        {/* COST COMPONENTS */}
        <motion.section variants={fadeInUp} className="pt-8">
           <h2 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
             <span className="text-indigo-400 text-4xl">₹</span> Total Economic Lifecycle
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             
             {/* Fuel Cost */}
             <div className="bg-white/5 border border-teal-500/30 rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-[30px] rounded-full point-events-none" />
               <div className="text-3xl mb-4 relative z-10">🚛</div>
               <h3 className="text-lg font-bold text-white mb-2 relative z-10">1. Fuel Scalability</h3>
               <p className="text-gray-400 text-sm leading-relaxed mb-4 relative z-10">
                 The biggest variable cost. Reduced directly by dropping VRP travel distances dynamically.
               </p>
             </div>

             {/* Labor Cost */}
             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
               <div className="text-3xl mb-4">👷</div>
               <h3 className="text-lg font-bold text-white mb-2">2. Labor Efficiency</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Route balancing ensures driver shifts finish within margins, bypassing expensive overtime rates.
               </p>
             </div>

             {/* Overflow Cost */}
             <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative">
               <div className="text-3xl mb-4">🕒</div>
               <h3 className="text-lg font-bold text-white mb-2">3. Fleet Wear & Tear</h3>
               <p className="text-gray-400 text-sm leading-relaxed">
                 Fewer kilometers traveled directly exponentially decreases scheduled maintenance and part replacements.
               </p>
             </div>

             {/* Time Cost */}
             <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 relative hover:bg-rose-500/10 transition-colors">
               <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-[30px] rounded-full point-events-none" />
               <div className="text-3xl mb-4 relative z-10">🗑️</div>
               <h3 className="text-lg font-bold text-rose-300 mb-2 relative z-10">4. Overflow Deficits</h3>
               <p className="text-gray-400 text-sm leading-relaxed relative z-10">
                 Predicting dumps averts disaster: massive government fines and crisis cleanup deployments are avoided entirely.
               </p>
             </div>

           </div>
        </motion.section>

        {/* PITCH: ENVIRONMENTAL ECONOMICS */}
        <motion.section variants={fadeInUp} className="bg-gradient-to-br from-[#064e3b] to-[#0f172a] border border-emerald-500/30 p-8 md:p-12 rounded-[2rem] shadow-xl mt-12 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
             
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
             
             <div className="max-w-xl relative z-10">
               <h3 className="text-emerald-400 font-mono text-sm tracking-widest uppercase mb-4">Double-Sided ROI</h3>
               <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Environmental Economics</h2>
               <div className="text-gray-300 text-lg leading-relaxed space-y-4">
                 <p>Less fuel directly prevents tons of CO₂ from entering the atmosphere per vehicle track.</p>
                 <p>A cleaner city creates rapid, positive indirect systemic savings in public health pipelines.</p>
               </div>
             </div>

             <div className="bg-black/40 border border-white/10 p-6 md:p-8 rounded-2xl max-w-sm relative z-10">
               <div className="text-teal-400 font-bold text-lg uppercase tracking-wider mb-2 text-center">Conclusion</div>
               <div className="text-white font-medium text-center italic">
                 "Our system reduces operational cost instantly by minimizing travel distance and vastly improving collection efficiency."
               </div>
             </div>
             
        </motion.section>

      </motion.div>
    </div>
  );
}

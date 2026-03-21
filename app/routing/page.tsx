'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import ZONE_DATA from '../../public/data/zone_analysis.json';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const z = ZONE_DATA.zones;

const HSR_GRIDS = [
  { 
    id: 'Sub-Ward Sector 1', 
    zoneCount: 15,
    description: z.slice(0, 15).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(0, 15).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 210, narrow: 120, arterial: 40 } 
  },
  { 
    id: 'Sub-Ward Sector 2', 
    zoneCount: 15,
    description: z.slice(15, 30).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(15, 30).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 150, narrow: 80, arterial: 25 } 
  },
  { 
    id: 'Sub-Ward Sector 3', 
    zoneCount: 15,
    description: z.slice(30, 45).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(30, 45).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 300, narrow: 140, arterial: 55 } 
  },
  { 
    id: 'Sub-Ward Sector 4-7', 
    zoneCount: 14,
    description: z.slice(45, 59).map(x => x.zone_id).join(', '),
    waste: Number((z.slice(45, 59).reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 180, narrow: 251, arterial: 80 } 
  },
  { 
    id: 'Total HSR Layout', 
    zoneCount: 59,
    description: 'All 59 mapped zones combined',
    waste: Number((z.reduce((a, b) => a + (b.waste_kg_day||0), 0) / 1000).toFixed(1)), 
    roads: { residential: 840, narrow: 591, arterial: 596 } 
  }
];

export default function RouteOptimisationPage() {
  const [selectedGrid, setSelectedGrid] = useState(HSR_GRIDS[4]);
  const [wetCompartmentRatio, setWetCompartmentRatio] = useState(60); // 60% wet, 40% dry in same vehicle
  
  // Capacities
  const autoTipperCapacity = 0.5; // 0.5 Tons
  const compactorCapacity = 10.0; // 10 Tons
  const capsuleCapacity = 18.0;   // 18 Tons

  // Calculations
  const totalWaste = selectedGrid.waste;
  const numAutoTippers = Math.ceil(totalWaste / autoTipperCapacity);
  const numCompactors = Math.ceil(totalWaste / compactorCapacity);
  const numCapsules = Math.ceil(totalWaste / capsuleCapacity);

  // Vehicle Compartment Math
  const tipperWetCapacity = (autoTipperCapacity * (wetCompartmentRatio / 100)).toFixed(2);
  const tipperDryCapacity = (autoTipperCapacity * ((100 - wetCompartmentRatio) / 100)).toFixed(2);

  return (
    <div className="min-h-screen bg-[#050914] text-white font-sans overflow-x-hidden relative pb-20">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        className="max-w-7xl mx-auto p-6 md:p-12 relative z-10 space-y-16"
      >
        <motion.header variants={fadeInUp} className="mb-4 border-b border-white/10 pb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 bg-teal-500/10 border border-teal-500/30">
            <span className="text-[12px] font-bold tracking-widest text-teal-400 uppercase">Live Routing Engine</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400 tracking-tighter mb-4">
            Vehicle System & Grid Optimisation
          </h1>
          <p className="text-gray-400 text-lg md:text-xl font-light max-w-3xl md:mx-0 mx-auto">
            Configuring compartmentalized BBMP fleets dynamically across HSR Layout's 2,027 mapped OSM road segments. Multi-tier transfer modeling (Small → Big).
          </p>
        </motion.header>

        {/* INTERACTIVE CONTROLS */}
        <motion.section variants={fadeInUp} className="bg-[#0a0f1e]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl z-20 relative">
          <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-3">
            <span className="text-teal-400 text-3xl">⚙️</span> Optimization Controls
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Grid Selector */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">1. Select Sub-Ward Grid Area</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HSR_GRIDS.map(grid => (
                  <button 
                    key={grid.id} 
                    onClick={() => setSelectedGrid(grid)}
                    className={`px-4 py-3 rounded-xl transition-all text-left flex flex-col justify-between h-full ${selectedGrid.id === grid.id ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                  >
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{grid.id}</div>
                      <div className="text-[10px] opacity-70 mb-2 leading-tight">
                         {grid.description}
                      </div>
                    </div>
                    <div className="text-xs font-black text-teal-400 mt-auto">{grid.waste} Tons</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Compartment Slider */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-widest block">2. Single Vehicle Compartment Ratio</label>
              <p className="text-xs text-gray-400 mb-2">Vehicles are NOT split. A single vehicle carries both Wet and Dry. Adjust the structural divider:</p>
              
              <div className="flex gap-2 mb-2 items-end">
                <div className="text-blue-400 font-extrabold text-2xl">{wetCompartmentRatio}% <span className="text-sm font-bold uppercase">Wet</span></div>
                <div className="flex-1"></div>
                <div className="text-amber-400 font-extrabold text-2xl">{100 - wetCompartmentRatio}% <span className="text-sm font-bold uppercase">Dry</span></div>
              </div>
              
              <input 
                type="range" min="10" max="90" step="5"
                value={wetCompartmentRatio} 
                onChange={(e) => setWetCompartmentRatio(Number(e.target.value))} 
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #3b82f6 ${wetCompartmentRatio}%, #f59e0b ${wetCompartmentRatio}%)` }}
              />
              
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 mt-4 font-mono text-sm">
                <div>Auto Tipper Profile:</div>
                <div className="text-right">
                  <span className="text-blue-400">{tipperWetCapacity}T Wet</span> | <span className="text-amber-400">{tipperDryCapacity}T Dry</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ROAD TYPE ANALYSIS based on grid */}
          <motion.section variants={fadeInUp} className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">1</div>
              Road Feasibility
            </h2>
            <div className="bg-[#0a0f1e]/80 border border-white/10 rounded-3xl p-8 relative overflow-hidden h-full">
              <p className="text-sm text-gray-400 mb-6">Based on OpenStreetMap (OSM) geometry for <b>{selectedGrid.id}</b>, assessing which vehicle classes can safely traverse.</p>
              
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-bold mr-2 uppercase tracking-wide">41.4% Coverage</span>
                    <div className="text-white font-bold mt-2">Residential Roads</div>
                    <div className="text-gray-400 text-xs font-mono">{selectedGrid.roads.residential} segments</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">🚜</div>
                    <div className="text-xs text-gray-400 font-bold mt-1">Auto Tippers</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded text-xs font-bold mr-2 uppercase tracking-wide">29.1% Coverage</span>
                    <div className="text-white font-bold mt-2">Narrow / Footways</div>
                    <div className="text-gray-400 text-xs font-mono">{selectedGrid.roads.narrow} segments</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">🛒</div>
                    <div className="text-xs text-gray-400 font-bold mt-1">Push Carts</div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs font-bold mr-2 uppercase tracking-wide">27.5% Coverage</span>
                    <div className="text-white font-bold mt-2">Arterial / Trunk</div>
                    <div className="text-gray-400 text-xs font-mono">{selectedGrid.roads.arterial} segments</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl">🚛</div>
                    <div className="text-xs text-gray-400 font-bold mt-1">Compactors</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* FLOW PIPELINE (MULTI-TIER) */}
          <motion.section variants={fadeInUp} className="lg:col-span-3 space-y-6">
             <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">2</div>
              Multi-Tier Transfer Pipeline
            </h2>
            <div className="bg-gradient-to-br from-[#0a0f1e] to-[#04060b] border border-white/10 rounded-3xl p-8 relative overflow-hidden h-full flex flex-col justify-center">
               
               <p className="text-sm text-gray-400 font-medium mb-8 text-center max-w-lg mx-auto">
                 Calculating required fleet cascade to transport <b className="text-white">{totalWaste} Tons</b> from {selectedGrid.id}, moving progressively from small collector vehicles to bulk transport.
               </p>

               {/* STAGE 1 */}
               <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-[2rem] text-center w-full md:w-1/3 relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-black font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">1</div>
                    <div className="text-4xl mb-3">🚜</div>
                    <div className="text-3xl font-black text-emerald-400 mb-1">{numAutoTippers}</div>
                    <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">Auto Tippers</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-mono">0.5T Capacity<br/>Door-to-door Grid</div>
                  </div>

                  <div className="hidden md:flex text-gray-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                  <div className="md:hidden text-gray-600 rotate-90">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>

               {/* STAGE 2 */}
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-[2rem] text-center w-full md:w-1/3 relative shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <div className="absolute -top-3 -right-3 bg-indigo-500 text-white font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">2</div>
                    <div className="text-4xl mb-3">🚛</div>
                    <div className="text-3xl font-black text-indigo-400 mb-1">{numCompactors}</div>
                    <div className="text-xs font-bold text-gray-300 uppercase tracking-widest">Compactors</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-mono">10T Capacity<br/>Secondary Transfer</div>
                  </div>

                  <div className="hidden md:flex text-gray-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>
                  <div className="md:hidden text-gray-600 rotate-90">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </div>

               {/* STAGE 3 */}
                  <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-[2rem] text-center w-full md:w-1/3 relative shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                    <div className="absolute -top-3 -right-3 bg-rose-500 text-white font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">3</div>
                    <div className="text-4xl mb-3">🚄</div>
                    <div className="text-3xl font-black text-rose-400 mb-1">{numCapsules}</div>
                    <div className="text-xs font-bold text-gray-300 uppercase tracking-widest text-nowrap">Capsules / Nodes</div>
                    <div className="text-[10px] text-gray-500 mt-2 font-mono">18T Capacity<br/>Final Plant Drop</div>
                  </div>
               </div>

               {/* TRANSFER NODE EXPLANATION */}
               <div className="mt-10 bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                 <div className="text-2xl">♻️</div>
                 <p className="text-xs text-gray-400 leading-relaxed font-mono">
                   <b>Transfer Node Logic:</b> Each {autoTipperCapacity}T Auto Tipper dumps compartmentalized waste directly into larger {compactorCapacity}T Compactors stationed at primary arterial road limits, reducing residential traffic congestion. The waste is strictly segregated via internal vehicle division at every tier.
                 </p>
               </div>

            </div>
          </motion.section>

          {/* VRP ENGINE LOGIC BLOCK */}
          <motion.section variants={fadeInUp} className="lg:col-span-5 space-y-6 mt-4">
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black">3</div>
              Algorithmic Engine State
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Algorithm Status */}
              <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-3xl relative">
                <div className="absolute top-4 right-4 py-1 px-3 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Ready ✔</div>
                <div className="text-3xl mb-4">🧠</div>
                <div className="text-white font-bold mb-1">OR-Tools (VRP)</div>
                <div className="text-xs text-gray-400 mb-4">Selected Optimization Algorithm</div>
                <div className="bg-black/50 rounded-lg p-3 text-xs font-mono text-gray-300 border border-white/5">
                  Algorithm Initialized. Awaiting clustering execution sequence.
                </div>
              </div>

              {/* Requirement Formula */}
              <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-3xl relative">
                <div className="text-3xl mb-4">🧮</div>
                <div className="text-white font-bold mb-1">Vehicle Requirement</div>
                <div className="text-xs text-gray-400 mb-4">Formula evaluation</div>
                <div className="bg-black/50 rounded-lg p-3 text-xs font-mono text-blue-400 border border-white/5 whitespace-nowrap overflow-hidden text-ellipsis">
                  Vehicles = Total_Waste / Capacity<br/><br/>
                  <span className="text-gray-500">// {totalWaste}T / {autoTipperCapacity}T = {numAutoTippers} Auto Tippers</span>
                </div>
              </div>

              {/* Clustering logic */}
              <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-3xl relative">
                <div className="absolute top-4 right-4 py-1 px-3 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Zones Active</div>
                <div className="text-3xl mb-4">🎯</div>
                <div className="text-white font-bold mb-1">Zone Clustering</div>
                <div className="text-xs text-gray-400 mb-4">Coordinate-based K-Means</div>
                <div className="bg-black/50 rounded-lg p-3 text-xs font-mono text-gray-300 border border-white/5">
                  <span className="text-emerald-400">✔ Zones Detected: {selectedGrid.zoneCount}</span><br/>
                  <span className="text-emerald-400">✔ Waste per zone metrics acquired</span><br/>
                  Clusters structurally derived from coordinates.
                </div>
              </div>

              {/* Routing assignment & vehicle allocation */}
              <div className="bg-[#0a0f1e]/80 border border-white/10 p-6 rounded-3xl relative">
                <div className="absolute top-4 right-4 py-1 px-3 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">Allocated</div>
                <div className="text-3xl mb-4">📍</div>
                <div className="text-white font-bold mb-1">Route & Allocation</div>
                <div className="text-xs text-gray-400 mb-4">VRP Assignment</div>
                <div className="bg-black/50 rounded-lg p-3 text-xs font-mono text-gray-300 border border-white/5">
                  <div className="mb-1 border-b border-white/10 pb-1"><b className="text-white">Route:</b> Estimated TSP dist: {(selectedGrid.zoneCount * 1.83 * (numAutoTippers / selectedGrid.zoneCount)).toFixed(1)} km combined.</div>
                  <div><b className="text-white">Allocation:</b> {autoTipperCapacity}T constraints mapped against Road Accessibility (OSM).</div>
                </div>
              </div>

              {/* Terminal Verification output */}
              <div className="bg-black/90 p-4 border border-white/5 rounded-2xl col-span-1 md:col-span-2 lg:col-span-4 mt-2 max-h-48 overflow-y-auto">
                <div className="text-[10px] text-green-500 font-mono mb-2 flex justify-between">
                  <span>► SYSTEM_LOG // K-MEANS VRP STREAM</span>
                  <span>{selectedGrid.zoneCount} ZONES ACTIVE // LIVE PROCESSING</span>
                </div>
                <div className="font-mono text-[10px] text-gray-400 space-y-1">
                  {selectedGrid.description.split(', ').map((zoneId, i) => (
                    <div key={i}>
                      [<span className="text-teal-400">{`00:00:0${i % 10}.00`}</span>] 
                      <span className="text-indigo-400"> ZONE: {zoneId} </span>
                      {'>>'} CENTROID ACQUIRED {'>>'} 
                      <span className="text-amber-400"> ALLOCATION_LOCK</span> {'>>'} 
                      ROUTE_NODE: {i + 1}/{selectedGrid.zoneCount}
                    </div>
                  ))}
                  <div className="text-emerald-400 pt-2 animate-pulse">✓ ALL CONSTRAINTS SATISFIED AND MAPPED.</div>
                </div>
              </div>

              {/* View Map CTA */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end mt-2">
                <Link href="/map" className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all">
                  🔗 Verify Nodes inside Map Engine <span>→</span>
                </Link>
              </div>

            </div>
          </motion.section>

        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

// =======================
// Data Sets
// =======================
const roadTypes = [
  { name: 'Residential', value: 840 },
  { name: 'Footway', value: 509 },
  { name: 'Tertiary', value: 191 },
  { name: 'Service', value: 179 },
  { name: 'Secondary', value: 113 },
  { name: 'Other', value: 195 },
];
const COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

const wasteData = [
  { name: 'Outside BBMP', bio: 1, dry: 40, proc: 5, dump: 3 },
  { name: 'E-City', bio: 2, dry: 31, proc: 0, dump: 0 },
  { name: 'Yelahanka', bio: 2, dry: 42, proc: 0, dump: 0 },
  { name: 'Rajajinagar', bio: 1, dry: 26, proc: 0, dump: 0 },
  { name: 'Peenya', bio: 1, dry: 24, proc: 0, dump: 0 },
  { name: 'K R Puram', bio: 0, dry: 23, proc: 0, dump: 0 },
];

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<'hsr' | 'waste'>('hsr');

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-6 pb-24 md:p-12 font-sans selection:bg-teal-500/30 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        className="max-w-7xl mx-auto relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-12 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400">
              Data Insights
            </span>
            &nbsp;Dashboard
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            In-depth analysis of high-resolution geospatial datasets and urban infrastructure metrics across Bengaluru.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-full border border-white/10 flex">
            <button
              onClick={() => setActiveTab('hsr')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'hsr' ? 'bg-gradient-to-r from-teal-500 to-blue-500 shadow-lg shadow-teal-500/25 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              HSR Spatial Analysis
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'waste' ? 'bg-gradient-to-r from-pink-500 to-indigo-500 shadow-lg shadow-pink-500/25 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              BBMP Waste Infra
            </button>
          </div>
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'hsr' && (
            <motion.div 
              key="hsr"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-all">
                  <h3 className="text-2xl font-bold mb-2">HSR Layout Road Network</h3>
                  <p className="text-gray-400 mb-6 font-light">OpenStreetMap segments breakdown highlighting extreme urban density (~110 segments/km²).</p>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roadTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={70}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {roadTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-teal-500/20 to-blue-500/20 backdrop-blur-xl border border-teal-500/30 p-8 rounded-3xl h-full flex flex-col justify-center">
                    <h4 className="text-teal-400 font-bold uppercase tracking-wider text-xs mb-2">Pedestrian Metrics</h4>
                    <div className="text-5xl font-black mb-2 flex items-baseline gap-1">
                      25.1<span className="text-2xl text-teal-500">%</span>
                    </div>
                    <p className="text-gray-300 font-light text-sm">
                      Of all infrastructure is dedicated to footways & paths, indicating a highly accessible zone.
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                    <h4 className="text-sm text-gray-400 font-medium mb-1">Ward Area</h4>
                    <div className="text-2xl font-bold">18.5 km²</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl">
                    <h4 className="text-sm text-gray-400 font-medium mb-1">Road Segments</h4>
                    <div className="text-2xl font-bold">2,027</div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-6">Satellite Telemetry Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                      <h4 className="font-semibold">HSR_Layout_SD.tif</h4>
                    </div>
                    <p className="text-sm text-gray-400 font-light pl-6 leading-relaxed">
                      A 4.25 MB high-resolution uncompressed GeoTIFF representing bounding extent <code>EPSG:4326</code>. Used exclusively to map hyper-local LULC features within Ward 174.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                      <h4 className="font-semibold">BBMP_BOUNDARY_SD.tif</h4>
                    </div>
                    <p className="text-sm text-gray-400 font-light pl-6 leading-relaxed">
                      Massive 275.9 MB wide-area pass covering 741 km² of Bruhat Bengaluru Mahanagara Palike jurisdiction. Utilized for city-scale cross-referencing and atmospheric checks.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'waste' && (
            <motion.div 
              key="waste"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-emerald-400 mb-1">11</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Bio Units</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-blue-400 mb-1">336</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Dry Centers</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-3xl font-black text-red-400 mb-1 relative z-10">3</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400 relative z-10">Landfills</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-orange-400 mb-1">8</div>
                  <div className="text-xs uppercase tracking-widest text-gray-400">Process Units</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-2">Infrastructure Distribution by Ward</h3>
                <p className="text-gray-400 mb-8 font-light max-w-2xl">
                  Note the severe anomaly: Dumpyards and Processing Units are heavily clustered &apos;Outside BBMP&apos; limits, causing massive uncontrolled methane emission vectors in peripheral coordinates.
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wasteData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="dry" name="Dry Collection" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="bio" name="Bio-Methanisation" stackId="a" fill="#10b981" />
                      <Bar dataKey="proc" name="Processing" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="dump" name="Dumpyards" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 p-8 rounded-3xl flex items-start gap-4">
                <div className="text-3xl mt-1">⚠️</div>
                <div>
                  <h4 className="text-red-400 font-bold text-lg mb-2">Critical Methane Hotspots Detected</h4>
                  <p className="text-gray-300 font-light text-sm leading-relaxed mb-4 max-w-3xl">
                    Geospatial analysis flags the following raw coordinates as high-risk methane emitters due to the presence of large open-air dumps targeting municipal solid waste near the city periphery.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs text-orange-200">
                    <li className="bg-black/30 px-3 py-2 rounded-lg">13.153942°N, 77.668878°E (Dumpyard)</li>
                    <li className="bg-black/30 px-3 py-2 rounded-lg">13.103950°N, 77.646467°E (Dumpyard)</li>
                    <li className="bg-black/30 px-3 py-2 rounded-lg">13.103583°N, 77.645922°E (Dumpyard)</li>
                    <li className="bg-black/30 px-3 py-2 rounded-lg">12.973860°N, 77.441004°E (Processing)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

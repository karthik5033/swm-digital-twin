"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';

// =======================
// Data Sets
// =======================
const BBMP_COMPOSITION_HISTORY = [
  { year: '1999', wet: 42, dry: 41, other: 17, source: 'BBMP Official' },
  { year: '2013', wet: 61, dry: 25, other: 14, source: 'BBMP Official' },
  { year: '2026', wet: 63, dry: 28, other: 9,  source: 'Projected' },
];

const HSR_COMPOSITION_2026 = [
  { name: '🟢 Wet/Organic', pct: 61, tons: 14.10, dest: 'Bio-methanisation units (2)', color: '#22c55e' },
  { name: '🔵 Dry/Recycle', pct: 30, tons: 6.93,  dest: 'DWCC centres (16)',          color: '#3b82f6' },
  { name: '🔴 Hazardous',   pct: 5,  tons: 1.16,  dest: 'Special contractor',          color: '#ef4444' },
  { name: '⚪ Other/Inert', pct: 4,  tons: 0.92,  dest: 'Street sweep / landfill',    color: '#6b7280' },
];

const LULC_DATA = [
  { name: 'Built-up', value: 64.1, area: 11.85, color: '#e74c3c' },
  { name: 'Vegetation', value: 17.6, area: 3.26, color: '#27ae60' },
  { name: 'Open Land', value: 15.3, area: 2.83, color: '#f39c12' },
  { name: 'Water', value: 3.0, area: 0.56, color: '#3498db' },
];

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
  const [activeTab, setActiveTab] = useState<'hsr' | 'waste' | 'composition' | 'flow' | 'methane'>('hsr');

  const [totalBuildings, setTotalBuildings] = useState(9471);
  const [buildingTypes, setBuildingTypes] = useState<any>(roadTypes);
  const [wasteByType, setWasteByType] = useState<any>(wasteData);
  const [totalWaste, setTotalWaste] = useState(19.78);
  const [zones, setZones] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any>({});

  React.useEffect(() => {
    fetch('http://localhost:8000/building-analysis')
      .then(res => res.json())
      .then(data => {
        setTotalBuildings(data.total_buildings)
        setBuildingTypes(data.type_summary)
        setWasteByType(data.waste_by_type)
        setTotalWaste(data.total_daily_waste_tons)
        setZones(data.zones)
        setFacilities(data.key_facilities)
      })
      .catch(() => {
        setTotalBuildings(9471)
        setTotalWaste(19.78)
      })
  }, [])

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 pb-24 md:p-12 font-sans selection:bg-teal-100 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

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
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-light">
            In-depth analysis of high-resolution geospatial datasets and urban infrastructure metrics across Bengaluru.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <div className="bg-white backdrop-blur-md p-1.5 rounded-full border border-slate-200 shadow-md flex flex-wrap gap-1 justify-center">
            <button
              onClick={() => setActiveTab('hsr')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'hsr' ? 'bg-gradient-to-r from-teal-500 to-blue-500 shadow-lg shadow-teal-500/25 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              HSR Spatial Analysis
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'waste' ? 'bg-gradient-to-r from-pink-500 to-indigo-500 shadow-lg shadow-pink-500/25 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              BBMP Waste Infra
            </button>
            <button
              onClick={() => setActiveTab('composition')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'composition' ? 'bg-gradient-to-r from-green-500 to-teal-500 shadow-lg shadow-green-500/25 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Composition Analysis
            </button>
            <button
              onClick={() => setActiveTab('flow')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'flow' ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Waste Flow
            </button>
            <button
              onClick={() => setActiveTab('methane')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeTab === 'methane' ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25 text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Methane & Climate
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
                <div className="md:col-span-2 bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl hover:bg-white/[0.07] transition-all">
                  <h3 className="text-2xl font-bold mb-2">HSR Layout Road Network</h3>
                  <p className="text-slate-600 mb-6 font-light">OpenStreetMap segments breakdown highlighting extreme urban density (~110 segments/km²).</p>
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
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#0f172a' }}
                        />
                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 backdrop-blur-xl border border-teal-500/30 p-8 rounded-3xl h-full flex flex-col justify-center">
                    <h4 className="text-teal-600 font-bold uppercase tracking-wider text-xs mb-2">Pedestrian Metrics</h4>
                    <div className="text-5xl font-black mb-2 flex items-baseline gap-1">
                      25.1<span className="text-2xl text-teal-500">%</span>
                    </div>
                    <p className="text-slate-700 font-light text-sm">
                      Of all infrastructure is dedicated to footways & paths, indicating a highly accessible zone.
                    </p>
                  </div>
                  <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-6 rounded-3xl">
                    <h4 className="text-sm text-slate-600 font-medium mb-1">Ward Area</h4>
                    <div className="text-2xl font-bold">18.5 km²</div>
                  </div>
                  <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-6 rounded-3xl">
                    <h4 className="text-sm text-slate-600 font-medium mb-1">Road Segments</h4>
                    <div className="text-2xl font-bold">2,027</div>
                  </div>
                </div>
              </div>

              <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-6">LULC Land Use Classification</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={LULC_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {LULC_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
                          formatter={(value: number | string) => [`${value}%`]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {LULC_DATA.map(item => (
                      <div key={item.name} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-200 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-bold">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-900 font-black">{item.value}%</div>
                          <div className="text-slate-600 text-xs">{item.area} km²</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-6">Satellite Telemetry Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                      <h4 className="font-semibold">HSR_Layout_SD.tif</h4>
                    </div>
                    <p className="text-sm text-slate-600 font-light pl-6 leading-relaxed">
                      A 4.25 MB high-resolution uncompressed GeoTIFF representing bounding extent <code>EPSG:4326</code>. Used exclusively to map hyper-local LULC features within Ward 174.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                      <h4 className="font-semibold">BBMP_BOUNDARY_SD.tif</h4>
                    </div>
                    <p className="text-sm text-slate-600 font-light pl-6 leading-relaxed">
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
                <div className="bg-white border border-slate-200 shadow-md p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-emerald-600 mb-1">11</div>
                  <div className="text-xs uppercase tracking-widest text-slate-600">Bio Units</div>
                </div>
                <div className="bg-white border border-slate-200 shadow-md p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-blue-600 mb-1">336</div>
                  <div className="text-xs uppercase tracking-widest text-slate-600">Dry Centers</div>
                </div>
                <div className="bg-white border border-slate-200 shadow-md p-6 rounded-3xl text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-3xl font-black text-red-400 mb-1 relative z-10">3</div>
                  <div className="text-xs uppercase tracking-widest text-slate-600 relative z-10">Landfills</div>
                </div>
                <div className="bg-white border border-slate-200 shadow-md p-6 rounded-3xl text-center">
                  <div className="text-3xl font-black text-orange-400 mb-1">8</div>
                  <div className="text-xs uppercase tracking-widest text-slate-600">Process Units</div>
                </div>
              </div>

              <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl">
                <h3 className="text-2xl font-bold mb-2">Infrastructure Distribution by Ward</h3>
                <p className="text-slate-600 mb-8 font-light max-w-2xl">
                  Note the severe anomaly: Dumpyards and Processing Units are heavily clustered &apos;Outside BBMP&apos; limits, causing massive uncontrolled methane emission vectors in peripheral coordinates.
                </p>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wasteData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
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

              <div className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border border-red-500/10 p-8 rounded-3xl flex items-start gap-4">
                <div className="text-3xl mt-1">⚠️</div>
                <div>
                  <h4 className="text-red-400 font-bold text-lg mb-2">Critical Methane Hotspots Detected</h4>
                  <p className="text-slate-700 font-light text-sm leading-relaxed mb-4 max-w-3xl">
                    Geospatial analysis flags the following raw coordinates as high-risk methane emitters due to the presence of large open-air dumps targeting municipal solid waste near the city periphery.
                  </p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs text-orange-200">
                    <li className="bg-slate-50 px-3 py-2 rounded-lg">13.153942°N, 77.668878°E (Dumpyard)</li>
                    <li className="bg-slate-50 px-3 py-2 rounded-lg">13.103950°N, 77.646467°E (Dumpyard)</li>
                    <li className="bg-slate-50 px-3 py-2 rounded-lg">13.103583°N, 77.645922°E (Dumpyard)</li>
                    <li className="bg-slate-50 px-3 py-2 rounded-lg">12.973860°N, 77.441004°E (Processing)</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'composition' && (
            <motion.div
              key="composition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* A: Historical Trend Chart */}
              <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">BBMP Waste Composition Trend</h3>
                    <p className="text-slate-600 text-sm font-light">Source: BBMP Official Reports 1999–2013</p>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/30 rounded-xl px-4 py-2 text-green-400 text-xs font-bold uppercase tracking-wider">
                    Official Data
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={BBMP_COMPOSITION_HISTORY} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" stroke="#cbd5e1" tick={{ fill: '#64748b', fontSize: 13 }} />
                      <YAxis stroke="#cbd5e1" tick={{ fill: '#64748b' }} unit="%" domain={[0, 75]} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#0f172a' }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        formatter={(v: any) => [`${v}%`]}
                      />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="wet" name="Wet/Organic" stroke="#22c55e" strokeWidth={3} dot={{ r: 6, fill: '#22c55e' }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="dry" name="Dry/Paper" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="other" name="Others" stroke="#6b7280" strokeWidth={3} dot={{ r: 6, fill: '#6b7280' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 bg-green-500/5 border border-green-500/10 rounded-2xl p-4 text-sm text-green-300 font-light leading-relaxed">
                  ✨ <strong>Key Insight:</strong> Organic waste increased from 42% (1999) to 61% (2013) as Bengaluru’s food culture grew. This validates HSR Layout’s high bio-methanisation demand and justifies our infrastructure routing decisions.
                </div>
              </div>

              {/* B + C: Donut + Infrastructure table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* B: Current Donut */}
                <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md p-8 rounded-3xl flex flex-col">
                  <h3 className="text-xl font-bold mb-1">HSR Layout — 2026 Composition</h3>
                  <p className="text-slate-600 text-sm mb-6">Based on BBMP 2013 data + CPCB projection</p>
                  <div className="relative h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={HSR_COMPOSITION_2026}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="pct"
                        >
                          {HSR_COMPOSITION_2026.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px' }}
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(v: any, _n: any, props: any) => [`${v}% — ${props.payload?.tons ?? ''}T/day`, props.payload?.name ?? '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-2xl font-black text-slate-900">23.1</div>
                        <div className="text-xs text-slate-600">T/day</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {HSR_COMPOSITION_2026.map(item => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-slate-700">{item.name.split(' ').slice(1).join(' ')} — {item.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C: Infrastructure Matching Table */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 flex flex-col">
                  <h3 className="text-xl font-bold mb-1 text-teal-600">Infrastructure vs Demand</h3>
                  <p className="text-slate-600 text-sm mb-5">Capacity check: HSR Layout waste routing</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2 px-2 text-teal-600 font-bold text-xs uppercase tracking-wider">Type</th>
                          <th className="text-left py-2 px-2 text-teal-600 font-bold text-xs uppercase tracking-wider">Amount</th>
                          <th className="text-left py-2 px-2 text-teal-600 font-bold text-xs uppercase tracking-wider">Destination</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {HSR_COMPOSITION_2026.map(item => (
                          <tr key={item.name} className="hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                <span className="font-medium text-slate-900">{item.name.split(' ').slice(1).join(' ')} {item.pct}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-mono font-bold" style={{ color: item.color }}>{item.tons}T</td>
                            <td className="py-3 px-2 text-slate-700 text-xs">{item.dest}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-5 space-y-3">
                    <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-green-400 font-bold">Bio-meth capacity:</span>
                        <span className="text-green-300 font-mono">65 TPD (BBMP)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">HSR wet demand:</span>
                        <span className="text-green-400 font-bold">14.10T ✔ Covered</span>
                      </div>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-blue-600 font-bold">DWCC capacity:</span>
                        <span className="text-blue-300 font-mono">~500kg × 16 = 8T</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">HSR dry demand:</span>
                        <span className="text-blue-600 font-bold">6.94T ✔ Covered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Section Header */}
              <div className="text-center">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">Waste Flow Intelligence</h2>
                <p className="text-slate-600 text-base">From generation to processing — the complete waste journey</p>
              </div>

              {/* A: Flow Diagram */}
              <div className="bg-white backdrop-blur-xl border border-slate-200 shadow-md rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 text-center text-orange-400">HSR Layout Waste Flow</h3>

                {/* Generation Box */}
                <div className="flex justify-center mb-4">
                  <div className="bg-slate-50 border-2 border-teal-500 rounded-2xl px-8 py-4 text-center min-w-[220px]">
                    <div className="text-teal-600 font-bold text-xs uppercase tracking-widest mb-2">Generation</div>
                    <div className="text-slate-900 font-bold">46,219 residents</div>
                    <div className="text-slate-600 text-sm">× 0.5 kg/day (CPCB)</div>
                    <div className="text-amber-600 font-black text-2xl mt-1">23.1 tons/day</div>
                  </div>
                </div>

                {/* Arrow down */}
                <div className="flex justify-center mb-4">
                  <div className="flex flex-col items-center gap-0">
                    <div className="w-0.5 h-6 bg-teal-500/60" />
                    <div className="text-teal-600 text-xs font-bold">SPLIT</div>
                    <div className="w-0.5 h-6 bg-teal-500/60" />
                  </div>
                </div>

                {/* Four waste type boxes */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {[
                    { emoji: '🟢', label: 'WET', pct: '61%', tons: '14.1T', bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-400', dest: 'Bio-methanisation', destSub: '(2 units)' },
                    { emoji: '🔵', label: 'DRY', pct: '30%', tons: '6.9T',  bg: 'bg-blue-50', border: 'border-blue-500',  text: 'text-blue-600',  dest: 'DWCC centres',    destSub: '(16 centres)' },
                    { emoji: '🔴', label: 'HAZ', pct: '5%',  tons: '1.2T',  bg: 'bg-red-50', border: 'border-red-500',   text: 'text-red-400',   dest: 'Special',         destSub: 'Contractor' },
                    { emoji: '⚪', label: 'OTHER', pct: '4%',  tons: '0.9T',  bg: 'bg-slate-100', border: 'border-gray-500',  text: 'text-slate-600',  dest: 'Street',          destSub: 'Sweeping' },
                  ].map(w => (
                    <div key={w.label} className="flex flex-col items-center gap-2">
                      <div className={`${w.bg} border-2 ${w.border} rounded-2xl p-4 text-center w-full`}>
                        <div className="text-2xl mb-1">{w.emoji}</div>
                        <div className={`${w.text} font-black text-sm`}>{w.label}</div>
                        <div className="text-slate-900 font-bold text-lg">{w.pct}</div>
                        <div className={`${w.text} font-mono font-bold`}>{w.tons}</div>
                      </div>
                      <div className="w-0.5 h-4" style={{ background: 'currentColor', color: 'rgba(255,255,255,0.2)' }} />
                      <div className={`${w.bg} border ${w.border} rounded-xl px-3 py-2 text-center w-full text-xs`}>
                        <div className={`${w.text} font-bold`}>{w.dest}</div>
                        <div className="text-slate-600">{w.destSub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center text-xs text-slate-500 mt-2 italic">Sources: BBMP 2013 composition data · CPCB 0.5kg/person/day rate</div>
              </div>

              {/* B+C+D+E: 2-column grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* B: Collection Schedule */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-1 text-teal-600">HSR Collection Schedule</h3>
                  <p className="text-slate-500 text-xs mb-4">Source: hsrcitizenforum.in</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-teal-600 font-bold text-xs uppercase tracking-wide">Waste Type</th>
                        <th className="text-left py-2 text-teal-600 font-bold text-xs uppercase tracking-wide">Frequency</th>
                        <th className="text-left py-2 text-teal-600 font-bold text-xs uppercase tracking-wide">Vehicle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[
                        { type: '🟢 Wet/Kitchen',     freq: 'Daily × 7/wk',   vehicle: 'Auto tipper' },
                        { type: '🔵 Dry/Recyclable',  freq: 'Twice weekly',     vehicle: 'Auto tipper' },
                        { type: '🧹 Reject/Sanitary', freq: 'Daily × 7/wk',   vehicle: 'Auto tipper' },
                      ].map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 text-slate-900 font-medium">{r.type}</td>
                          <td className="py-3 text-amber-600 font-mono font-bold text-xs">{r.freq}</td>
                          <td className="py-3 text-slate-600 text-xs">{r.vehicle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* C: DWCC Capacity */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-1 text-blue-600">DWCC Capacity Analysis</h3>
                  <p className="text-slate-500 text-xs mb-4">Source: bbmp.gov.in</p>
                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex justify-between"><span className="text-slate-600">16 DWCCs × 2.5 TPD avg:</span><span className="text-slate-900 font-bold">40 TPD total</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Dry waste demand:</span><span className="text-blue-600 font-bold">6.9 TPD</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Utilisation:</span><span className="text-amber-600 font-bold">17.5%</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Surplus capacity:</span><span className="text-green-400 font-bold">33.1 TPD</span></div>
                  </div>
                  <div className="text-xs text-slate-600 mb-2">16 DWCCs — 40 TPD capacity</div>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all" style={{ width: '17.5%' }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-teal-600 font-bold">17.5% utilized</span>
                    <span className="text-slate-500">82.5% headroom</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 italic">Significant headroom for population growth</div>
                </div>

                {/* D: Landfill Diversion */}
                <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border border-green-500/30 rounded-3xl p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-7xl font-black text-green-400">80%</div>
                    <div>
                      <div className="text-slate-900 font-bold text-lg">Diverted from landfill</div>
                      <div className="text-slate-600 text-sm">Wet → Bio-meth · Dry → DWCC</div>
                      <div className="text-green-400 text-xs font-bold mt-1">0 open dumpyards in HSR Layout</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { icon: '✅', text: 'Wet waste → Bio-methanisation' },
                      { icon: '✅', text: 'Dry waste → DWCC + Recyclers' },
                      { icon: '⚠️', text: 'Hazardous → Special contractor' },
                      { icon: 'ℹ️', text: 'Other → Street sweeping' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-700">
                        <span>{item.icon}</span><span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-green-700 mt-3 italic">Source: ceeindia.org/hsr-swm</div>
                </div>

                {/* E: City Context */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6">
                  <h3 className="text-lg font-bold mb-1 text-indigo-600">HSR Layout in City Context</h3>
                  <p className="text-slate-500 text-xs mb-4">vs Bengaluru average</p>
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 text-slate-600 font-bold text-xs uppercase">Metric</th>
                        <th className="text-center py-2 text-teal-600 font-bold text-xs uppercase">HSR</th>
                        <th className="text-center py-2 text-indigo-600 font-bold text-xs uppercase">Bengaluru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[
                        { metric: 'Daily waste',       hsr: '23.1T',  blr: '3,250T' },
                        { metric: 'DWCCs',             hsr: '16',     blr: '164' },
                        { metric: 'Waste segregated',  hsr: '80%',    blr: '47%' },
                        { metric: 'Open dumpyards',    hsr: '0 ✔',    blr: 'Multiple' },
                      ].map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2.5 text-slate-700">{r.metric}</td>
                          <td className="py-2.5 text-center text-teal-600 font-bold">{r.hsr}</td>
                          <td className="py-2.5 text-center text-indigo-700">{r.blr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed">
                    HSR Layout&apos;s 80% diversion rate exceeds Bengaluru&apos;s city average of 47% (1,530/3,250 TPD). <span className="text-slate-500">Source: BBMP NGT report</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'methane' && (
            <motion.div
              key="methane"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-2">Methane &amp; Climate Intelligence</h2>
                <p className="text-slate-600 text-base">IPCC 2006 + BBMP official data</p>
              </div>

              {/* A: Risk Banner */}
              <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 border-2 border-green-500/50 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4">
                <div className="text-5xl">✅</div>
                <div className="flex-1">
                  <div className="text-green-400 font-black text-2xl">METHANE RISK: LOW</div>
                  <div className="text-slate-700 text-sm mt-1">HSR Layout has <strong className="text-slate-900">0 open dumpyards</strong>. All methane is captured by bio-methanisation units and converted to clean energy.</div>
                </div>
                <div className="text-xs text-green-700 italic text-right">Source: Hackathon dataset + BBMP</div>
              </div>

              {/* B: 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { color: 'teal',    val: '3,548 m³',   label: 'CH₄ produced/day',      sub: '0.25 m³/kg × 14,190 kg wet',  sub2: 'Source: IPCC 2006',             bg: 'from-teal-900/40', border: 'border-teal-500/40',    text: 'text-teal-600' },
                  { color: 'green',   val: '21,285 kWh', label: 'Energy potential/day',  sub: 'Powers ~7,095 homes/day',      sub2: '6 kWh per m³ CH₄',            bg: 'from-green-900/40', border: 'border-green-500/40',  text: 'text-green-400' },
                  { color: 'blue',    val: '71.1 tons',  label: 'CO₂ equivalent/day',    sub: 'CH₄ GWP = 28× CO₂ (IPCC AR5)', sub2: 'Captured = prevented',          bg: 'from-blue-900/40',  border: 'border-blue-500/40',   text: 'text-blue-600' },
                  { color: 'amber',   val: '₹5.19 Cr',    label: 'Carbon credits/year',   sub: '25,959 tons CO₂e × ₹2,000/ton', sub2: 'India carbon market 2024',      bg: 'from-amber-900/40', border: 'border-amber-500/40',  text: 'text-amber-600' },
                ].map((card, i) => (
                  <div key={i} className={`bg-gradient-to-b ${card.bg} to-transparent border ${card.border} rounded-3xl p-6`}>
                    <div className={`${card.text} font-black text-3xl mb-1`}>{card.val}</div>
                    <div className="text-slate-900 font-bold text-sm mb-3">{card.label}</div>
                    <div className="text-slate-600 text-xs leading-relaxed">{card.sub}</div>
                    <div className="text-gray-600 text-xs mt-1 italic">{card.sub2}</div>
                  </div>
                ))}
              </div>

              {/* C: Biogas Flow Diagram */}
              <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-8">
                <h3 className="text-xl font-bold text-center text-emerald-600 mb-8">Biogas Flow: Waste → Energy</h3>
                <div className="flex flex-col items-center gap-2">
                  {/* Wet Waste */}
                  <div className="bg-green-50 border-2 border-green-500 rounded-2xl px-8 py-3 text-center min-w-[200px]">
                    <div className="text-green-400 font-bold text-xs uppercase tracking-wider">Wet Waste Input</div>
                    <div className="text-slate-900 font-black text-xl">14.10 T/day</div>
                  </div>
                  <div className="w-0.5 h-6 bg-green-500/50" /><div className="text-green-400 text-xs">▼</div>
                  {/* Bio-meth */}
                  <div className="bg-slate-50 border-2 border-teal-500 rounded-2xl px-8 py-3 text-center min-w-[200px]">
                    <div className="text-teal-600 font-bold text-xs uppercase tracking-wider">Bio-methanisation</div>
                    <div className="text-slate-900 font-bold">2 units in HSR Layout</div>
                  </div>
                  <div className="w-0.5 h-6 bg-teal-500/50" /><div className="text-teal-600 text-xs">▼</div>
                  {/* Split */}
                  <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                    <div className="flex flex-col items-center gap-2">
                      <div className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-4 text-center w-full">
                        <div className="text-blue-600 font-bold text-xs">CH₄ Gas</div>
                        <div className="text-slate-900 font-black text-lg">3,548 m³</div>
                        <div className="text-blue-300 text-xs">/day</div>
                      </div>
                      <div className="w-0.5 h-5 bg-blue-500/50" /><div className="text-blue-600 text-xs">▼</div>
                      <div className="bg-blue-50 border border-blue-500/50 rounded-xl p-3 text-center w-full">
                        <div className="text-amber-600 font-black text-base">21,285 kWh</div>
                        <div className="text-slate-600 text-xs">energy/day</div>
                        <div className="text-green-400 text-xs mt-1">→ ~7,095 homes</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="bg-green-50 border-2 border-green-500/60 rounded-2xl p-4 text-center w-full">
                        <div className="text-green-400 font-bold text-xs">Digestate</div>
                        <div className="text-slate-900 font-bold">Compost</div>
                        <div className="text-green-300 text-xs">organic fertiliser</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* D: Infrastructure Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border-2 border-teal-500/40 rounded-3xl p-6">
                  <div className="text-teal-600 font-black text-lg mb-2">Swachagraha Kalika Kendra</div>
                  <div className="text-slate-600 text-xs mb-3">📍 Sector 4, HSR Layout BBMP Park</div>
                  <p className="text-slate-700 text-sm leading-relaxed">&ldquo;One-of-a-kind Composting Learning Centre with live models of community and home composting units.&rdquo;</p>
                  <div className="text-xs text-slate-500 mt-3 italic">Source: Wikipedia + OpenCity</div>
                </div>
                <div className="bg-white border-2 border-amber-500/40 rounded-3xl p-6">
                  <div className="text-amber-600 font-black text-lg mb-2">HSR Bio-meth Units</div>
                  <div className="space-y-1 text-sm mb-3">
                    <div className="flex justify-between"><span className="text-slate-600">Active units:</span><span className="text-slate-900 font-bold">2</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Capacity:</span><span className="text-slate-900 font-bold">10 TPD</span></div>
                    <div className="flex justify-between"><span className="text-slate-600">Current load:</span><span className="text-amber-600 font-bold">14.10 TPD</span></div>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-300">⚠️ Near capacity &mdash; Kudlu plant will add capacity</div>
                </div>
                <div className="bg-white border-2 border-blue-500/40 rounded-3xl p-6">
                  <div className="text-blue-600 font-black text-lg mb-2">Kudlu Biogas Plant</div>
                  <div className="text-slate-600 text-xs mb-2">📍 Kudlu (adjacent to HSR Layout)</div>
                  <div className="bg-blue-500/5 border border-blue-500/30 rounded-xl px-3 py-2 text-xs text-blue-300 mb-3">🔨 Under construction</div>
                  <p className="text-slate-700 text-sm leading-relaxed">Large biogas plant being built near HSR Layout &mdash; will handle overflow wet waste from HSR. Significant capacity expansion incoming.</p>
                  <div className="text-xs text-slate-500 mt-3 italic">Source: Deccan Herald</div>
                </div>
              </div>

              {/* E: HSR vs Open Dump Comparison */}
              <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 text-center">HSR Layout vs Open Dump Scenario</h3>
                <div className="grid grid-cols-2 gap-0 border border-slate-200 shadow-md rounded-2xl overflow-hidden text-sm">
                  <div className="bg-green-900/10 p-4 border-r border-slate-200 shadow-md">
                    <div className="text-green-400 font-black text-lg mb-3">HSR Layout ✅</div>
                    {['0 open dumpyards','All CH₄ captured','Energy generated','Carbon credits earned','Zero smell / disease'].map((t,i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 text-slate-700 border-b border-slate-200 shadow-sm last:border-0">
                        <span className="text-green-400">+</span>{t}
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-900/10 p-4">
                    <div className="text-red-400 font-black text-lg mb-3">Open Dump ❌</div>
                    {['Uncontrolled CH₄','28× CO₂ warming','Energy wasted','Carbon liability','Health hazard'].map((t,i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 text-slate-700 border-b border-slate-200 shadow-sm last:border-0">
                        <span className="text-red-400">−</span>{t}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl px-5 py-3 text-sm text-indigo-700 text-center italic">
                  HSR Layout&apos;s zero-dumpyard status makes it a model ward for Bengaluru&apos;s SWM reform agenda.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

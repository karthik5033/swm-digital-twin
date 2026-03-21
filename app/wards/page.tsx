"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import hsrWardScoresData from '@/data/hsr_ward_scores.json';
import { Skeleton } from "@/components/ui/Skeleton";
import { useStore } from '@/lib/store';

type Ward = {
  id: number;
  name: string;
  zone: string;
  score: number;
  dumpRisk: number;
  methaneIntensity: number;
  routeEfficiency: number;
  complaintRate: number;
  trend: 'up' | 'down' | 'stable';
  wasteTons: number;
  sector?: string;
  populationDensity?: number;
  segregationRate?: number;
};

const staticWardScores: Ward[] = hsrWardScoresData as Ward[];

// Helper to determine color based on score
function getScoreColor(score: number) {
  if (score <= 40) return { bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-400 dark:border-rose-500/30', text: 'text-rose-700 dark:text-rose-400', chart: '#e11d48' }; // Red
  if (score <= 70) return { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-400 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', chart: '#d97706' }; // Amber
  return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-400 dark:border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400', chart: '#059669' }; // Green
}

function getTrendIcon(trend: string) {
  if (trend === 'up') return <span className="text-rose-500 font-bold">↑</span>;
  if (trend === 'down') return <span className="text-emerald-500 font-bold">↓</span>;
  return <span className="text-slate-400 font-bold">→</span>;
}

export default function WardsPage() {
  // State
  const [wardScoresList, setWardScoresList] = useState<Ward[]>(staticWardScores);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For HSR Layout, we use the static data
    setWardScoresList(staticWardScores);
    setIsLoading(false);
  }, []);
  
  // Table filters
  const filteredWards = useStore((s) => s.filteredWards);
  const setFilteredWards = useStore((s) => s.setFilteredWards);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterZone, setFilterZone] = useState('All');
  
  // Table sorting
  const [sortKey, setSortKey] = useState<keyof Ward>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc'); // Since lower score = worse (red), so we want to see lowest first
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Derive grouped wards for the visual grid
  const visualGroups = useMemo(() => {
    const zonesList = ['North', 'West', 'Central', 'East', 'South'];
    return zonesList.reduce((acc, zone) => {
      acc[zone] = wardScoresList.filter(w => w.zone === zone);
      return acc;
    }, {} as Record<string, Ward[]>);
  }, [wardScoresList]);

  // Filter & Sort
  const processedWards = useMemo(() => {
    let result = [...wardScoresList];

    if (filteredWards.length > 0) {
      result = result.filter(w => filteredWards.includes(w.name));
    }

    if (searchQuery) {
      result = result.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (filterZone !== 'All') {
      result = result.filter(w => w.zone === filterZone);
    }

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });

    return result;
  }, [searchQuery, filterZone, sortKey, sortDir, filteredWards, wardScoresList]);

  const totalPages = Math.ceil(processedWards.length / rowsPerPage);
  const currentWards = processedWards.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleSort = (key: keyof Ward) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleRowClick = (id: number) => {
    setSelectedWardId(id === selectedWardId ? null : id);
  };

  // Ensure pagination is valid if filters reduce data length
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto">
        
        {/* TOP: SUMMARY STRIP */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">HSR Layout Waste Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Real-time metrics for HSR Layout sectors and zones</p>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Sectors</span>
                <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{wardScoresList.length}</span>
              </div>
              <div className="w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">High Risk</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{wardScoresList.filter(w => w.score < 40).length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">Medium</span>
                <span className="text-xl font-bold text-amber-500 dark:text-amber-400">{wardScoresList.filter(w => w.score >= 40 && w.score < 70).length}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase">Low Risk</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{wardScoresList.filter(w => w.score >= 70).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm shrink-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="font-bold text-sm">{wardScoresList.filter(w => w.score < 40).length} sectors need immediate action</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: VISUAL WARD MAP (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col transition-colors">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">HSR Layout Geographic Grid</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
                Zone-wise distribution of waste management sectors in HSR Layout. Click any sector to view detailed metrics.
              </p>

              {/* Geographic Grid Layout */}
              <div className="flex-1 flex items-center justify-center py-8">
                <div className="grid grid-cols-3 gap-x-4 gap-y-8 w-full max-w-xl">
                  
                  {/* Top: North */}
                  <div className="col-start-2 flex justify-center">
                    <ZoneBlock zone="North" wards={visualGroups['North']} selectedId={selectedWardId} onClick={handleRowClick} />
                  </div>

                  {/* Middle row: West, Central, East */}
                  <div className="col-start-1 row-start-2 flex justify-center">
                    <ZoneBlock zone="West" wards={visualGroups['West']} selectedId={selectedWardId} onClick={handleRowClick} />
                  </div>
                  <div className="col-start-2 row-start-2 flex justify-center">
                    <ZoneBlock zone="Central" wards={visualGroups['Central']} selectedId={selectedWardId} onClick={handleRowClick} />
                  </div>
                  <div className="col-start-3 row-start-2 flex justify-center">
                    <ZoneBlock zone="East" wards={visualGroups['East']} selectedId={selectedWardId} onClick={handleRowClick} />
                  </div>

                  {/* Bottom: South */}
                  <div className="col-start-2 row-start-3 flex justify-center">
                    <ZoneBlock zone="South" wards={visualGroups['South']} selectedId={selectedWardId} onClick={handleRowClick} />
                  </div>

                </div>
              </div>
            </div>

            {/* Selected Ward Details Panel */}
            <AnimatePresence mode="popLayout">
              {selectedWardId && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-md transition-colors"
                >
                  {isLoading ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between w-full items-start">
                        <div>
                          <Skeleton className="h-8 w-48 mb-2 rounded-md" />
                          <Skeleton className="h-4 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-12 w-16 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-lg" />)}
                      </div>
                    </div>
                  ) : (() => {
                    const w = wardScoresList.find(x => x.id === selectedWardId);
                    if (!w) return null;
                    const c = getScoreColor(w.score);
                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between w-full items-start">
                          <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">{w.name}</h3>
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">{w.zone} Zone</span>
                          </div>
                          <div className={`px-4 py-2 rounded-xl border ${c.bg} ${c.border} ${c.text} font-black text-2xl shadow-sm`}>
                            {w.score}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg flex flex-col">
                            <span className="text-xs font-bold text-slate-400">Dump Risk</span>
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{(w.dumpRisk * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg flex flex-col">
                            <span className="text-xs font-bold text-slate-400">Methane Int.</span>
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{(w.methaneIntensity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg flex flex-col">
                            <span className="text-xs font-bold text-slate-400">Efficiency</span>
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{(w.routeEfficiency * 100).toFixed(0)}%</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg flex flex-col">
                            <span className="text-xs font-bold text-slate-400">Trend</span>
                            <span className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              {w.trend} {getTrendIcon(w.trend)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: SORTABLE DATA TABLE (60%) */}
          <div className="w-full lg:w-[60%] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden min-h-[500px] transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4">HSR Layout Sector Metrics</h2>
              
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                {filteredWards.length > 0 && (
                  <button onClick={() => setFilteredWards([])} className="bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold px-4 py-2.5 rounded-xl border border-teal-200 dark:border-teal-500/20 text-sm shadow-sm whitespace-nowrap hover:bg-teal-100 dark:hover:bg-teal-500/20 transition-colors">
                    Clear AI Filter ✕
                  </button>
                )}
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input 
                    type="text" 
                    placeholder="Search ward name..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner dark:shadow-none"
                  />
                </div>
                <select
                  value={filterZone}
                  onChange={(e) => { setFilterZone(e.target.value); setCurrentPage(1); }}
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white dark:focus:bg-slate-800 shadow-inner dark:shadow-none cursor-pointer"
                >
                  <option value="All">All Zones</option>
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 font-extrabold transition-colors">
                    {['Sector', 'Zone', 'Score', 'Dump Risk', 'Methane', 'Efficiency', 'Trend'].map((header, idx) => {
                      const keysMap: Record<string, keyof Ward> = {
                        'Sector': 'name', 'Zone': 'zone', 'Score': 'score', 
                        'Dump Risk': 'dumpRisk', 'Methane': 'methaneIntensity', 
                        'Efficiency': 'routeEfficiency', 'Trend': 'trend'
                      };
                      const key = keysMap[header];
                      const isSorted = sortKey === key;
                      
                      return (
                        <th 
                          key={header} 
                          className="px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                          onClick={() => handleSort(key)}
                        >
                          <div className="flex items-center gap-1.5">
                            {header}
                            <span className={`text-[10px] ${isSorted ? 'text-teal-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}>
                              {sortDir === 'asc' ? '▲' : '▼'}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <motion.tbody 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.5 }}
                  className="divide-y divide-slate-100 dark:divide-slate-800"
                >
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={`skel-${idx}`}>
                        <td colSpan={7} className="px-4 py-2">
                          <Skeleton className="h-11 w-full rounded-lg" />
                        </td>
                      </tr>
                    ))
                  ) : currentWards.length > 0 ? currentWards.map((w) => {
                    const isSelected = selectedWardId === w.id;
                    const c = getScoreColor(w.score);
                    
                    return (
                      <tr 
                        key={w.id} 
                        onClick={() => handleRowClick(w.id)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-teal-50/50 dark:bg-teal-500/10 hover:bg-teal-50/80 dark:hover:bg-teal-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <td className="px-4 py-3 border-l-4" style={{ borderLeftColor: isSelected ? '#0d9488' : 'transparent' }}>
                          <span className={`font-bold ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-800 dark:text-slate-200'}`}>{w.name}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">{w.zone}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-md border text-xs font-bold ${c.bg} ${c.border} ${c.text}`}>
                            {w.score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{(w.dumpRisk * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{(w.methaneIntensity * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">{(w.routeEfficiency * 100).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-lg">{getTrendIcon(w.trend)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">
                        No wards found matching the filters.
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between transition-colors">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, processedWards.length)} of {processedWards.length}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Prev
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Component: Zone Block ---
function ZoneBlock({ zone, wards, selectedId, onClick }: { zone: string, wards: Ward[], selectedId: number | null, onClick: (id: number) => void }) {
  return (
    <div className="flex flex-col items-center w-full gap-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{zone}</span>
      <div className="flex flex-col w-full gap-2 min-h-[60px] justify-center items-center">
        {wards.length === 0 ? (
          <div className="text-xs text-slate-300 dark:text-slate-600 italic">Empty</div>
        ) : (
          wards.map(w => {
            const isSelected = w.id === selectedId;
            const c = getScoreColor(w.score);
            const shortName = w.name.replace('HSR Layout ', '');
            
            return (
              <motion.button
                key={w.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onClick(w.id)}
                title={`${w.name} (Score: ${w.score})`}
                className={`
                  relative w-full max-w-[140px] p-3 rounded-xl border transition-all flex items-center justify-between gap-3 group shadow-sm
                  ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-slate-800 z-10' : 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 z-0'}
                  bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700
                `}
              >
                <div className="flex flex-col items-start min-w-0">
                  <span className={`text-[10px] font-bold uppercase truncate w-full text-left leading-tight ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {shortName}
                  </span>
                </div>
                
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-black shrink-0 ${c.bg} ${c.text} border ${c.border}`}
                >
                  {w.score}
                </div>

                {/* Status Indicator Dot */}
                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${w.score <= 40 ? 'bg-rose-500' : w.score <= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}

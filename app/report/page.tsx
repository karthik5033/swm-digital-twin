"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import wardScores from '@/data/ward_scores.json';
import { HSR_DATA } from '@/lib/constants';
import economicParams from '@/data/economic_params.json';
import { Skeleton } from "@/components/ui/Skeleton";

// Simple toast component
function Toast({ message, visible }: { message: string, visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 right-8 bg-white border border-slate-200 text-slate-800 px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3 font-medium"
        >
          <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/1000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ReportPage() {
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({
    exec: true,
    wardRisk: true,
    economic: true,
    methane: true,
    actions: true,
    raw: false
  });
  
  const [dateRange, setDateRange] = useState('This Month');
  const [toastVisible, setToastVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const toggleSection = (id: string) => {
    setSelectedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 text-slate-800 font-sans p-6 md:p-8 flex flex-col lg:flex-row gap-8 print:p-0 print:bg-white">
      
      {/* LEFT PANEL: CONFIGURATION (Hidden when printing) */}
      <div className="w-full lg:w-[35%] flex flex-col gap-6 print:hidden">
        
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Generate Report</h1>
          <p className="text-sm font-medium text-slate-500 mb-8">Configure output sections and export format for BBMP officials.</p>

          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-4">Include Sections</h2>
          <div className="flex flex-col gap-3 mb-8">
            {[
              { id: 'exec', label: 'Executive Summary' },
              { id: 'wardRisk', label: 'Ward Risk Analysis' },
              { id: 'economic', label: 'Economic Impact Summary' },
              { id: 'methane', label: 'Methane Emission Projection' },
              { id: 'actions', label: 'Recommended Actions' },
              { id: 'raw', label: 'Raw Data Tables' },
            ].map((sec) => (
              <label key={sec.id} onClick={() => toggleSection(sec.id)} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all border-2 ${selectedSections[sec.id] ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-300 group-hover:border-teal-500'}`}>
                  {selectedSections[sec.id] && (
                    <svg xmlns="http://www.w3.org/1000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </div>
                <span className="font-bold text-slate-600 select-none group-hover:text-slate-900 transition-colors uppercase text-sm tracking-wide">{sec.label}</span>
              </label>
            ))}
          </div>

          <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 mb-4">Date Range</h2>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600 mb-10 shadow-sm cursor-pointer"
          >
            <option value="This Month">This Month</option>
            <option value="Last Quarter">Last Quarter</option>
            <option value="This Year">This Year</option>
          </select>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePrint}
              className="w-full bg-teal-600 hover:bg-teal-700 text-slate-900 font-extrabold text-lg px-6 py-4 rounded-xl shadow-[0_8px_25px_rgba(13,148,136,0.25)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.35)] transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/1000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
              Generate PDF
            </button>
            <button 
              onClick={handleEmail}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-extrabold text-lg px-6 py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/1000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Mock Email to BBMP
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: LIVE PDF PREVIEW */}
      <div className="w-full lg:w-[65%] flex justify-center print:w-full print:max-w-none print:m-0 print:block">
        
        {/* The Paper Sheet */}
        {isLoading ? (
          <Skeleton className="w-full max-w-[850px] min-h-[1100px] rounded-3xl shadow-lg" />
        ) : (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 0.5}} className="bg-white w-full max-w-[850px] min-h-[1100px] border border-slate-200 shadow-lg p-10 sm:p-16 text-slate-800 flex flex-col print:shadow-none print:border-none print:p-0 print:min-h-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/1000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900">AstraCity</h1>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Spatial Intelligence Platform</span>
            </div>
            <div className="text-right">
              <h1 className="font-extrabold uppercase text-slate-600 tracking-widest text-sm mb-1">OFFICIAL REPORT</h1>
              <p className="font-bold text-slate-800 text-lg">Bruhat Bengaluru Mahanagara Palike</p>
              <p className="text-slate-500 font-medium text-sm mt-1">{dateRange} • Generated: {today}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Waste Management Intelligence Report</h1>
            <div className="h-1.5 w-24 bg-teal-500 mx-auto rounded-full"></div>
          </div>

          {/* Dynamic Content Sections */}
          <div className="flex flex-col gap-10">
            {selectedSections.exec && (
              <section>
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">1. Executive Summary</h2>
                <p className="font-medium text-slate-600 leading-relaxed text-justify">
                  HSR Layout Ward Analysis reveals a population base of {HSR_DATA.population_building_based.toLocaleString()} (building-based, Census 2011 Karnataka method) generating {HSR_DATA.daily_waste_display} of aggregate daily waste. Using GEOIQ.IO boundaries paired with OpenStreetMap extracts and Census 2011 calibrators, we have mapped localized waste generation hotspots and optimized collection routing algorithms to reduce daily required travel. Wait times at transfer stations and baseline carbon expenditures present distinct targets for immediate route recalibration.
                </p>
              </section>
            )}

            {selectedSections.wardRisk && (
              <section>
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">2. Ward Risk Analysis</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-5">
                    <h3 className="font-bold text-rose-800 mb-1">Critical Zones</h3>
                    <p className="text-4xl font-black text-rose-600 mb-2">47 <span className="text-sm font-bold text-rose-600">wards</span></p>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed">Experiencing ≥85% dump risk vectors based on localized traffic patterns and transfer station bottlenecks.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <h3 className="font-bold text-amber-800 mb-1">At-Risk Operations</h3>
                    <p className="text-4xl font-black text-amber-600 mb-2">89 <span className="text-sm font-bold text-amber-600">wards</span></p>
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">Minor route inefficiencies detected resulting in ~{economicParams.hoursSavedPerTruckPerDay} baseline hours lost per vehicle daily.</p>
                  </div>
                </div>
              </section>
            )}

            {selectedSections.economic && (
              <section>
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">3. Economic Impact Profile</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <span className="font-bold text-slate-700">Annual Fuel Cost Reduction</span>
                    <span className="font-black text-teal-700 text-lg">₹3.47 Crores</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <span className="font-bold text-slate-700">Projected Secondary Cleanup Savings</span>
                    <span className="font-black text-teal-700 text-lg">₹7.68 Crores</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <span className="font-bold text-slate-700">Total Operational Savings Estimate</span>
                    <span className="font-black text-teal-700 text-lg">₹{HSR_DATA.annual_savings_cr} Crores</span>
                  </div>
                </div>

                <div className="mt-4 p-5 bg-teal-50 border border-teal-200 rounded-xl">
                  <h3 className="font-extrabold text-teal-900 mb-3 uppercase text-xs tracking-widest">Scale-Up Implications (198 Wards City-wide)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col">
                       <span className="text-teal-600 font-bold text-[10px] uppercase tracking-wider mb-0.5">Population</span>
                       <span className="text-teal-900 font-black text-lg leading-none">~1.4 Crores</span>
                    </div>
                    <div className="flex flex-col border-l border-teal-200/50 pl-4">
                       <span className="text-teal-600 font-bold text-[10px] uppercase tracking-wider mb-0.5">Daily Waste</span>
                       <span className="text-teal-900 font-black text-lg leading-none">~6,500 Tons</span>
                    </div>
                    <div className="flex flex-col border-l border-teal-200/50 pl-4">
                       <span className="text-teal-600 font-bold text-[10px] uppercase tracking-wider mb-0.5">Expected Savings</span>
                       <span className="text-teal-900 font-black text-lg leading-none">₹830 Cr/yr</span>
                    </div>
                  </div>
                </div>

              </section>
            )}

            {selectedSections.methane && (
              <section className="print:break-inside-avoid">
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">4. Methane Emission Projection</h2>
                <div className="bg-white rounded-xl p-8 flex items-center justify-center text-center">
                  <div>
                    <span className="block text-5xl font-black text-teal-600 mb-3">{economicParams.methaneReductionTons.toLocaleString()} <span className="text-lg">tons</span></span>
                    <span className="uppercase text-xs font-bold tracking-widest text-slate-600">Net CO2 Equivalent Reduced</span>
                  </div>
                </div>
              </section>
            )}

            {selectedSections.actions && (
              <section className="print:break-inside-avoid">
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">5. Recommended Actions</h2>
                <ul className="list-disc pl-5 font-medium text-slate-600 space-y-3">
                  <li>Immediately deploy <span className="font-bold text-slate-800">Dynamic Re-routing Protocol</span> to Eastern and Northern zones targeting {economicParams.optimizedRouteKm}km optimized caps.</li>
                  <li>Schedule rapid interventions at {economicParams.dumpsPreventedPerYear.toLocaleString()} localized micro-dumping hot spots recorded in highest-vulnerability wards.</li>
                  <li>Incentivize dispatching vehicles 45 minutes prior to peak traffic convolution metrics.</li>
                  <li>Relocate secondary transfer collection assets to ease bottlenecking at primary central nodes.</li>
                </ul>
              </section>
            )}

            {selectedSections.raw && (
              <section className="print:break-before-page">
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 mb-4">Appendix: Raw Score Sampling</h2>
                <table className="w-full text-left text-xs border-collapse font-medium text-slate-600">
                  <thead className="bg-slate-100 font-bold text-slate-800 uppercase">
                    <tr>
                      <th className="py-2 px-3 border border-slate-200">Ward ID</th>
                      <th className="py-2 px-3 border border-slate-200">Ward Name</th>
                      <th className="py-2 px-3 border border-slate-200">Score</th>
                      <th className="py-2 px-3 border border-slate-200">Zone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardScores.slice(0, 10).map((w: { id: string | number; name: string; score: number; zone: string }) => (
                      <tr key={w.id} className="border border-slate-200">
                        <td className="py-2 px-3 border border-slate-200">{w.id}</td>
                        <td className="py-2 px-3 border border-slate-200 font-bold text-slate-800">{w.name}</td>
                        <td className="py-2 px-3 border border-slate-200">{w.score}</td>
                        <td className="py-2 px-3 border border-slate-200">{w.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-600 mt-2 italic">* Table truncated for brevity. Showing first 10 recorded entries.</p>
              </section>
            )}
          </div>

          <div className="mt-auto pt-16 border-t font-medium border-slate-200 text-center text-xs text-slate-600">
            CONFIDENTIAL REPORT GENERATED ELECTRONICALLY BY ASTRACITY (c) {new Date().getFullYear()}
          </div>
        </motion.div>
        )}
      </div>
      
      {/* Success Toast */}
      <Toast message="Report sent to bbmp@bruhat.org" visible={toastVisible} />
    </div>
  );
}

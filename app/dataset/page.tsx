'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HSR_DATA } from '@/lib/constants';

const DATA_ROWS = [
  { point: 'Area', val: '18.5 sq km', src: 'OSM boundary' },
  { point: 'Buildings', val: '9,471', src: 'OpenStreetMap' },
  { point: 'Building density', val: '512/sq km', src: 'Calculated' },
  { point: 'Road segments', val: '2,027', src: 'OpenStreetMap' },
  { point: 'Road density', val: '110/sq km', src: 'Calculated' },
  { point: 'Truck roads', val: '352 (17.4%)', src: 'OSM road types' },
  { point: 'Auto roads', val: '1,579 (77.9%)', src: 'OSM road types' },
  { point: 'Population', val: '46,219', src: 'Buildings×Census 2011 Karnataka' },
  { point: 'Per capita', val: '0.5 kg/day', src: 'CPCB large city official' },
  { point: 'Daily waste', val: '23.1 Tons', src: '46,219 × 0.5kg' },
  { point: `Wet ${HSR_DATA.waste_wet_pct}%`, val: `${HSR_DATA.waste_wet_tons}T`, src: 'BBMP Chemical Analysis' },
  { point: `Dry ${HSR_DATA.waste_dry_pct}%`, val: `${HSR_DATA.waste_dry_tons}T`, src: 'CPCB 59-cities' },
  { point: `Hazardous ${HSR_DATA.waste_hazardous_pct}%`, val: `${HSR_DATA.waste_hazardous_tons}T`, src: 'BBMP guidelines' },
  { point: 'Route saving', val: '75.5%', src: 'NetworkX VRP' },
  { point: 'Collection schedule', val: 'Daily/2×wk', src: 'hsrcitizenforum.in' },
  { point: 'Wet routing', val: '→ Bio-meth', src: 'ceeindia.org/hsr-swm' },
  { point: 'DWCC utilisation', val: '17.5%', src: 'bbmp.gov.in' },
  { point: 'City diversion', val: '80% vs 47%', src: 'Deccan Herald + BBMP NGT' },
  { point: 'Landfill diverted', val: '80%', src: 'data.opencity.in' },
  { point: 'IPCC CH₄ factor', val: '0.25 m³/kg', src: 'IPCC 2006' },
  { point: 'CH₄ GWP', val: '28× CO₂', src: 'IPCC AR5' },
  { point: 'Energy conv.', val: '6 kWh/m³', src: 'Standard' },
  { point: 'Carbon price', val: '₹2,000/ton', src: 'India market 2024' },
  { point: 'Kudlu plant', val: 'Under const.', src: 'Deccan Herald' },
  { point: 'Swachagraha', val: 'Sector 4', src: 'Wikipedia + OpenCity' },
];

export default function DatasetPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 selection:bg-teal-500/30">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 pt-12 pb-8 px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Data Sources & Methodology</h1>
          <p className="text-slate-500 font-medium text-lg">
            Transparent breakdown of all constants, sources, and calculations used in AstraCity's HSR Layout simulation.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6">
        
        {/* Main Data Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-extrabold uppercase tracking-widest text-xs">Data Point</th>
                  <th className="px-6 py-4 font-extrabold uppercase tracking-widest text-xs">Value</th>
                  <th className="px-6 py-4 font-extrabold uppercase tracking-widest text-xs">Source / Authorization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {DATA_ROWS.map((row, i) => (
                  <motion.tr 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 font-bold">{row.point}</td>
                    <td className="px-6 py-4 font-mono text-teal-600 font-bold text-base">{row.val}</td>
                    <td className="px-6 py-4 text-slate-500 italic">{row.src}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Citations & Downloads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-black text-amber-900 mb-4 flex items-center gap-2">
              <span>📚</span> Official Documentation
            </h2>
            <div className="text-amber-800 font-medium leading-relaxed mb-6 space-y-2">
              <p>All environmental parameters are derived from certified municipal documents to ensure simulation accuracy.</p>
              <ul className="list-disc list-inside opacity-90 space-y-1 ml-2">
                <li><span className="font-bold">bbc.csv</span> — BBMP official waste composition data</li>
                <li><span className="font-bold">xxm.pdf</span> — CPCB Annual Report 2021-2022 on Solid Waste</li>
                <li><span className="font-bold">Geospatial</span> — OpenStreetMap, Census 2011, geoiq.io, HSR_Layout_SD.tif</li>
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button 
                disabled 
                className="flex items-center gap-2 bg-white border border-amber-200 px-5 py-3 rounded-xl text-amber-900 font-bold shadow-sm hover:shadow-md transition-shadow cursor-not-allowed opacity-75"
              >
                <span>📄</span> Download BBMP Data (CSV)
              </button>
              <button 
                disabled 
                className="flex items-center gap-2 bg-white border border-amber-200 px-5 py-3 rounded-xl text-amber-900 font-bold shadow-sm hover:shadow-md transition-shadow cursor-not-allowed opacity-75"
              >
                <span>📑</span> Download CPCB Report (PDF)
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
               <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Historical Context</div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-bold">1999 Composition</span>
                    <span className="font-mono text-slate-900">Wet 42% · Dry 41% · Other 17%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-bold">2013 Composition</span>
                    <span className="font-mono text-slate-900">Wet 61% · Dry 25% · Other 14%</span>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-teal-600 font-bold flex items-center gap-2">
                 <span>📈</span> Trend: Organic waste increasing yearly — validates AstraCity's focus on bio-methanisation.
               </div>
             </div>
             <p className="text-xs text-slate-400 mt-4 text-center">
               Source: BBMP Official Publications & Center for Environment Education
             </p>
          </div>
        </div>

      </main>
    </div>
  );
}
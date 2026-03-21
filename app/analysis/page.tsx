'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from "@/components/ui/Skeleton";
import Image from 'next/image';
import dynamic from 'next/dynamic';
const ImageModal = dynamic(() => import('@/components/ui/ImageModal'), { ssr: false });

const SpinnerIcon = () => (
  <svg className="animate-spin h-8 w-8 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

export default function AnalysisPage() {
  const [tab, setTab] = useState<'legend' | 'clean'>('legend');
  const [modalOpen, setModalOpen] = useState(false);
  const imageSrc = tab === 'legend' ? '/images/building_map_legend.png' : '/images/building_map.png';
  const imageAlt = tab === 'legend' ? 'HSR Layout Building Type Map' : 'HSR Layout Building Map (Clean)';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors relative">
      <div className="fixed top-0 left-0 w-[80%] h-[600px] bg-teal-100/50 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[80%] h-[600px] bg-indigo-100/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      <main className="max-w-4xl mx-auto px-6 pt-16 mt-4 flex flex-col gap-12">
        
        {/* HEADER */}
        <section>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">
            HSR Layout — Real Building Footprints
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 max-w-2xl mb-4">
            9,471 buildings mapped from OpenStreetMap · Color coded by type
          </p>
        </section>

        {/* TABS */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 font-bold text-sm rounded-t-lg border-b-2 transition-colors ${tab === 'legend' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
            onClick={() => setTab('legend')}
          >
            With Legend
          </button>
          <button
            className={`px-4 py-2 font-bold text-sm rounded-t-lg border-b-2 transition-colors ${tab === 'clean' ? 'border-teal-500 text-teal-600 dark:text-teal-400' : 'border-transparent text-slate-400 dark:text-slate-500'}`}
            onClick={() => setTab('clean')}
          >
            Clean Map
          </button>
        </div>

        {/* MAP IMAGE */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg cursor-zoom-in" onClick={() => setModalOpen(true)}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1400}
            height={900}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* DOWNLOAD BUTTON */}
        <div className="mt-4 flex flex-col items-start gap-2">
          <a
            href={imageSrc}
            download={tab === 'legend' ? 'HSR_Layout_Building_Map_Legend.png' : 'HSR_Layout_Building_Map_Clean.png'}
            className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-teal-500 transition-colors"
          >
            Download Full Map →
          </a>
        </div>

        {/* CAPTION */}
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Source: OpenStreetMap contributors<br />
          Processed by: AstraCity HSR Layout Analysis<br />
          Tool: QGIS + GeoPandas<br />
          Date: March 2026
        </div>

        {/* IMAGE MODAL */}
        <ImageModal open={modalOpen} src={imageSrc} alt={imageAlt} onClose={() => setModalOpen(false)} />

        {/* SKELETON METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {["Total Buildings", "Total Daily Waste", "Highest Waste Zone", "Special Waste Types"].map((title, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
               <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-4">{title}</h3>
               <Skeleton className="h-10 w-2/3 rounded-lg mb-2" />
               <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}

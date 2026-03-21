'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/satellite', label: 'Satellite' },
  { href: '/analysis', label: 'Analysis' },
  { href: '/osm', label: 'OSM' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/engine', label: 'Engine' },
  { href: '/routes', label: 'Routes' },
  { href: '/impact', label: 'Impact' },
  { href: '/wards', label: 'Wards' },
  { href: '/report', label: 'Report' },
  { href: '/economics', label: 'Economics' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('astracity-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('astracity-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('astracity-theme', 'light');
    }
  };

  return (
    <nav className="relative flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 transition-colors">
      <Link href="/" onClick={() => setIsOpen(false)} className="font-extrabold text-2xl tracking-tight text-teal-600 hover:text-teal-500 transition-colors">
        AstraCity
      </Link>
      
      <div className="flex items-center gap-2 md:gap-6">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme} 
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
          aria-label="Toggle dark mode"
        >
          <motion.div initial={false} animate={{ rotate: isDark ? 180 : 0 }} transition={{ duration: 0.5, ease: "backOut" }}>
            {isDark ? <span className="text-xl">☀️</span> : <span className="text-xl">🌙</span>}
          </motion.div>
        </button>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {LINKS.map(link => (
            <div key={link.href} className="flex items-center">
              {link.label === 'Report' && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mr-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 w-7 h-7 rounded-full flex items-center justify-center transition-colors text-xs font-black shadow-sm"
                  aria-label="Data Sources"
                >
                  ⓘ
                </button>
              )}
              <Link href={link.href} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {link.label}
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-slate-600 dark:text-slate-300 p-2 focus:outline-none hover:text-teal-600 dark:hover:text-teal-400 transition-colors" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        )}
      </button>

      {/* Mobile Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 md:hidden overflow-hidden origin-top"
          >
            <div className="flex flex-col">
              {LINKS.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className="block w-full py-4 px-6 border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ⓘ Data Sources Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl z-10 p-6 sm:p-8"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 pr-10">Data Sources & Methodology</h2>
              
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl mb-8">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Data Point</th>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Value</th>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-400">
                    {[
                      { point: 'Area', val: '18.5 sq km', src: 'OSM boundary' },
                      { point: 'Buildings', val: '9,471', src: 'OpenStreetMap' },
                      { point: 'Building density', val: '512/sq km', src: 'Calculated' },
                      { point: 'Road segments', val: '2,027', src: 'OpenStreetMap' },
                      { point: 'Road density', val: '110/sq km', src: 'Calculated' },
                      { point: 'Truck roads', val: '352 (17.4%)', src: 'OSM road types' },
                      { point: 'Auto roads', val: '1,579 (77.9%)', src: 'OSM road types' },
                      { point: 'Population 2011', val: '63,033', src: 'Census 2011' },
                      { point: 'Population 2025', val: '1,15,000', src: '4.5%/yr proj.' },
                      { point: 'Waste rate', val: '0.5 kg/day', src: 'CPCB standard' },
                      { point: 'Daily waste', val: '57.5 tons', src: 'Calculated' },
                      { point: 'Dump sites', val: '29', src: 'Satellite AI' },
                      { point: 'Route saving', val: '75.5%', src: 'NetworkX VRP' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-semibold">{row.point}</td>
                        <td className="px-5 py-3 font-mono text-teal-600 dark:text-teal-400">{row.val}</td>
                        <td className="px-5 py-3">{row.src}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 text-sm text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                <span className="font-extrabold block mb-2">All data derived from real sources. No synthetic or estimated data used without explicit labeling.</span>
                <span className="opacity-80 leading-normal block">Sources: Census 2011, OpenStreetMap, CPCB Guidelines, Beegru.com 2025, geoiq.io, HSR_Layout_SD.tif satellite.</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}

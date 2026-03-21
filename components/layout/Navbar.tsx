'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { HSR_DATA } from '@/lib/constants';

const MAIN_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/osm', label: 'OSM' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/routes', label: 'Routes' },
  { href: '/forecast', label: '🔮 Forecast' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/impact', label: 'Impact' },
  { href: '/wards', label: 'Wards' },
  { href: '/report', label: 'Report' },
];

const FEATURES_LINKS = [
  { href: '/analysis', label: 'Data Analysis', desc: 'Geospatial datasets & urban metrics', icon: '📊' },
  { href: '/impact', label: 'Impact Dashboard', desc: 'Environmental & social impact', icon: '🌍' },
  { href: '/wards', label: 'Ward Metrics', desc: 'HSR Layout sector scores', icon: '🏘️' },
  { href: '/economics', label: 'Economics', desc: 'Live financial calculator', icon: '💰' },
  { href: '/gridwise', label: 'Grid-Wise Zones', desc: '500m grid zone analysis & risk', icon: '🗺️' },
  { href: '/lulc', label: 'LULC Analysis', desc: 'Land Use & Cover via Sentinel', icon: '🛰️' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  const featuresRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    
    // Theme logic
    const saved = localStorage.getItem('astracity-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // API check
    const checkApi = async () => {
      try {
        const res = await fetch('http://localhost:8000/');
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    
    checkApi();
    const interval = setInterval(checkApi, 10000);
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    setFeaturesOpen(false);
    setIsOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('astracity-theme', 'light');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('astracity-theme', 'light');
    }
  };

  const isActive = (href: string) => pathname === href;
  const isFeaturesActive = FEATURES_LINKS.some(l => pathname === l.href);

  return (
    <nav className="relative flex items-center justify-between p-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
      {/* LEFT: Logo + API badge + Dark mode toggle */}
      <div className="flex items-center gap-2">
        <Link href="/" onClick={() => setIsOpen(false)} className="font-extrabold text-2xl tracking-tight text-teal-600 hover:text-teal-500 transition-colors flex items-center gap-2">
          <span className="text-xl">🛰️</span> AstraCity
        </Link>

        {/* API Status Badge — next to logo */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border-slate-300 border font-medium text-xs ml-2">
          <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : apiStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
          <span className="text-slate-600">
            {apiStatus === 'online' ? 'API Online' : apiStatus === 'checking' ? 'Checking...' : 'API Offline'}
          </span>
        </div>

        {/* Dark Mode Toggle — between brand and nav */}
        <button 
          onClick={toggleTheme} 
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors text-slate-600 ml-1"
          aria-label="Toggle dark mode"
        >
          <motion.div initial={false} animate={{ rotate: isDark ? 180 : 0 }} transition={{ duration: 0.5, ease: "backOut" }}>
            {isDark ? <span className="text-xl">☀️</span> : <span className="text-xl">🌙</span>}
          </motion.div>
        </button>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6">

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-500">
          {MAIN_LINKS.map(link => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive(link.href) ? 'text-slate-900 font-bold bg-slate-100/60' : 'hover:text-slate-900 hover:bg-slate-100/40'}`}
            >
              {link.label}
            </Link>
          ))}

          {/* FEATURES DROPDOWN */}
          <div ref={featuresRef} className="relative">
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isFeaturesActive || featuresOpen 
                  ? 'text-slate-900 font-bold bg-slate-100/60' 
                  : 'hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Features
              <svg 
                width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 5l3 3 3-3" />
              </svg>
            </button>

            <AnimatePresence>
              {featuresOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-2 w-80 bg-slate-100 border border-slate-300 rounded-2xl shadow-lg overflow-hidden z-[60]"
                >
                  <div className="p-3 grid grid-cols-1 gap-1">
                    {FEATURES_LINKS.map(link => (
                      <Link 
                        key={link.href}
                        href={link.href}
                        className={`group flex items-start gap-4 p-3 rounded-xl transition-all duration-200 ${
                          isActive(link.href) ? 'bg-slate-100' : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="text-2xl mt-0.5 grayscale group-hover:grayscale-0 transition-all">{link.icon}</div>
                        <div>
                          <div className={`text-sm font-bold mb-0.5 ${isActive(link.href) ? 'text-teal-600' : 'text-slate-200 group-hover:text-teal-600'} transition-colors`}>{link.label}</div>
                          <div className="text-xs text-slate-500 font-medium">{link.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ⓘ Info Button — VERY LAST after all links */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="ml-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors text-sm font-bold text-slate-600 hover:bg-slate-100"
            style={{ border: '1.5px solid #cbd5e1', fontSize: '14px', width: '28px', height: '28px' }}
            aria-label="Data Sources"
          >
            ⓘ
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button className="md:hidden text-slate-600 p-2" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-full left-0 w-full bg-slate-100 border-b border-slate-200 md:hidden overflow-hidden z-50 origin-top"
            >
              <div className="p-4 flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-1 tracking-wider">Pages</div>
                {MAIN_LINKS.map(link => (
                  <Link key={link.href} href={link.href} className="px-4 py-3 rounded-xl text-slate-600 font-semibold hover:text-teal-600 hover:bg-slate-100">
                    {link.label}
                  </Link>
                ))}
                <div className="h-px w-full bg-slate-100 my-2" />
                <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-1 tracking-wider">Features</div>
                {FEATURES_LINKS.map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-semibold hover:text-teal-600 hover:bg-slate-100">
                    <span className="text-lg grayscale">{link.icon}</span> {link.label}
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
              className="absolute inset-0 bg-slate-100/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-slate-100 border border-slate-300 rounded-3xl shadow-lg z-10 p-6 sm:p-8"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>

              <h2 className="text-2xl font-black text-slate-900 mb-6 pr-10">Data Sources & Methodology</h2>
              
              <div className="overflow-x-auto border border-slate-200 rounded-2xl mb-8">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100/80 text-slate-600">
                    <tr>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Data Point</th>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Value</th>
                      <th className="px-5 py-3 font-extrabold uppercase tracking-widest text-[11px]">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium text-slate-500">
                    {[
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
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-100/30">
                        <td className="px-5 py-3 text-slate-200 font-semibold">{row.point}</td>
                        <td className="px-5 py-3 font-mono text-teal-600">{row.val}</td>
                        <td className="px-5 py-3">{row.src}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}

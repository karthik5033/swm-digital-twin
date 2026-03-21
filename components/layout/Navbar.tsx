'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const MAIN_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/osm', label: 'OSM' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/routes', label: 'Routes' },
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
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close features dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (featuresRef.current && !featuresRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setFeaturesOpen(false);
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;
  const isFeaturesActive = FEATURES_LINKS.some(l => pathname === l.href);

  return (
    <nav className="relative flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" onClick={() => setIsOpen(false)} className="font-extrabold text-2xl tracking-tight text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-2">
        <span className="text-xl">🛰</span> AstraCity
      </Link>
      
      <div className="flex items-center gap-2 md:gap-6">
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-400">
          {MAIN_LINKS.map(link => (
            <div key={link.href} className="flex items-center">
              <Link 
                href={link.href} 
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${isActive(link.href) ? 'text-white font-bold bg-slate-800/60' : 'hover:text-white hover:bg-slate-800/40'}`}
              >
                {link.label}
              </Link>
            </div>
          ))}

          {/* FEATURES DROPDOWN */}
          <div ref={featuresRef} className="relative">
            <button 
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isFeaturesActive || featuresOpen 
                  ? 'text-white font-bold bg-slate-800/60' 
                  : 'hover:text-white hover:bg-slate-800/40'
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
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                >
                  <div className="p-2">
                    <div className="px-3 pt-3 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dashboards</span>
                    </div>

                    {FEATURES_LINKS.map((link, i) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setFeaturesOpen(false)}
                        className={`flex items-start gap-3 px-3 py-3 rounded-xl transition-all duration-150 group ${
                          isActive(link.href) 
                            ? 'bg-teal-500/15 text-teal-300' 
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span className="text-xl mt-0.5 group-hover:scale-110 transition-transform">{link.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">{link.label}</div>
                          <div className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors leading-tight mt-0.5">{link.desc}</div>
                        </div>
                        {isActive(link.href) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 shrink-0" />
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Bottom accent */}
                  <div className="border-t border-slate-700/50 px-5 py-3 bg-slate-800/30">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                      <span>All dashboards use real HSR Layout data</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="md:hidden text-slate-400 p-2 focus:outline-none hover:text-white transition-colors" 
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
            className="absolute top-full left-0 w-full bg-slate-900 border-b border-slate-700 md:hidden overflow-hidden origin-top"
          >
            <div className="flex flex-col">
              {MAIN_LINKS.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsOpen(false)}
                  className={`block w-full py-4 px-6 border-b border-slate-800 font-semibold transition-colors ${
                    isActive(link.href) ? 'text-teal-400 bg-slate-800/50' : 'text-slate-300 hover:text-teal-400 hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Features Accordion */}
              <button
                onClick={() => setMobileExpanded(!mobileExpanded)}
                className={`w-full py-4 px-6 border-b border-slate-800 font-semibold text-left flex items-center justify-between transition-colors ${
                  mobileExpanded || isFeaturesActive ? 'text-teal-400 bg-slate-800/50' : 'text-slate-300'
                }`}
              >
                <span>Features</span>
                <svg 
                  width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${mobileExpanded ? 'rotate-180' : ''}`}
                >
                  <path d="M3 5l3 3 3-3" />
                </svg>
              </button>
              
              <AnimatePresence>
                {mobileExpanded && (
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: 'auto' }} 
                    exit={{ height: 0 }} 
                    className="overflow-hidden bg-slate-800/30"
                  >
                    {FEATURES_LINKS.map(link => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => { setIsOpen(false); setMobileExpanded(false); }}
                        className={`flex items-center gap-3 py-3.5 px-8 border-b border-slate-800/50 transition-colors ${
                          isActive(link.href) ? 'text-teal-400' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{link.icon}</span>
                        <span className="font-medium text-sm">{link.label}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </nav>
  );
}

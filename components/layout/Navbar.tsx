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
  { href: '/impact', label: 'Impact' },
  { href: '/wards', label: 'Wards' },
  { href: '/report', label: 'Report' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

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
        <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {LINKS.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              {link.label}
            </Link>
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
    </nav>
  );
}

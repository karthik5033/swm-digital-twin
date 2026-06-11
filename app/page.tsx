'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { HSR_DATA } from '@/lib/constants';
import wardScoresData from '@/data/ward_scores.json';

// Animated counter hook
function useCounter(target: number, duration = 2.2, decimals = 0) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN'),
  );
  const [display, setDisplay] = useState(decimals > 0 ? '0.0' : '0');

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return unsub;
  }, [rounded]);

  useEffect(() => {
    const ctrl = animate(motionVal, target, {
      duration,
      ease: [0.22, 0.61, 0.36, 1],
    });
    return ctrl.stop;
  }, [motionVal, target, duration]);

  return display;
}


// ============================================
// FLOATING SCAN TEXT (bottom-left)
// ============================================
function ScanText() {
  const lines = [
    'SCANNING BENGALURU...',
    '704 HA MAPPED',
    '29 DUMPS DETECTED',
    'ROUTE OPTIMIZING...',
    '9,471 BUILDINGS INDEXED',
    'SATELLITE PASS COMPLETE',
  ];
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let charIdx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (charIdx <= lines[index].length) {
        setText(lines[index].slice(0, charIdx));
        charIdx++;
        timeout = setTimeout(type, 40);
      } else {
        timeout = setTimeout(() => {
          setFading(true);
          timeout = setTimeout(() => {
            setFading(false);
            setIndex((prev) => (prev + 1) % lines.length);
          }, 800);
        }, 1500);
      }
    };
    type();

    return () => clearTimeout(timeout);
  }, [index]);

  return (
    <div
      className="fixed bottom-6 left-6 z-20 font-mono text-[11px] tracking-widest transition-opacity duration-700"
      style={{ color: 'rgba(0,212,170,0.45)', opacity: fading ? 0 : 1 }}
    >
      <span className="inline-block w-1.5 h-3 bg-teal-500/40 mr-1.5 animate-pulse" />
      {text}
    </div>
  );
}

// Dark Stat card for space theme
function StatCard({ value, prefix, suffix, label, subtext, delay }: { value: string; prefix?: string; suffix?: string; label: string; subtext?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex flex-col items-center px-8 py-6 rounded-3xl min-w-[220px] bg-black/40 border border-white/10 backdrop-blur-xl hover:bg-black/50 hover:border-white/20 transition-all text-center group shadow-2xl"
    >
      <span className="text-4xl md:text-5xl font-black tabular-nums tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-teal-400 to-emerald-300 mb-1 group-hover:scale-105 transition-transform" style={{ fontFamily: 'var(--font-space-mono)' }}>
        {prefix}{value}{suffix}
      </span>
      <span className="mt-2 text-xs font-extrabold uppercase tracking-[0.15em] text-white/80">
        {label}
      </span>
      {subtext && (
        <span className="mt-1.5 text-[11px] font-medium text-slate-200 max-w-[180px] leading-relaxed">
          {subtext}
        </span>
      )}
    </motion.div>
  );
}

// Features Grid 
const FEATURES = [
  { title: 'Satellite AI', desc: 'Auto-detect illegal dumps using Sentinel-2 visible spectrum imagery.', icon: '🛰️' },
  { title: 'Digital Twin', desc: 'Simulate the impact of policy decisions ward-by-ward before deployment.', icon: '🌐' },
  { title: 'Methane Mapping', desc: 'Monitor atmospheric methane buildup and calculate carbon offsets.', icon: '☁️' },
  { title: 'Route Optimization', desc: 'Cut millions in fuel waste by dynamically rerouting collection vehicles.', icon: '🚛' },
  { title: 'Economic Analytics', desc: 'Translate environmental impact directly into quantifiable rupees saved.', icon: '💰' },
  { title: 'Carbon Intelligence', desc: 'Track CO2e captures and carbon credit valuation across the ward.', icon: '🌿' },
];

export default function Home() {
  const population = useCounter(HSR_DATA.population_building_based, 2.4, 0);
  const totalWaste = useCounter(HSR_DATA.daily_waste_tons, 2.6, 1); 
  const routeSaving = useCounter(HSR_DATA.route_improvement_pct, 2.0, 1);
  const savedCrores = useCounter(HSR_DATA.annual_savings_total_cr, 2.0, 1);

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans" style={{ background: '#000814' }}>
      {/* Cinematic Background Video with Vignette Overlays */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full object-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-105"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Overlays to ensure text visibility */}
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000814]/80 via-[#000814]/20 to-[#000814]/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000814] via-transparent to-transparent opacity-90" />
      </div>
      <ScanText />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 min-h-[75vh] max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10 bg-white/5 backdrop-blur-sm border border-white/10"
        >
          <span className="text-sm border-r border-white/20 pr-3">🛰</span>
          <span className="text-[13px] font-black tracking-widest text-teal-400 uppercase">Space Tech · Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-2xl"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-teal-100 to-teal-400">AstraCity</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-3xl font-extrabold tracking-tight mb-6 text-teal-400"
        >
          Simulate. Predict. Optimize. Decarbonize.
        </motion.p>

        <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="text-lg md:text-xl max-w-3xl mb-16 leading-relaxed text-slate-100 font-semibold drop-shadow-md"
        >
          Satellite + Census intelligence for HSR Layout&apos;s 1,10,000 residents across 7 sectors, 18.5 sq km, 9,471 buildings.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-20">
          <StatCard value={population} label="Residents (2025)" subtext="Building × Census 2011 Karnataka" delay={0.8} />
          <StatCard value={totalWaste} suffix=" Tons" label="Daily waste generated" subtext="CPCB 0.5kg/person · 9,471 buildings" delay={0.9} />
          <StatCard value={routeSaving} suffix="%" label="Route optimization" subtext="132km → 32km · 2,027 road segments" delay={1.0} />
          <StatCard value={savedCrores} prefix="₹" suffix=" Cr" label="Annual value identified" subtext="₹4.2Cr ops + ₹5.2Cr carbon credits" delay={1.1} />
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Powered by Orbital Intelligence</h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">From 400 miles above to the streets of Bengaluru.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-black/40 border border-white/10 p-10 rounded-[2rem] backdrop-blur-xl hover:-translate-y-2 hover:bg-black/60 hover:border-teal-500/50 shadow-2xl transition-all duration-300 group"
            >
              <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110 origin-left">{f.icon}</div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{f.title}</h3>
              <p className="text-slate-200 text-sm md:text-base leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Premium Intelligence Matrix */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full flex flex-col items-center">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Live Intelligence Matrix</h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-semibold drop-shadow-md">Real-time geospatial risk analysis and automated threat detection.</p>
        </div>

        <div className="w-full max-w-5xl bg-black/60 p-1 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs font-mono text-slate-400 tracking-widest uppercase ml-4 hidden sm:inline-block">System Terminal // Active</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
               <span className="text-xs font-mono text-teal-400 tracking-widest">LIVE</span>
            </div>
          </div>
          
          {/* Terminal Body */}
          <div className="p-2 sm:p-6 font-mono text-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="pb-3 pl-4 font-medium uppercase tracking-wider">Target Node</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">Coordinates</th>
                  <th className="pb-3 font-medium uppercase tracking-wider">Threat Level</th>
                  <th className="pb-3 pr-4 font-medium uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {wardScoresData.slice(0, 5).map((ward: { id: string | number; score: number; name: string }, idx: number) => (
                  <tr key={ward.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 pl-4 flex items-center gap-3">
                      <span className="text-teal-500/50 group-hover:text-teal-400 transition-colors">[{ward.id}]</span>
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{ward.name}</span>
                    </td>
                    <td className="py-4 text-slate-500 text-xs group-hover:text-slate-400 transition-colors">12.93{idx}4°N, 77.6{idx}2°E</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden">
                           <div className={`h-full ${ward.score <= 40 ? 'bg-rose-500 w-[85%]' : ward.score <= 70 ? 'bg-amber-500 w-[55%]' : 'bg-emerald-500 w-[20%]'}`}></div>
                        </div>
                        <span className={`text-xs tracking-wider ${ward.score <= 40 ? 'text-rose-400' : ward.score <= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {ward.score <= 40 ? 'CRITICAL' : ward.score <= 70 ? 'ELEVATED' : 'NOMINAL'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                       {ward.score <= 40 ? (
                         <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-[10px] uppercase tracking-wider border border-rose-500/20 animate-pulse">Action Req</span>
                       ) : (
                         <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[10px] uppercase tracking-wider border border-emerald-500/10">Monitoring</span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Closing CTA Pitch */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32 w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-black/50 border border-teal-500/30 backdrop-blur-2xl p-12 md:p-20 rounded-[4rem] relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-900/30 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-900/30 rounded-full blur-[100px] pointer-events-none" />
          
          <svg className="w-16 h-16 text-teal-500 mx-auto mb-8 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998zm-11.028 0v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998z"/></svg>

          <p className="text-2xl md:text-4xl font-bold text-white/90 leading-snug mb-12 italic relative z-10">
            &quot;Bengaluru generates 5,000 tons of waste every day. No one knows in real time where illegal dumps are forming... AstraCity calculates — to the rupee — how much money these optimizations save the government.&quot;
          </p>

          <Link
            href="/map"
            className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 rounded-full text-xl font-black transition-all duration-300 bg-teal-500 text-slate-900 shadow-[0_10px_30px_rgb(20,184,166,0.3)] hover:bg-teal-400 hover:shadow-[0_15px_40px_rgb(20,184,166,0.4)] hover:-translate-y-1 z-10 overflow-hidden"
          >
            <span className="relative z-10">Launch Command Center</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform duration-300 group-hover:translate-x-2 relative z-10"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}

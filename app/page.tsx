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

// Particle field
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    interface Particle {
      x: number; y: number; r: number; vx: number; vy: number; o: number; colorType: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.15 - 0.05,
      o: Math.random() * 0.4 + 0.1,
      colorType: Math.random() > 0.5 ? 1 : 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = window.innerWidth;
        if (p.x > window.innerWidth) p.x = 0;
        if (p.y < 0) p.y = window.innerHeight;
        if (p.y > window.innerHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // Soft teal or slate for light mode
        ctx.fillStyle = p.colorType === 1 ? `rgba(13, 148, 136, ${p.o})` : `rgba(148, 163, 184, ${p.o})`; 
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" aria-hidden="true" />;
}

// Light Stat card
function StatCard({ value, prefix, suffix, label, subtext, delay }: { value: string; prefix?: string; suffix?: string; label: string; subtext?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex flex-col items-center px-8 py-6 rounded-3xl min-w-[220px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-md transition-all text-center group"
    >
      <span className="text-4xl md:text-5xl font-black tabular-nums tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-teal-600 to-emerald-500 mb-1 drop-shadow-sm group-hover:scale-105 transition-transform" style={{ fontFamily: 'var(--font-space-mono)' }}>
        {prefix}{value}{suffix}
      </span>
      <span className="mt-2 text-xs font-extrabold uppercase tracking-[0.15em] text-slate-800">
        {label}
      </span>
      {subtext && (
        <span className="mt-1.5 text-[11px] font-medium text-slate-500 max-w-[180px] leading-relaxed">
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
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen relative overflow-hidden flex flex-col font-sans transition-colors">
      <ParticleField />
      
      {/* Background radial gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-300 rounded-full blur-[160px] pointer-events-none opacity-20" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-300 rounded-full blur-[160px] pointer-events-none opacity-20" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-32 pb-24 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-10 bg-white/60 backdrop-blur-sm border border-slate-200 shadow-sm"
        >
          <span className="text-sm border-r border-slate-300 pr-3">🛰</span>
          <span className="text-[13px] font-black tracking-widest text-teal-700 uppercase">Space Tech · Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 drop-shadow-sm">AstraCity</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-3xl font-extrabold tracking-tight mb-6 text-teal-600"
        >
          Simulate. Predict. Optimize. Decarbonize.
        </motion.p>

        <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="text-lg md:text-xl max-w-3xl mb-16 leading-relaxed text-slate-600 font-medium"
        >
          Satellite + Census intelligence for HSR Layout's 46,219 residents across 7 sectors, 18.5 sq km, 9,471 buildings.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8 mb-20">
          <StatCard value={population} label="Residents (2025)" subtext="Building × Census 2011 Karnataka" delay={0.8} />
          <StatCard value={totalWaste} suffix=" Tons" label="Daily waste generated" subtext="CPCB 0.5kg/person · 9,471 buildings" delay={0.9} />
          <StatCard value={routeSaving} suffix="%" label="Route optimization" subtext="132km → 32km · 2,027 road segments" delay={1.0} />
          <StatCard value={savedCrores} prefix="₹" suffix=" Cr" label="Annual value identified" subtext="₹4.2Cr ops + ₹5.2Cr carbon credits" delay={1.1} />
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full border-t border-slate-200/60 bg-white/30 backdrop-blur-xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Powered by Orbital Intelligence</h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">From 400 miles above to the streets of Bengaluru.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white border border-slate-100 p-10 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:-translate-y-2 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-teal-200 transition-all duration-300 group"
            >
              <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110 origin-left">{f.icon}</div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{f.title}</h3>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Ward Map Preview */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full flex flex-col items-center">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Live Governance Grid</h2>
          <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">Sample visualization of ward risk scoring. Lower score alerts require immediate intervention.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl bg-white p-12 rounded-[3rem] border border-slate-100 shadow-[0_8px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-50 opacity-50 pointer-events-none" />
          {wardScoresData.map((ward: { id: string | number; score: number; name: string }, index: number) => {
             let colorClass = 'bg-emerald-500 shadow-emerald-500/30'; 
             if (ward.score <= 40) colorClass = 'bg-rose-500 animate-pulse shadow-rose-500/60 ring-2 ring-rose-300'; 
             else if (ward.score <= 70) colorClass = 'bg-amber-500 shadow-amber-500/30'; 

             return (
               <motion.div
                 key={ward.id}
                 initial={{ opacity: 0, scale: 0 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.02 }}
                 whileHover={{ scale: 1.4, zIndex: 10, borderRadius: '50%' }}
                 className={`w-12 h-12 rounded-xl cursor-help border border-white shadow-lg ${colorClass} relative z-10 transition-all duration-200`}
                 title={`${ward.name} \nScore: ${ward.score}`}
               />
             )
          })}
        </div>
      </section>

      {/* Closing CTA Pitch */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-32 w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white border border-teal-100 shadow-[0_20px_60px_rgb(13,148,136,0.1)] p-12 md:p-20 rounded-[4rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-100 rounded-full blur-[100px] pointer-events-none opacity-60" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-50 rounded-full blur-[100px] pointer-events-none opacity-60" />
          
          <svg className="w-16 h-16 text-teal-500 mx-auto mb-8 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998zm-11.028 0v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998z"/></svg>

          <p className="text-2xl md:text-4xl font-bold text-slate-800 leading-snug mb-12 italic relative z-10">
            &quot;Bengaluru generates 5,000 tons of waste every day. No one knows in real time where illegal dumps are forming... AstraCity calculates — to the rupee — how much money these optimizations save the government.&quot;
          </p>

          <Link
            href="/map"
            className="group relative inline-flex items-center justify-center gap-4 px-12 py-6 rounded-full text-xl font-black transition-all duration-300 bg-teal-500 text-white shadow-[0_10px_30px_rgb(20,184,166,0.3)] hover:bg-teal-400 hover:shadow-[0_15px_40px_rgb(20,184,166,0.4)] hover:-translate-y-1 z-10 overflow-hidden"
          >
            <span className="relative z-10">Launch Command Center</span>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform duration-300 group-hover:translate-x-2 relative z-10"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <div className="absolute inset-0 h-full w-full scale-0 rounded-full transition-all duration-300 group-hover:scale-100 group-hover:bg-white/20" />
          </Link>
        </motion.div>
      </section>

    </div>
  );
}

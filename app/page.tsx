'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
      x: number; y: number; r: number; vx: number; vy: number; o: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15 - 0.08,
      o: Math.random() * 0.35 + 0.08,
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
        ctx.fillStyle = `rgba(45, 212, 191, ${p.o})`; // Teal accent #2dd4bf
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

// Dark Stat card
function StatCard({ value, prefix, suffix, label, delay }: { value: string; prefix?: string; suffix?: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex flex-col items-center px-6 py-5 rounded-2xl min-w-[170px] bg-white border border-slate-200 dark:border-teal-500/20 dark:bg-white/5 shadow-sm dark:shadow-[0_0_15px_rgba(45,212,191,0.05)] backdrop-blur-sm transition-colors"
    >
      <span className="text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight text-[#2dd4bf]" style={{ fontFamily: 'var(--font-space-mono)' }}>
        {prefix}{value}{suffix}
      </span>
      <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
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
  { title: 'Policy Simulation', desc: 'Pressure-test the city against population surges and heavy monsoons.', icon: '📊' },
];

export default function Home() {
  const savedCrores = useCounter(4.2, 2.4, 1);
  const dumpsDetected = useCounter(847, 2.6);
  const methaneReduction = useCounter(23, 2.0);

  return (
    <div className="bg-slate-50 dark:bg-[#03080f] text-slate-900 dark:text-slate-200 min-h-screen relative overflow-hidden flex flex-col font-sans transition-colors">
      <ParticleField />
      
      {/* Background radial gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2dd4bf] rounded-full blur-[150px] pointer-events-none opacity-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full blur-[150px] pointer-events-none opacity-10" />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-32 pb-20 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 bg-[#2dd4bf]/10 border border-[#2dd4bf]/30"
        >
          <span className="text-sm border-r border-[#2dd4bf]/30 pr-2">🛰</span>
          <span className="text-[12px] font-bold tracking-widest text-[#2dd4bf] uppercase">Space Tech · Intelligence</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white mb-6"
        >
          AstraCity
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-2xl font-bold tracking-wide mb-6 text-[#2dd4bf]"
        >
          Simulate. Predict. Optimize. Decarbonize.
        </motion.p>

        <motion.p
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.8, delay: 0.6 }}
           className="text-base md:text-xl max-w-3xl mb-14 leading-relaxed text-slate-600 dark:text-slate-400"
        >
          A policy simulation AI platform that maps Bengaluru&apos;s waste ecosystem using
          satellite intelligence, predicts illegal dumping, models methane emissions, and
          quantifies ₹ crores in government savings.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
          <StatCard value={savedCrores} prefix="₹" suffix=" Cr" label="Saved Annually" delay={0.8} />
          <StatCard value={dumpsDetected} label="Dumps Detected" delay={0.9} />
          <StatCard value={methaneReduction} suffix="%" label="Methane Reduced" delay={1.0} />
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full border-t border-slate-200 dark:border-white/5 transition-colors">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Powered by Orbital Intelligence</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">From 400 miles above to the streets of Bengaluru.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-3xl hover:bg-slate-50 dark:hover:bg-white/10 hover:border-teal-500/40 dark:hover:border-[#2dd4bf]/40 transition-all group shadow-sm dark:shadow-none"
            >
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{f.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Ward Map Preview */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full border-t border-slate-200 dark:border-white/5 flex flex-col items-center transition-colors">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Live Governance Grid</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Sample visualization of ward risk scoring. Lower score alerts require immediate intervention.</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center max-w-3xl bg-slate-100 dark:bg-black/40 p-10 rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-inner dark:shadow-none">
          {wardScoresData.map((ward: any, index: number) => {
             let colorClass = 'bg-[#059669]'; // green
             if (ward.score <= 40) colorClass = 'bg-[#e11d48] animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.6)]'; // red
             else if (ward.score <= 70) colorClass = 'bg-[#d97706]'; // amber

             return (
               <motion.div
                 key={ward.id}
                 initial={{ opacity: 0, scale: 0 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: index * 0.02 }}
                 whileHover={{ scale: 1.3, zIndex: 10 }}
                 className={`w-10 h-10 rounded-lg cursor-pointer border border-[#03080f] shadow-lg ${colorClass}`}
                 title={`${ward.name} - Score: ${ward.score}`}
               />
             )
          })}
        </div>
      </section>

      {/* Closing CTA Pitch */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-40 w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 p-10 md:p-14 rounded-[3rem] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2dd4bf] rounded-full blur-[100px] pointer-events-none opacity-20" />
          
          <svg className="w-12 h-12 text-[#2dd4bf] mx-auto mb-6 opacity-80" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998zm-11.028 0v-7.391c0-5.714 4.148-9.015 9.009-11.609l-2.016-1.571c-3.1 2.308-8.991 6.942-8.991 13.178v7.393h1.998z"/></svg>

          <p className="text-xl md:text-3xl font-medium text-slate-800 dark:text-white leading-relaxed mb-10 italic">
            "Bengaluru generates 5,000 tons of waste every day. No one knows in real time where illegal dumps are forming... AstraCity calculates — to the rupee — how much money these optimizations save the government."
          </p>

          <Link
            href="/map"
            className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-lg font-black transition-all duration-300 bg-[#2dd4bf] text-[#03080f] shadow-[0_0_40px_rgba(45,212,191,0.4)] hover:bg-teal-100 hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:-translate-y-1"
          >
            Launch Command Center
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}

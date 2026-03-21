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
// SPACE BACKGROUND CANVAS
// ============================================
function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
    }));

    // Satellites
    const makeSat = (y: number, dx: number, dy: number, color: string) => ({
      x: dx > 0 ? -50 : W + 50,
      y,
      dx,
      dy,
      trail: [] as { x: number; y: number }[],
      color,
    });

    const satellites = [
      makeSat(H * 0.18, 0.8, 0.1, 'teal'),
      makeSat(H * 0.55, -0.6, -0.15, 'white'),
      makeSat(H * 0.78, 1.2, -0.3, 'blue'),
    ];

    const satColors: Record<string, (a: number) => string> = {
      teal: (a) => `rgba(0,212,170,${a})`,
      white: (a) => `rgba(255,255,255,${a})`,
      blue: (a) => `rgba(96,165,250,${a})`,
    };

    // Data detection points
    interface DataPt {
      x: number; y: number; opacity: number; growing: boolean; label: string;
    }
    const dataPoints: DataPt[] = [];
    const labels = ['DUMP DETECTED', 'SCANNING...', 'ANOMALY FOUND', 'PROCESSING...'];

    let scanY = 0;
    let frame = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Deep space gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#000814');
      bg.addColorStop(0.5, '#001a2e');
      bg.addColorStop(1, '#002a1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Earth glow bottom
      const eg = ctx.createRadialGradient(W / 2, H + 200, 100, W / 2, H + 200, 600);
      eg.addColorStop(0, 'rgba(13,148,136,0.4)');
      eg.addColorStop(0.5, 'rgba(5,150,105,0.15)');
      eg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = eg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (const s of stars) {
        s.twinkle += s.speed;
        const a = Math.sin(s.twinkle) * 0.4 + 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(0,212,170,0.03)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Scan line
      scanY += 1.5;
      if (scanY > H) scanY = 0;
      const sg = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      sg.addColorStop(0, 'rgba(0,212,170,0)');
      sg.addColorStop(0.5, 'rgba(0,212,170,0.08)');
      sg.addColorStop(1, 'rgba(0,212,170,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, scanY - 20, W, 40);

      // Satellites
      for (const sat of satellites) {
        sat.x += sat.dx;
        sat.y += sat.dy;
        if (sat.dx > 0 && sat.x > W + 100) { sat.x = -50; sat.trail = []; }
        if (sat.dx < 0 && sat.x < -100) { sat.x = W + 50; sat.trail = []; }

        sat.trail.push({ x: sat.x, y: sat.y });
        if (sat.trail.length > 40) sat.trail.shift();

        const colorFn = satColors[sat.color];
        for (let i = 0; i < sat.trail.length; i++) {
          const a = (i / sat.trail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(sat.trail[i].x, sat.trail[i].y, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = colorFn(a);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sat.x, sat.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = colorFn(1);
        ctx.fill();

        const glow = ctx.createRadialGradient(sat.x, sat.y, 0, sat.x, sat.y, 8);
        glow.addColorStop(0, colorFn(0.5));
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sat.x, sat.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn data points
      frame++;
      if (frame % 120 === 0) {
        dataPoints.push({
          x: Math.random() * W * 0.8 + W * 0.1,
          y: Math.random() * H * 0.7 + H * 0.1,
          opacity: 0,
          growing: true,
          label: labels[Math.floor(Math.random() * labels.length)],
        });
      }

      // Draw data points
      for (let i = dataPoints.length - 1; i >= 0; i--) {
        const pt = dataPoints[i];
        if (pt.growing) { pt.opacity += 0.02; if (pt.opacity >= 1) pt.growing = false; }
        else { pt.opacity -= 0.01; }

        if (pt.opacity <= 0) { dataPoints.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,212,170,${pt.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,170,${pt.opacity})`;
        ctx.fill();

        ctx.font = '9px monospace';
        ctx.fillStyle = `rgba(0,212,170,${pt.opacity * 0.8})`;
        ctx.fillText(pt.label, pt.x + 12, pt.y - 8);

        ctx.font = '8px monospace';
        ctx.fillStyle = `rgba(0,212,170,${pt.opacity * 0.5})`;
        ctx.fillText(`${(12.89 + Math.random() * 0.04).toFixed(4)}°N`, pt.x + 12, pt.y + 4);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" />;
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
      className="flex flex-col items-center px-8 py-6 rounded-3xl min-w-[220px] bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-all text-center group"
    >
      <span className="text-4xl md:text-5xl font-black tabular-nums tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-teal-400 to-emerald-300 mb-1 group-hover:scale-105 transition-transform" style={{ fontFamily: 'var(--font-space-mono)' }}>
        {prefix}{value}{suffix}
      </span>
      <span className="mt-2 text-xs font-extrabold uppercase tracking-[0.15em] text-white/80">
        {label}
      </span>
      {subtext && (
        <span className="mt-1.5 text-[11px] font-medium text-slate-400 max-w-[180px] leading-relaxed">
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
      <SpaceBackground />
      <ScanText />

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center px-6 pt-32 pb-24 max-w-6xl mx-auto text-center">
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
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-6"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-teal-200 to-teal-400">AstraCity</span>
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
           className="text-lg md:text-xl max-w-3xl mb-16 leading-relaxed text-slate-300 font-medium"
        >
          Satellite + Census intelligence for HSR Layout&apos;s 46,219 residents across 7 sectors, 18.5 sq km, 9,471 buildings.
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
              className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-sm hover:-translate-y-2 hover:bg-white/10 hover:border-teal-500/30 transition-all duration-300 group"
            >
              <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-300 transform group-hover:scale-110 origin-left">{f.icon}</div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{f.title}</h3>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Ward Map Preview */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24 w-full flex flex-col items-center">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Live Governance Grid</h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">Sample visualization of ward risk scoring. Lower score alerts require immediate intervention.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 justify-center max-w-3xl bg-white/5 p-12 rounded-[3rem] border border-white/10 backdrop-blur-sm relative overflow-hidden">
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
                 className={`w-12 h-12 rounded-xl cursor-help border border-white/20 shadow-lg ${colorClass} relative z-10 transition-all duration-200`}
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
          className="bg-white/5 border border-teal-500/20 backdrop-blur-md p-12 md:p-20 rounded-[4rem] relative overflow-hidden"
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

'use client';

import Link from 'next/link';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Animated counter hook                                               */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Particle field (subtle floating dots)                               */
/* ------------------------------------------------------------------ */
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
        ctx.fillStyle = `rgba(0, 212, 170, ${p.o})`;
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

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */
function StatCard({
  value,
  prefix,
  suffix,
  label,
  delay,
}: {
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex flex-col items-center px-6 py-5 rounded-2xl min-w-[170px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="text-3xl md:text-4xl font-bold tabular-nums text-white tracking-tight">
        {prefix}
        {value}
        {suffix}
      </span>
      <span
        className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature pills                                                       */
/* ------------------------------------------------------------------ */
const FEATURES = [
  'Satellite AI',
  'Digital Twin',
  'Methane Mapping',
  'Route Optimization',
  'Economic Analytics',
  'Policy Simulation',
];

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function Home() {
  const savedCrores = useCounter(4.2, 2.4, 1);
  const dumpsDetected = useCounter(847, 2.6);
  const methaneReduction = useCounter(23, 2.0);

  return (
    <div
      id="landing-page"
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        minHeight: '100vh',
        /* dark space gradient background */
        background:
          'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(0,212,170,0.06) 0%, transparent 60%), ' +
          'radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.05) 0%, transparent 50%), ' +
          'linear-gradient(180deg, #070b17 0%, #0a0f1e 40%, #0d1225 100%)',
      }}
    >
      <ParticleField />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ---- Content ---- */}
      <div className="relative z-10 flex flex-col items-center px-6 py-20 max-w-5xl mx-auto">
        {/* Pill badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{
            background: 'rgba(0,212,170,0.08)',
            border: '1px solid rgba(0,212,170,0.18)',
          }}
        >
          <span className="text-sm">🛰</span>
          <span
            className="text-[12px] font-semibold tracking-wide"
            style={{ color: '#00d4aa' }}
          >
            Space Tech · Solid Waste Intelligence
          </span>
        </motion.div>

        {/* Hero title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white mb-5"
          style={{
            textShadow: '0 0 80px rgba(0,212,170,0.15), 0 0 160px rgba(0,212,170,0.06)',
          }}
        >
          AstraCity
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl font-medium tracking-wide mb-4"
          style={{ color: '#00d4aa' }}
        >
          Simulate. Predict. Optimize. Decarbonize.
        </motion.p>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="text-sm md:text-base max-w-2xl mb-14 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          A policy simulation AI platform that maps Bengaluru&apos;s waste ecosystem using
          satellite intelligence, predicts illegal dumping, models methane emissions, and
          quantifies ₹ crores in government savings.
        </motion.p>

        {/* Stat counters */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-14">
          <StatCard
            value={savedCrores}
            prefix="₹"
            suffix=" Cr"
            label="Saved Annually"
            delay={0.9}
          />
          <StatCard
            value={dumpsDetected}
            label="Illegal Dumps Detected"
            delay={1.05}
          />
          <StatCard
            value={methaneReduction}
            suffix="%"
            label="Methane Reduction"
            delay={1.2}
          />
        </div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          <Link
            id="enter-astracity-btn"
            href="/map"
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-bold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00d4aa, #00b894)',
              color: '#0a0f1e',
              boxShadow:
                '0 0 30px rgba(0,212,170,0.25), 0 4px 20px rgba(0,212,170,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 50px rgba(0,212,170,0.4), 0 8px 32px rgba(0,212,170,0.35)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 30px rgba(0,212,170,0.25), 0 4px 20px rgba(0,212,170,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Enter AstraCity
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                d="M5 12h14M12 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Glow ring */}
            <span
              className="absolute inset-0 rounded-xl pointer-events-none animate-pulse"
              style={{
                boxShadow: '0 0 40px rgba(0,212,170,0.15)',
              }}
            />
          </Link>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.7 }}
          className="flex flex-wrap justify-center gap-2.5 mt-16"
        >
          {FEATURES.map((f, i) => (
            <span
              key={f}
              className="px-4 py-1.5 rounded-full text-[12px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.5)',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {f}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0f1e] to-transparent z-[1]" />
    </div>
  );
}

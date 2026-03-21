'use client';
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useSpring, useTransform } from 'framer-motion';

import { Skeleton } from "@/components/ui/Skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ComposedChart } from 'recharts';

// --- Icons ---
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const WasteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const MapIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
);
const TrendingDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
);
const CloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (current) => 
    Number.isInteger(value) ? Math.round(current).toLocaleString() : current.toFixed(1)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

const getWeather = async () => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=Bangalore&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_KEY}&units=metric`
  )
  const data = await res.json()
  return data.list.slice(0, 10).map(
    (item: any, idx: number) => ({
      day: idx + 1,
      temp: item.main.temp,
      rainfall: item.rain?.['3h'] || 0,
      humidity: item.main.humidity,
      description: item.weather[0].description
    })
  )
}

const FESTIVAL_DAYS: Record<number, { name: string; factor: number }> = {
  3: { name: "Weekend", factor: 1.10 },
  7: { name: "Local Event", factor: 1.15 }
}

export default function SimulationPanel() {
  const [demolition, setDemolition] = useState(false);
  const [apartments, setApartments] = useState(false);
  const [encroachment, setEncroachment] = useState(false);
  const [extraAutos, setExtraAutos] = useState(false);
  const [segregation, setSegregation] = useState(0);

  const [rainfallValue, setRainfallValue] = useState(5);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [festivalEnabled, setFestivalEnabled] = useState(false);
  const [festivalType, setFestivalType] = useState('none');
  const [apiError, setApiError] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wardList, setWardList] = useState<string[]>([]);

  useEffect(() => {
    getWeather().then(data => {
      setWeatherData(data);
      if (data.length > 0) {
        setRainfallValue(data[0].rainfall);
      }
    }).catch(console.error);

    fetch('/api/geojson').then(res => res.json()).then(data => {
      if (data.features) {
        const names = data.features.map((f: { properties: { name: string } }) => f.properties.name).sort();
        setWardList(names);
      }
    }).catch(console.error);

    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const baselineValues = {
    wasteGenerated: 54.0,
    dumpsPredicted: 14,
    landfillInflow: 35.0,
    methaneProjection: 420,
    subRoadCoverage: 89,
    costPerDay: 2100,
  };

  const [metrics, setMetrics] = useState({ ...baselineValues });

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setApiError(null);
    
    try {
      const response = await fetch('http://localhost:8000/run-digital-twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rainfall: rainfallValue,
          festival: festivalEnabled,
          festival_type: festivalType,
          days: 30
        })
      });
      
      if (!response.ok) throw new Error("Backend not responding");
      
      const data = await response.json();
      
      setMetrics({
        wasteGenerated: data.waste_prediction.total_waste_tons,
        dumpsPredicted: data.summary.critical_dumpyards + 14,
        landfillInflow: data.waste_prediction.total_waste_tons * 0.7,
        methaneProjection: 400 + data.summary.critical_dumpyards * 5,
        subRoadCoverage: data.route_optimization.road_coverage_after,
        costPerDay: 2100 - (data.route_optimization.annual_fuel_savings_inr / 365)
      });
      
      setIsRunning(false);
    } catch (error) {
      console.warn(error);
      setApiError("Backend offline — showing cached data");
      
      setTimeout(() => {
        const baseWaste = 54.0;
        let newWaste = baseWaste;
        let newDumps = 14;
        let newLandfill = 35.0;
        let newMethane = 420;
        let newCoverage = 89;
        let newCost = 2100;

        if (demolition) {
          newWaste += baseWaste * 0.40;
          newLandfill += (baseWaste * 0.40) * 0.9;
          newDumps += 3;
        }
        if (apartments) {
          newWaste += 5.0;
          newLandfill += 3.5;
          newMethane += 40;
        }
        if (encroachment) {
          newDumps += 8;
          newMethane += 20;
        }
        if (extraAutos) {
          newCoverage = 96;
          newCost += 800;
          newWaste += 4.2;
        }

        const reductionFactor = segregation * 0.008; 
        newWaste = newWaste - (baseWaste * reductionFactor);
        newLandfill = newLandfill - (newLandfill * (segregation * 0.012));
        newDumps = Math.max(0, newDumps - Math.floor(segregation / 5));
        newMethane = newMethane - (newMethane * (segregation * 0.01));

        setMetrics({
          wasteGenerated: Math.max(0, newWaste),
          dumpsPredicted: Math.max(0, newDumps),
          landfillInflow: Math.max(0, newLandfill),
          methaneProjection: Math.max(0, newMethane),
          subRoadCoverage: newCoverage,
          costPerDay: newCost
        });

        setIsRunning(false);
      }, 800);
    }
  };

  const forecast = React.useMemo(() => {
    if (!weatherData || weatherData.length === 0) return [];
    
    const BASE_WASTE = 23.26;
    const CAPACITY = 50.0;
    
    return weatherData.map(day => {
      let waste = BASE_WASTE;
      
      if (demolition) waste += BASE_WASTE * 0.40;
      if (apartments) waste += 5.0;
      
      if (day.rainfall > 10) waste *= 1.05;
      if (day.temp > 32) waste *= 1.02;
      
      const festival = FESTIVAL_DAYS[day.day];
      let eventName = "-";
      let isFestival = false;
      if (festival) {
        waste *= festival.factor;
        eventName = festival.name;
        isFestival = true;
      }
      
      if (extraAutos) waste += 4.2;
      const reductionFactor = segregation * 0.008; 
      waste = waste - (BASE_WASTE * reductionFactor);
      
      const riskScore = waste / CAPACITY;
      const risk = 
        riskScore > 0.85 ? 'CRITICAL' :
        riskScore > 0.65 ? 'HIGH' :
        riskScore > 0.45 ? 'MEDIUM' : 'LOW';

      // Round to 2 decimals
      waste = Math.round(waste * 100) / 100;

      // Wet/dry split
      // Source: BBMP 2013 chemical analysis
      const wet = Math.round(waste * 0.61 * 100) / 100;
      const dry = Math.round(waste * 0.30 * 100) / 100;

      // Cost calculation
      let cost = Math.round(31 * 20 * 10); // distance x fuel x trucks
      if (extraAutos) cost += 800;

      const dateStr = new Date(Date.now() + day.day * 86400000).toLocaleDateString('en-IN');

      return {
        ...day,
        dayLabel: `Day ${day.day}`,
        date: dateStr,
        waste,
        wet,
        dry,
        risk,
        riskScore,
        cost,
        event: eventName,
        isFestival,
        isRainy: day.rainfall > 10,
        capacityLimit: CAPACITY,
        baseWasteLine: BASE_WASTE
      };
    });
  }, [weatherData, demolition, apartments, encroachment, extraAutos, segregation]);

  const summary = React.useMemo(() => {
    if (!forecast || forecast.length === 0) return null;
    const today = forecast[0];
    const peakDay = forecast.reduce((prev, current) => (prev.waste > current.waste) ? prev : current);
    const highRiskDays = forecast.filter(d => d.risk === 'CRITICAL' || d.risk === 'HIGH').length;
    const totalWaste = forecast.reduce((sum, d) => sum + d.waste, 0).toFixed(1);
    return { today, peakDay, highRiskDays, totalWaste };
  }, [forecast]);


  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-[35%] bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-8 h-fit">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="bg-teal-50 text-teal-600 p-2.5 rounded-lg border border-teal-100">
              <SettingsIcon />
            </div>
            <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-800">HSR Layout Scenarios</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Predictive AI Model</p>
            </div>
          </div>

          {weatherData && weatherData.length > 0 && (
            <div className="bg-slate-800 text-white rounded-xl p-4 shadow-md flex flex-col justify-center relative overflow-hidden border border-slate-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[40px] rounded-full pointer-events-none" />
              <h3 className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest mb-3 z-10">Current Bengaluru Weather</h3>
              <div className="flex items-center justify-between z-10 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌡️</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Temp</span>
                    <span className="font-black leading-none">{Math.round(weatherData[0].temp)}°C</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌧️</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Rain</span>
                    <span className="font-black leading-none">{weatherData[0].rainfall} mm</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💧</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Humidity</span>
                    <span className="font-black leading-none">{weatherData[0].humidity}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">

            {/* HSR Scenario: Demolition Spikes */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Building Demolition Phase</span>
                <span className="text-xs font-medium text-slate-400">Massive C&D waste spike (+40%) from BDA Complex rebuild</span>
              </div>
              <button 
                onClick={() => setDemolition(!demolition)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${demolition ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${demolition ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Apartment Addition */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">New Apartment Complex</span>
                <span className="text-xs font-medium text-slate-400">Addition of +500 units near Sector 2 borders</span>
              </div>
              <button 
                onClick={() => setApartments(!apartments)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${apartments ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${apartments ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Open Space Encroachment */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Open Space Encroachment</span>
                <span className="text-xs font-medium text-slate-400">Illegal dumping high risk simulation near Agara Lake</span>
              </div>
              <button 
                onClick={() => setEncroachment(!encroachment)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${encroachment ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${encroachment ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* HSR Scenario: Fleet Optimization */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <span className="text-sm font-bold text-slate-700">Expand Collection Fleet</span>
                <span className="text-xs font-medium text-slate-400">Add +2 extra auto vehicles to Sub Roads. Cost: ₹800/d</span>
              </div>
              <button 
                onClick={() => setExtraAutos(!extraAutos)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${extraAutos ? 'bg-teal-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${extraAutos ? 'translate-x-7' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Segregation Improvement Slider */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Segregation Drive</label>
                <span className="text-teal-700 font-extrabold bg-teal-50 px-2 py-1 rounded-md text-sm border border-teal-100">+{segregation}% Improvement</span>
              </div>
              <input 
                type="range" 
                min="0" max="50" step="10" 
                value={segregation}
                onChange={(e) => setSegregation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-500 transition-all"
              />
              <div className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg mt-1 text-center">
                If segregation improves 10% → block waste reduces 8%
              </div>
            </div>

          </div>

          <div className="w-full flex flex-col mt-4">
            {apiError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mb-3 shadow-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                {apiError}
              </div>
            )}
            <button
              onClick={handleRunSimulation}
              disabled={isRunning}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-600/50 flex items-center justify-center gap-3 py-4 rounded-xl text-white font-extrabold tracking-wide transition-all shadow-[0_8px_20px_rgba(13,148,136,0.25)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.35)] hover:-translate-y-0.5"
            >
              {isRunning ? (
                <>
                  <SpinnerIcon />
                  <span>Simulating Layout Impact...</span>
                </>
              ) : (
                'Run Simulation'
              )}
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[65%] flex flex-col gap-6">
          {isLoading || !summary ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full rounded-2xl shadow-sm" />
              ))}
              <Skeleton className="col-span-1 sm:col-span-2 h-[300px] w-full rounded-2xl shadow-sm" />
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 0.5}} className="flex flex-col gap-6 flex-1">
              
              {/* 1. Top Summary Cards (4) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Today's Waste</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-800">{summary.today.waste}</span>
                    <span className="text-slate-400 text-[10px] font-bold">tons</span>
                  </div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Peak Day</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-rose-600">{summary.peakDay.dayLabel}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">({summary.peakDay.waste} tons)</span>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">High Risk Days</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-amber-500">{summary.highRiskDays}</span>
                  </div>
                </div>
                <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between">
                  <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total (10-day)</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-teal-600">{summary.totalWaste}</span>
                    <span className="text-slate-400 text-[10px] font-bold">tons</span>
                  </div>
                </div>
              </div>

              {/* 2. Day-by-day Recharts LineChart */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm overflow-hidden">
                <h3 className="text-slate-800 text-md font-extrabold mb-4">10-Day Waste Forecast</h3>
                <div className="w-full overflow-x-auto">
                    <div className="min-w-[500px]">
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={forecast} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="waste" stroke="#0d9488" strokeWidth={3} name="Predicted Waste" dot={(props: any) => {
                              const { cx, cy, payload } = props;
                              if (!cx || !cy) return null;
                              if (payload.isRainy && payload.isFestival) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={6} fill="#8b5cf6" stroke="white" strokeWidth={2}/>;
                              if (payload.isRainy) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={6} fill="#3b82f6" stroke="white" strokeWidth={2}/>;
                              if (payload.isFestival) return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={6} fill="#f97316" stroke="white" strokeWidth={2}/>;
                              return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={4} fill="#0d9488" stroke="white" strokeWidth={1} />;
                            }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="baseWasteLine" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Base Waste" dot={false} activeDot={false} />
                            <Line type="monotone" dataKey="capacityLimit" stroke="#e11d48" strokeDasharray="5 5" strokeWidth={2} name="Capacity Limit" dot={false} activeDot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              </div>

              {/* Bottom Grid: Breakdown & Risk Meter */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 4. Waste Breakdown BarChart */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm overflow-hidden">
                  <h3 className="text-slate-800 text-md font-extrabold mb-4">Daily Breakdown</h3>
                  <div className="w-full overflow-x-auto">
                      <div className="min-w-[300px]">
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={forecast} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="dayLabel" tick={{fontSize: 10}} interval="preserveStartEnd" axisLine={false} tickLine={false} />
                              <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                              <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                              <Bar dataKey="wet" stackId="a" fill="#22c55e" name="Wet Waste" radius={[0, 0, 4, 4]} />
                              <Bar dataKey="dry" stackId="a" fill="#3b82f6" name="Dry Waste" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                </div>

                {/* 5. Risk Meter */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 blur-[50px] rounded-full pointer-events-none" />
                  <h3 className="text-slate-800 text-md font-extrabold mb-2 w-full text-left">Today's Risk Level</h3>
                  
                  {(() => {
                    const score = summary.today.riskScore;
                    const radius = 60;
                    const circumference = 2 * Math.PI * radius;
                    const strokeDashoffset = circumference - (Math.min(score, 1) * circumference);
                    const color = score > 0.85 ? '#e11d48' : score > 0.65 ? '#ea580c' : score > 0.45 ? '#d97706' : '#16a34a';
                    const riskText = score > 0.85 ? 'CRITICAL' : score > 0.65 ? 'HIGH' : score > 0.45 ? 'MEDIUM' : 'LOW';
                    
                    return (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative flex items-center justify-center w-40 h-40">
                          <svg className="transform -rotate-90 w-32 h-32">
                            <circle cx="64" cy="64" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                            <circle cx="64" cy="64" r={radius} stroke={color} strokeWidth="12" fill="transparent" 
                              strokeLinecap="round"
                              strokeDasharray={circumference} 
                              strokeDashoffset={strokeDashoffset} 
                              className="transition-all duration-1000 ease-out" 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-3xl font-black" style={{ color }}>{(score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <span className="hidden">Gauge generated color</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: color }}>
                            {riskText} RISK
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* 3. Day-by-day Table */}
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-slate-800 text-sm font-extrabold">Detailed 10-Day Forecast</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                        <th className="p-3 font-bold border-b">Day</th>
                        <th className="p-3 font-bold border-b">Date</th>
                        <th className="p-3 font-bold border-b">Temp</th>
                        <th className="p-3 font-bold border-b">Rain</th>
                        <th className="p-3 font-bold border-b">Waste (T)</th>
                        <th className="p-3 font-bold border-b">Wet</th>
                        <th className="p-3 font-bold border-b">Dry</th>
                        <th className="p-3 font-bold border-b">Risk</th>
                        <th className="p-3 font-bold border-b">Cost</th>
                        <th className="p-3 font-bold border-b">Event</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {forecast.map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">{d.dayLabel}</td>
                          <td className="p-3 text-slate-500 font-medium whitespace-nowrap">{d.date}</td>
                          <td className="p-3 text-slate-600">{Math.round(d.temp)}°C</td>
                          <td className="p-3 text-slate-600">{d.rainfall}mm</td>
                          <td className="p-3 font-black text-slate-800">{d.waste}</td>
                          <td className="p-3 font-semibold text-emerald-600">{d.wet}</td>
                          <td className="p-3 font-semibold text-sky-600">{d.dry}</td>
                          <td className="p-3">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-sm ${
                               d.risk === 'CRITICAL' ? 'bg-rose-500 text-white' :
                               d.risk === 'HIGH' ? 'bg-orange-500 text-white' :
                               d.risk === 'MEDIUM' ? 'bg-amber-400 text-amber-900' :
                               'bg-emerald-500 text-white'
                             }`}>{d.risk}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-600">₹{d.cost}</td>
                          <td className="p-3 text-[10px] font-bold text-slate-500">{d.event}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* Footer Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-6 mt-2 shadow-sm">
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-sm mb-4 sm:mb-0">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 mr-3 animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
              HSR Layout ward-level behavioral AI model
            </p>
            <Link 
              href="/impact" 
              className="bg-slate-50 hover:bg-slate-100 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow w-full sm:w-auto justify-center"
            >
              <span>View HSR Analytics Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

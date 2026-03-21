"use client";
import React, { useState, useEffect } from 'react';

const endpoints = [
  { name: 'Health Check', url: 'http://localhost:8000/', method: 'GET' },
  { name: 'Ward Stats', url: 'http://localhost:8000/ward-stats', method: 'GET' },
  { name: 'Optimize Routes', url: 'http://localhost:8000/optimize-routes', method: 'GET' },
  { name: 'Building Analysis', url: 'http://localhost:8000/building-analysis', method: 'GET' },
  { name: 'Predict Waste', url: 'http://localhost:8000/predict-waste', method: 'POST', body: {} },
  { name: 'Simulate Dumpyard', url: 'http://localhost:8000/simulate-dumpyard', method: 'POST', body: {} },
  { name: 'Run Digital Twin', url: 'http://localhost:8000/run-digital-twin', method: 'POST', body: {} },
  { name: 'Process Satellite', url: 'http://localhost:8000/process-satellite', method: 'POST', isFormData: true }
]

export default function ApiStatusPage() {
  const [statuses, setStatuses] = useState<{ [key: string]: { status: 'online' | 'offline' | 'slow' | 'checking', ms: number } }>({});
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    const checkEndpoints = async () => {
      const newStatuses: any = {};
      
      await Promise.all(endpoints.map(async (ep) => {
        const start = performance.now();
        try {
          const reqOpts: any = { method: ep.method };
          if (ep.method === 'POST') {
            if (ep.isFormData) {
              const fd = new FormData();
              fd.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
              reqOpts.body = fd;
            } else {
              reqOpts.headers = { 'Content-Type': 'application/json' };
              reqOpts.body = JSON.stringify(ep.body);
            }
          }
          
          const res = await fetch(ep.url, reqOpts);
          const time = Math.round(performance.now() - start);
          
          if (res.ok) {
            newStatuses[ep.name] = { status: time > 500 ? 'slow' : 'online', ms: time };
          } else {
            newStatuses[ep.name] = { status: 'offline', ms: time };
          }
        } catch {
          newStatuses[ep.name] = { status: 'offline', ms: Math.round(performance.now() - start) };
        }
      }));

      setStatuses(newStatuses);
      setLastChecked(new Date());
    };

    checkEndpoints();
    const interval = setInterval(checkEndpoints, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-white p-8 font-sans selection:bg-teal-500/30 overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto mt-12 bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-white/10 pb-6 gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 tracking-tighter">
              Backend API Status
            </h1>
            <p className="text-gray-400 mt-2 font-medium">AstraCity FastAPI — HSR Layout</p>
          </div>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="px-6 py-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl font-bold hover:bg-indigo-500/30 transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)] hover:-translate-y-1 block shrink-0">
            API Docs →
          </a>
        </div>
        
        <div className="text-sm text-gray-400 mb-8 font-mono flex items-center gap-2 bg-black/40 px-4 py-2 inline-flex rounded-xl border border-white/5">
          <svg className="w-4 h-4 text-teal-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span>Auto-refreshing... Last connection: <span className="text-white font-bold">{lastChecked.toLocaleTimeString()}</span></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.map((ep) => {
            const data = statuses[ep.name] || { status: 'checking', ms: 0 };
            
            let color = 'bg-white/5 text-gray-400 border-white/10';
            let icon = '⏳';
            if (data.status === 'online') { color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'; icon = '✅'; }
            if (data.status === 'slow') { color = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'; icon = '🟡'; }
            if (data.status === 'offline') { color = 'bg-red-500/10 text-red-400 border-red-500/20'; icon = '❌'; }

            return (
              <div key={ep.name} className={`p-5 rounded-2xl border ${color} flex items-center justify-between transition-colors shadow-sm`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center border border-white/5 text-xl">
                    {icon}
                  </div>
                  <div>
                    <div className="font-extrabold text-white">{ep.name}</div>
                    <div className="text-[10px] uppercase tracking-widest opacity-80 flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'}`}>{ep.method}</span>
                      <span className="font-mono mt-0.5">{ep.url.replace('http://localhost:8000', '')}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono font-black text-sm tracking-tighter bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                  {data.status !== 'checking' ? `${data.ms}ms` : '--'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

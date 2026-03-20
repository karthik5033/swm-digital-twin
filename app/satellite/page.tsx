import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useStore } from "@/lib/store";

// --- Icons ---
const SatelliteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M13 7 9 3 5 7l4 4" />
    <path d="m17 11 4 4-4 4-4-4" />
    <path d="m8 12 4 4 6-6-4-4Z" />
    <path d="m16 8 3-3" />
    <path d="M9 21a6 6 0 0 0-6-6" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default function SatellitePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'complete'>('idle');
  const [currentStep, setCurrentStep] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define the 5 verification steps
  const steps = [
    { label: "Loading satellite bands...", duration: 1200 },
    { label: "Detecting brightness anomalies...", duration: 1800 },
    { label: "Running DBSCAN clustering...", duration: 2100 },
    { label: "Geolocating dump coordinates...", duration: 1500 },
    { label: "Updating map data...", duration: 1000 },
  ];

  // Dummy Results
  const [results, setResults] = useState({ dumps: 0, wards: 0, ndvi: 0 });

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0d9488', '#14b8a6', '#5eead4']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0d9488', '#14b8a6', '#5eead4']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const startProcessing = () => {
    if (!file) return;
    setProcessingState('processing');
    setCurrentStep(0);

    // Sequence the steps via timeouts
    let cumulativeDelay = 0;
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
      }, cumulativeDelay);
      cumulativeDelay += step.duration;
    });

    // Final completion
    setTimeout(() => {
      setProcessingState('complete');
      
      // Generate randomized stats matching specs
      const numDumps = Math.floor(Math.random() * (80 - 40 + 1) + 40);
      setResults({
        dumps: numDumps,
        wards: Math.floor(Math.random() * (18 - 12 + 1) + 12),
        ndvi: Number((Math.random() * (0.28 - 0.12) + 0.12).toFixed(3))
      });

      // Generate synthetic map objects for the interactive demo flow
      const generatedDumps = Array.from({length: numDumps}).map((_, i) => ({
        id: `DUMP-NEW-${i}`,
        // Bounding box for central BLR realistically
        lat: 12.9 + (Math.random() - 0.5) * 0.15,
        lon: 77.6 + (Math.random() - 0.5) * 0.15,
        risk: Math.random() > 0.7 ? "high" : "medium",
        area_sqm: Math.floor(Math.random() * 500) + 100,
        ndvi_value: Number((Math.random() * 0.28).toFixed(3)),
        detected: new Date().toISOString().split('T')[0]
      }));
      useStore.getState().setNewSyntheticDumps(generatedDumps);

      triggerConfetti();
    }, cumulativeDelay);
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validExt = ['.tif', '.geotiff', 'image/tiff'];
      if (validExt.some(ext => droppedFile.name.toLowerCase().endsWith(ext) || droppedFile.type === ext)) {
        setFile(droppedFile);
      } else {
        alert("Please upload a valid .tif or .geotiff file.");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col pt-24 pb-16 px-6 relative overflow-hidden transition-colors">
      
      {/* Background Gradients */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-teal-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full mx-auto relative z-10 flex flex-col gap-10"
      >
        
        {/* Header */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 mx-auto bg-slate-900 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-xl border border-slate-800 dark:border-slate-700"
          >
            <SatelliteIcon className="w-10 h-10 text-teal-400" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Satellite Ingestion Pipeline
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Upload multispectral orbital imagery securely. Our spatial models run NDVI and DBSCAN clustering automatically to isolate solid waste anomalies.
          </p>
        </div>

        {/* Dynamic State Container */}
        <AnimatePresence mode="wait">
          
          {processingState === 'idle' && (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {/* Drag Area */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative group w-full p-12 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden
                  ${isDragging ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-500 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".tif,.geotiff,image/tiff" 
                  className="hidden" 
                />
                
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UploadIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  {isDragging ? 'Drop file here' : 'Click or Drag payload to sync'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Supports High-Res .TIF and .GeoTIFF up to 500MB
                </p>
              </div>

              {/* Selected File Review */}
              <AnimatePresence>
                {file && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-50 dark:bg-teal-500/10 rounded-xl">
                        <FileIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-sm">{file.name}</p>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setFile(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              {file && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={startProcessing}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-lg py-5 rounded-2xl shadow-[0_8px_20px_rgba(13,148,136,0.25)] hover:shadow-[0_8px_30px_rgba(13,148,136,0.4)] transition-all hover:-translate-y-1 mt-4"
                >
                  Process Satellite Data
                </motion.button>
              )}
            </motion.div>
          )}

          {processingState === 'processing' && (
            <motion.div
              key="processing-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2rem] shadow-xl flex flex-col items-center justify-center min-h-[400px]"
            >
              <div className="relative w-24 h-24 mb-10">
                <svg className="animate-spin w-full h-full text-slate-200 dark:text-slate-800" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <SatelliteIcon className="w-8 h-8 text-teal-500 animate-pulse" />
                </div>
              </div>

              <div className="w-full max-w-md flex flex-col gap-4">
                {steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isPast = idx < currentStep;

                  return (
                    <div key={idx} className="flex flex-col gap-2 relative">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold transition-colors ${isActive ? 'text-teal-600 dark:text-teal-400' : isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                          {step.label}
                        </span>
                        {isPast && <CheckCircleIcon className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: isPast ? "100%" : "0%" }}
                          animate={{ width: isPast ? "100%" : isActive ? "100%" : "0%" }}
                          transition={{ duration: isActive ? step.duration / 1000 : 0, ease: "linear" }}
                          className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)] rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {processingState === 'complete' && (
            <motion.div
              key="results-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2rem] shadow-xl flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
              
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <CheckCircleIcon className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Transmission Verified</h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium mb-10 max-w-sm">
                Anomaly detection pipeline executed successfully against local geography.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-10">
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sites Detected</span>
                  <span className="text-4xl font-black text-rose-600 dark:text-rose-400">{results.dumps}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Affected Wards</span>
                  <span className="text-4xl font-black text-amber-500 dark:text-amber-400">{results.wards}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Avg NDVI Index</span>
                  <span className="text-4xl font-black text-teal-600 dark:text-teal-400">{results.ndvi}</span>
                </div>
              </div>

              <Link 
                href="/map"
                className="group w-full max-w-md bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white font-extrabold text-lg py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
              >
                View on Map
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </Link>

              <button 
                onClick={() => {
                  setProcessingState('idle');
                  setFile(null);
                }}
                className="mt-6 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors text-sm"
              >
                Process another payload
              </button>

            </motion.div>
          )}

        </AnimatePresence>

      </motion.div>
    </div>
  );
}

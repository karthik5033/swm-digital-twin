"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, LayerId } from '@/lib/store';
import wardScores from '@/data/ward_scores.json';

export default function AIQueryBar() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionFired, setActionFired] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsOpen(true);
    setIsLoading(true);
    setResponse(""); // Clear previous response

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setResponse("API Key missing. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file to use the AI Query Bar.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "You are AstraCity's spatial intelligence assistant for Bengaluru waste management. Always respond with JSON only in this format: { \"text\": \"your 1-2 sentence answer here\", \"action\": \"highlightWards\" | \"filterWards\" | \"showLayer\" | \"none\", \"wardIds\": [1, 2, 3], \"layer\": \"dumps\" | \"dryWaste\" | \"processing\" | \"methane\" | \"density\" | \"openSpaces\" | \"segregation\" | \"lulc\" }" }]
          },
          contents: [{ parts: [{ text: query }] }]
        })
      });
      const data = await res.json();
      if (data.error) {
         setResponse("Error from AI: " + data.error.message);
      } else {
         const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
         try {
           const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "");
           const parsed = JSON.parse(cleanedText);
           setResponse(parsed.text);
           
           if (parsed.action && parsed.action !== 'none') {
             if (parsed.action === 'highlightWards' && Array.isArray(parsed.wardIds)) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const names = parsed.wardIds.map((id: number) => wardScores.find((w: any) => w.id === id)?.name).filter(Boolean);
               useStore.getState().setHighlightedWards(names);
               if (names.length === 1) useStore.getState().setSelectedWardId(names[0]);
             } else if (parsed.action === 'filterWards' && Array.isArray(parsed.wardIds)) {
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const names = parsed.wardIds.map((id: number) => wardScores.find((w: any) => w.id === id)?.name).filter(Boolean);
               useStore.getState().setFilteredWards(names);
             } else if (parsed.action === 'showLayer' && parsed.layer) {
               const layerMap: Record<string, LayerId> = {
                 'dumps': 'dumps', 'dryWaste': 'dryWaste', 'processing': 'processing', 'methane': 'methane', 'density': 'density', 'openSpaces': 'openSpaces', 'segregation': 'segregation', 'lulc': 'lulc'
               };
               const target = layerMap[parsed.layer];
               if (target) {
                 const { activeLayers, toggleLayer } = useStore.getState();
                 if (!activeLayers[target]) toggleLayer(target);
               }
             }

             setActionFired(true);
             setTimeout(() => setActionFired(false), 3000);
           }
         } catch {
           setResponse(rawText); // fallback if parsing fails
         }
      }
    } catch (err: any) {
      setResponse("Failed to connect to the AI service. Please confirm your network settings and API key.");
    } finally {
      setIsLoading(false);
      setQuery(""); // Clear the input after successfully triggering response
    }
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col pointer-events-none gap-3">
      {/* Response Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-[0_-20px_40px_rgba(0,0,0,0.3)] rounded-2xl p-6 max-w-sm w-[calc(100vw-2rem)] sm:w-80 border-l-4 border-l-teal-500 relative"
          >
            <button 
              onClick={() => setIsOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="flex items-start gap-4 pr-6">
               <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl shrink-0 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
               </div>
               <div className="flex-1 text-slate-200 text-[15px] leading-relaxed overflow-y-auto max-h-[40vh] mt-1 font-medium relative pr-4">
                  {isLoading ? (
                     <div className="flex gap-2 items-center h-6">
                       <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                       <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                       <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce"></span>
                     </div>
                  ) : (
                     <div className="flex flex-col gap-3">
                       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} dangerouslySetInnerHTML={{ __html: response?.replace(/\n/g, '<br />') || "" }} />
                       <AnimatePresence>
                         {actionFired && (
                           <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="self-end bg-teal-500/20 text-teal-400 text-[11px] font-black px-2 py-1 rounded-md border border-teal-500/30 flex items-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                             Action executed on map
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Input Bar */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-800 flex items-center h-[52px] px-4 gap-3 rounded-lg shadow-lg"
          >
            <form className="flex-1 flex items-center h-full gap-2" onSubmit={handleSubmit}>
              <input 
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-transparent text-slate-100 text-sm font-medium placeholder-slate-500 focus:outline-none"
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={!query.trim() || isLoading} 
                className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center border border-teal-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </form>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800/50 transition-colors shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Icon Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="pointer-events-auto w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow self-end"
        aria-label="Toggle AI query"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
      </motion.button>
    </div>
  );
}

import re

filepath = 'app/simulation/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Page Wrapper
    'min-h-screen bg-slate-50 p-4 md:p-8 font-sans': 'min-h-screen bg-[#050914] text-white p-4 md:p-8 font-sans relative overflow-x-hidden',
    # Adds ambient orbs
    '<div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">': '<div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 relative z-10">\\n        <div className="fixed top-[10%] left-[0%] w-[40vw] h-[40vw] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none z-0" />\\n        <div className="fixed bottom-[10%] right-[0%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none z-0" />',
    
    # Left Panel Wrapper
    'w-full md:w-[35%] bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-8 h-fit': 'w-full md:w-[35%] bg-[#0a0f1e]/80 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-8 h-fit',
    'border-slate-100': 'border-white/10',
    'bg-teal-50 text-teal-600': 'bg-teal-500/20 text-teal-400',
    'border-teal-100': 'border-teal-500/30',
    'text-slate-800': 'text-white',
    'text-slate-600': 'text-gray-400',
    'text-slate-900': 'text-gray-200',
    'text-slate-700': 'text-gray-300',
    'bg-slate-900 border border-slate-200': 'bg-black/40 border border-teal-500/20',
    'border-slate-200/50': 'border-white/5',
    'border-slate-200': 'border-white/10',
    
    # Toggle Cards
    'bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-slate-300 transition-colors': 'bg-white/5 border border-white/10 p-4 rounded-xl shadow-sm hover:border-white/20 transition-colors backdrop-blur-sm',
    
    # Toggle Button states
    "bg-slate-300'": "bg-white/10'",
    "bg-white w-5 h-5 rounded-full shadow-sm": "bg-white w-5 h-5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]",
    
    # Slider
    'text-slate-500 hover:text-slate-700': 'text-gray-400 hover:text-gray-200',
    'bg-slate-200 rounded-lg': 'bg-white/10 rounded-lg',
    
    # Right panel background cards
    'grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full': 'grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1 h-full relative z-10',
    'bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all': 'bg-[#0a0f1e]/80 border border-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all',
    
    # Top card icons
    'bg-teal-50 blur-[80px]': 'bg-teal-500/10 blur-[80px]',
    'bg-rose-50 blur-[80px]': 'bg-rose-500/10 blur-[80px]',
    'bg-amber-50 blur-[80px]': 'bg-amber-500/10 blur-[80px]',
    'bg-indigo-50 blur-[80px]': 'bg-indigo-500/10 blur-[80px]',
    
    'bg-rose-50 rounded-xl border border-rose-100 text-rose-500': 'bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400',
    'bg-amber-50 rounded-xl border border-amber-100 text-amber-500': 'bg-amber-500/20 rounded-xl border border-amber-500/30 text-amber-400',
    'bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-500': 'bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400',
    
    # Percent vs normal badges
    'text-slate-500 bg-slate-100': 'text-gray-400 bg-white/10',
    'text-rose-600 bg-rose-50 border border-rose-200': 'text-rose-400 bg-rose-500/20 border border-rose-500/30',
    'text-emerald-700 bg-emerald-50 border border-emerald-200': 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30',
    
    # Sub road coverage and Fleet cost dark cards that were bugged
    'bg-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden border border-slate-200 flex flex-col justify-between': 'bg-black/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/10 flex flex-col justify-between backdrop-blur-md',
    
    # Alert section
    "bg-rose-50 border-rose-200' :": "bg-rose-500/10 border-rose-500/30 backdrop-blur-md' :",
    "bg-orange-50 border-orange-200' :": "bg-orange-500/10 border-orange-500/30 backdrop-blur-md' :",
    "'bg-amber-50 border-amber-200'": "'bg-amber-500/10 border-amber-500/30 backdrop-blur-md'",
    
    # Footer
    'bg-white border border-slate-200 rounded-2xl p-6 mt-2 shadow-sm': 'bg-[#0a0f1e]/80 border border-white/10 backdrop-blur-xl rounded-2xl p-6 mt-2 shadow-xl',
    'bg-slate-50 hover:bg-slate-100 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 border border-slate-200': 'bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 border border-white/10',
    
    # Typography fixes
    'text-slate-500': 'text-gray-400',
    'text-slate-800': 'text-white',
    
    # Emojis manually set in strings
    '<span>📡</span>': '<span className="text-teal-400"><Activity className="w-4 h-4 inline-block mr-1"/></span>',
    'LOW ✅': 'LOW <CheckCircle2 className="w-3 h-3 inline-block ml-1 text-emerald-400"/>',
    '🗺️': '<Map className="w-8 h-8 text-teal-400 mb-2"/>',
}

for k, v in replacements.items():
    content = content.replace(k, v)

# Lucide-React Imports
imports = "import { Activity, CheckCircle2, Map } from 'lucide-react';\\n"
if 'lucide-react' not in content:
    content = content.replace("import React,", imports + "import React,")
else:
    # Just append needed ones
    pass

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"done transforming {filepath}")

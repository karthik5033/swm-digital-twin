import re

filepath = 'app/routes/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'bg-slate-50 text-slate-800 font-sans pb-24 transition-colors': 'bg-[#050914] text-white font-sans pb-24 transition-colors overflow-x-hidden relative',
    'bg-white shadow-md text-teal-700 border border-slate-200': 'bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.3)] text-teal-400 border border-teal-500/30',
    'bg-white shadow-md text-indigo-700 border border-slate-200': 'bg-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-indigo-400 border border-indigo-500/30',
    'bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200': 'bg-white/5 p-1.5 rounded-2xl w-fit border border-white/10 backdrop-blur-md relative z-10',
    'text-slate-500 hover:text-slate-700': 'text-gray-400 hover:text-white',
    'bg-white border text-sm font-bold': 'bg-white/5 border border-white/10 text-sm font-bold',
    'text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight': 'text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 mb-4 tracking-tighter relative z-10',
    'text-xl text-slate-500 font-medium tracking-wide mb-8': 'text-xl text-gray-400 font-medium tracking-wide mb-8 relative z-10',
    'bg-white border border-slate-200': 'bg-[#0a0f1e]/80 border border-white/10 backdrop-blur-xl',
    'bg-white border-2 border-teal-200': 'bg-teal-500/10 border border-teal-500/30',
    'bg-white border-2 border-amber-200': 'bg-amber-500/10 border border-amber-500/30',
    'bg-teal-50 text-teal-600': 'bg-teal-500/20 text-teal-400',
    'bg-teal-50 border border-teal-200 text-teal-800': 'bg-teal-500/20 border border-teal-500/30 text-teal-300',
    'bg-amber-50 text-amber-600': 'bg-amber-500/20 text-amber-400',
    'bg-amber-50 border border-amber-200 text-amber-800': 'bg-amber-500/20 border border-amber-500/30 text-amber-300',
    'bg-emerald-50 border border-emerald-200 text-emerald-700': 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold',
    'bg-indigo-50 text-indigo-900 border-indigo-300': 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border-indigo-400',
    'bg-white text-slate-600 border-slate-200': 'bg-[#0a0f1e]/50 text-gray-300 border-white/10',
    'hover:border-slate-300 hover:bg-slate-50': 'hover:bg-white/10 hover:border-white/20',
    'bg-slate-50 border border-slate-200': 'bg-white/5 border border-white/10',
    'bg-slate-50 border-b border-slate-200': 'bg-white/5 border-b border-white/10',
    'bg-white p-5 border border-slate-200': 'bg-black/30 p-5 border border-white/10',
    'bg-slate-200': 'bg-white/10',
    'divide-slate-100': 'divide-white/10',
    
    # Colors
    'text-slate-900': 'text-white',
    'text-slate-800': 'text-gray-200',
    'text-slate-700': 'text-gray-300',
    'text-slate-600': 'text-gray-400',
    'text-slate-500': 'text-gray-400',
    'text-slate-400': 'text-gray-500',
    'text-emerald-600': 'text-emerald-400',
    'text-indigo-600': 'text-indigo-400',
    'border-slate-200': 'border-white/10',
    'bg-slate-50': 'bg-white/5',
    'text-indigo-900': 'text-indigo-100',
    
    # Specifics
    'border-b border-slate-200': 'border-b border-white/10',
    '<div className="min-h-screen bg-[#050914] text-white font-sans overflow-x-hidden relative pb-24 transition-colors">': '<div className="min-h-screen bg-[#050914] text-white font-sans pb-24 transition-colors relative overflow-x-hidden">\\n      <div className="fixed top-[0%] left-[-10%] w-[50vw] h-[50vw] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none z-0" />\\n      <div className="fixed bottom-[10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none z-0" />',
}

for k, v in replacements.items():
    content = content.replace(k, v)

emojis = {
    '🚛': '<Truck className="w-10 h-10 mb-1" />',
    '🚚': '<Truck className="w-6 h-6" />',
    '🛺': '<TrainFront className="w-10 h-10 mb-1" />',
    '🚀': '<Cpu className="w-6 h-6" />',
    '🚜': '<Truck className="w-8 h-8 mb-1 text-emerald-400" />',
    '🛒': '<ShoppingCart className="w-8 h-8 mb-1 text-amber-400" />',
    '🚄': '<TrainFront className="w-8 h-8 mb-1 text-blue-400" />',
    '📊': '<LayoutGrid className="w-4 h-4 inline-block mr-1" />',
    '⚙️': '<Settings className="w-4 h-4 inline-block mr-1" />',
    '♻️': '<Recycle className="w-6 h-6" />',
    '🧠': '<Brain className="w-6 h-6 text-teal-400" />',
    '🧮': '<Calculator className="w-6 h-6 text-indigo-400" />',
    '🎯': '<Target className="w-6 h-6 text-rose-400" />',
    '📍': '<MapPin className="w-6 h-6 text-amber-400" />',
    '🌟': '<Sparkles className="w-6 h-6 inline-block mb-1" />'
}

for k, v in emojis.items():
    content = content.replace(k, v)

imports = "import { Truck, Settings, LayoutGrid, Cpu, TrainFront, ShoppingCart, Recycle, Brain, Calculator, Target, MapPin, Route, Sparkles } from 'lucide-react';"
content = re.sub(r'import\s*{[^}]*}\s*from\s*.lucide-react.;', imports, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"done transforming {filepath}")

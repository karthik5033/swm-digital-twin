import os
import re

def white_theme_transformation(filepath):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Even more aggressive replacements
    replacements = {
        # Backgrounds
        'bg-[#050914]': 'bg-white',
        'bg-slate-950/80': 'bg-white/95',
        'bg-slate-950': 'bg-white',
        'bg-[#0a0f1e]/80': 'bg-white',
        'bg-[#0a0f1e]/50': 'bg-slate-50',
        'bg-[#0a0f1e]': 'bg-white',
        'bg-slate-900': 'bg-slate-50',
        'bg-black/40': 'bg-slate-50',
        'bg-black/30': 'bg-slate-50',
        'bg-black/50': 'bg-slate-100',
        'bg-white/5': 'bg-slate-50',
        'bg-white/10': 'bg-slate-100',
        'bg-slate-800': 'bg-white',
        'bg-gray-900': 'bg-white',
        
        # Slashes and Tones
        '/10': '/5',
        '/20': '/10',
        
        # Borders
        'border-white/10': 'border-slate-200',
        'border-white/5': 'border-slate-100',
        'border-slate-800': 'border-slate-200',
        'border-slate-700': 'border-slate-300',
        'border-white/20': 'border-slate-300',
        'border-zinc-500/50': 'border-slate-200',
        
        # Text
        'text-white': 'text-slate-900',
        'text-gray-200': 'text-slate-800',
        'text-gray-300': 'text-slate-600',
        'text-gray-400': 'text-slate-500',
        'text-gray-500': 'text-slate-400',
        'text-teal-400': 'text-teal-600',
        'text-indigo-400': 'text-indigo-600',
        'text-rose-400': 'text-rose-600',
        'text-amber-400': 'text-amber-600',
        'text-emerald-400': 'text-emerald-600',
        'text-pink-400': 'text-pink-600',
        'text-blue-400': 'text-blue-600',
        'text-slate-300': 'text-slate-600',
        'text-slate-400': 'text-slate-500',
        'text-teal-300': 'text-teal-700',
        'text-indigo-300': 'text-indigo-700',
        
        # Special background orb replacements
        'bg-teal-500/10 rounded-full blur-[150px]': 'bg-teal-500/5 blur-[150px]',
        'bg-indigo-500/10 rounded-full blur-[150px]': 'bg-indigo-500/5 blur-[150px]',
        'bg-teal-500/10': 'bg-teal-50',
        'bg-amber-500/10': 'bg-amber-50',
        'bg-rose-500/10': 'bg-rose-50',
        'bg-indigo-500/10': 'bg-indigo-50',
        'bg-teal-500/20': 'bg-teal-50',
        'bg-indigo-500/20': 'bg-indigo-50',
        'bg-rose-500/20': 'bg-rose-50',
        'bg-amber-500/20': 'bg-amber-50',
        'bg-emerald-500/20': 'bg-emerald-50',
        'bg-pink-500/20': 'bg-pink-50',
        
        # Shadows
        'shadow-[0_0_40px_rgba(0,0,0,0.5)]': 'shadow-xl',
        'shadow-2xl': 'shadow-lg',
    }

    if 'Navbar.tsx' in filepath:
        # Force Light Mode and fix Navbar specific text visibility
        content = content.replace("setIsDark(true);", "setIsDark(false);")
        content = content.replace("document.documentElement.classList.add('dark');", "document.documentElement.classList.remove('dark');")
        content = content.replace("localStorage.setItem('astracity-theme', 'dark');", "localStorage.setItem('astracity-theme', 'light');")
        # Hide the theme toggle button visually
        content = content.replace('<button onClick={toggleTheme}', '<button style={{ display: "none" }} onClick={toggleTheme}')
        # Adjusting the main link active state colors for white theme
        content = content.replace('text-teal-400', 'text-teal-600')
        content = content.replace('hover:text-teal-300', 'hover:text-teal-500')

    # Apply all replacements
    for k, v in replacements.items():
        content = content.replace(k, v)
        
    # Final fix for any double entries after multi-pass
    content = content.replace('bg-slate-50/10', 'bg-slate-50/5')
    content = content.replace('bg-white/80', 'bg-white/95')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Aggressively Transformed to WHITE: {filepath}")

pages = [
    'app/routes/page.tsx',
    'app/simulation/page.tsx',
    'app/methodology/page.tsx',
    'app/impact/page.tsx',
    'app/lulc/page.tsx',
    'app/analysis/page.tsx',
    'app/vehicle-sim/page.tsx',
    'components/layout/Navbar.tsx',
    'app/page.tsx',
    'app/map/page.tsx',
    'app/osm/page.tsx',
    'app/report/page.tsx',
    'app/economics/page.tsx',
    'app/gridwise/page.tsx',
    'app/wards/page.tsx'
]

for p in pages:
    white_theme_transformation(p)

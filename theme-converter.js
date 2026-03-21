const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Prevent double replacements or messing up already light mode pages if possible.
      // E.g., if bg-[#070b14] is found, we replace it.
      // Global background elements
      content = content.replace(/bg-\[#070b14\]/g, 'bg-slate-50');
      content = content.replace(/bg-slate-950/g, 'bg-slate-50');
      content = content.replace(/bg-\[#0a0f1e\]/g, 'bg-slate-50');
      content = content.replace(/bg-\[#0B1120\]/g, 'bg-slate-50');
      content = content.replace(/bg-\[#020617\]/g, 'bg-white');
      
      // Common container backgrounds
      content = content.replace(/bg-white\/5/g, 'bg-white');
      content = content.replace(/bg-black\/40/g, 'bg-white');
      content = content.replace(/bg-slate-900\/80/g, 'bg-white\/80 backdrop-blur-md');
      content = content.replace(/bg-\[#111827\]/g, 'bg-white');
      content = content.replace(/bg-\[#1f2937\]/g, 'bg-slate-50');
      
      // Text colors
      content = content.replace(/text-white/g, 'text-slate-900');
      content = content.replace(/text-gray-400/g, 'text-slate-600');
      content = content.replace(/text-gray-300/g, 'text-slate-700');
      content = content.replace(/text-slate-200/g, 'text-slate-800');
      content = content.replace(/text-slate-400/g, 'text-slate-600');
      
      // Borders & Divides
      content = content.replace(/border-white\/10/g, 'border-slate-200 shadow-md');
      content = content.replace(/border-white\/5/g, 'border-slate-200 shadow-sm');
      content = content.replace(/border-gray-800/g, 'border-slate-200');
      content = content.replace(/border-slate-800/g, 'border-slate-200');
      content = content.replace(/border-slate-700/g, 'border-slate-200');
      content = content.replace(/divide-slate-800/g, 'divide-slate-200');
      
      // Hovers
      content = content.replace(/hover:bg-white\/\.?0?7/g, 'hover:bg-slate-50');
      content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-50');
      content = content.replace(/hover:bg-slate-800\/40/g, 'hover:bg-slate-50');
      
      // Recharts
      content = content.replace(/backgroundColor: 'rgba\(15, 23, 42, 0.9[5]?\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.95)'");
      content = content.replace(/border: '1px solid rgba\(255,255,255,0.1\)'/g, "border: '1px solid rgba(0,0,0,0.1)'");
      content = content.replace(/itemStyle={{ color: '#fff' }}/g, "itemStyle={{ color: '#0f172a' }}");
      content = content.replace(/fill: '#94a3b8'/g, "fill: '#64748b'");
      content = content.replace(/stroke="#64748b"/g, 'stroke="#cbd5e1"');

      // Specific hex background replacements for flow diagram
      content = content.replace(/bg-\[#14532d\]/g, 'bg-green-50');
      content = content.replace(/bg-\[#1e3a5f\]/g, 'bg-blue-50');
      content = content.replace(/bg-\[#7f1d1d\]/g, 'bg-red-50');
      content = content.replace(/bg-\[#374151\]/g, 'bg-slate-100');

      if(content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(process.cwd(), 'app'));

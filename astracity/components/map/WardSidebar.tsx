import { useStore } from '@/lib/store';
import wardScores from '@/data/ward_scores.json';
import Link from 'next/link';

export default function WardSidebar() {
  const selectedWardId = useStore((state) => state.selectedWardId);
  const setSelectedWardId = useStore((state) => state.setSelectedWardId);

  if (!selectedWardId) return null;

  const ward = wardScores.find((w) => w.id === selectedWardId);
  if (!ward) return null;

  const riskBadgeColor = ward.score < 40 ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                       : ward.score < 70 ? 'bg-amber-500/20 text-amber-500 border-amber-500/50'
                       : 'bg-green-500/20 text-green-500 border-green-500/50';

  const riskBadgeText = ward.score < 40 ? 'High Risk' : ward.score < 70 ? 'Medium Risk' : 'Low Risk';
  const progressColor = ward.score < 40 ? 'bg-red-500' : ward.score < 70 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-[#12182b]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-10 flex flex-col transition-transform transform translate-x-0 text-white p-6 overflow-y-auto">
      <button 
        onClick={() => setSelectedWardId(null)}
        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="mt-4 mb-8">
        <h2 className="text-2xl font-bold mb-2 break-words pr-8">{ward.name}</h2>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${riskBadgeColor}`}>
          {riskBadgeText}
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold">Ward Score</span>
            <span className="text-3xl font-bold">{ward.score}<span className="text-gray-500 text-xl font-medium">/100</span></span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className={`h-full rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${ward.score}%` }} />
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Dump Probability</span>
            <span className="text-xl font-mono text-blue-400">{Math.round(ward.dumpRisk * 100)}%</span>
          </div>
          <div className="h-px bg-white/5 w-full"></div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Waste Generation</span>
            <span className="text-xl font-mono text-yellow-400">{ward.wasteTons} <span className="text-xs text-gray-500">tons/day</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-black/30 rounded-xl p-4 border border-white/5 mt-4">
            <div className="flex flex-col gap-1">
              <span className="text-gray-400 text-sm font-medium">Trend Indicator</span>
              <span className="font-medium text-white/90">
                {ward.trend === 'up' ? 'Worsening' : ward.trend === 'down' ? 'Improving' : 'Stable'}
              </span>
            </div>
            <div className="ml-auto">
              {ward.trend === 'up' && <span className="flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/30 w-10 h-10 rounded-full text-lg shadow-[0_0_10px_rgba(239,68,68,0.2)]">↑</span>}
              {ward.trend === 'down' && <span className="flex items-center justify-center bg-green-500/20 text-green-400 border border-green-500/30 w-10 h-10 rounded-full text-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">↓</span>}
              {ward.trend === 'stable' && <span className="flex items-center justify-center bg-gray-500/20 text-gray-400 border border-gray-500/30 w-10 h-10 rounded-full text-lg">→</span>}
            </div>
        </div>
      </div>

      <Link 
        href={`/simulation?ward=${ward.id}`}
        className="w-full py-4 mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-center rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
      >
        Run Simulation
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  );
}

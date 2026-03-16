import { useStore, LayerId } from '@/lib/store';

const LAYERS = [
  { id: 'dumps', label: 'Illegal dump sites', displayColor: 'bg-orange-500' },
  { id: 'methane', label: 'Methane heatmap', displayColor: 'bg-red-500' },
  { id: 'waste', label: 'Waste generation heatmap', displayColor: 'bg-yellow-500' },
  { id: 'dumpProbability', label: 'Dumping probability', displayColor: 'bg-blue-500' },
  { id: 'routes', label: 'Optimized truck routes', displayColor: 'bg-green-500' },
  { id: 'wardVulnerability', label: 'Ward vulnerability', displayColor: 'bg-white' },
];

export default function LayerToggle() {
  const { activeLayers, toggleLayer } = useStore();

  return (
    <div className="absolute top-6 left-6 w-80 bg-[#12182b]/80 backdrop-blur-md border border-white/10 rounded-xl p-5 shadow-2xl z-10 text-white">
      <h3 className="text-lg font-semibold mb-4 text-white/90">Layers</h3>
      <div className="space-y-3">
        {LAYERS.map((layer) => (
          <label key={layer.id} className="flex items-center space-x-3 cursor-pointer group">
            <div className={`w-3 h-3 rounded-full ${layer.displayColor} flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`} />
            <input
              type="checkbox"
              className="hidden"
              checked={activeLayers[layer.id as LayerId]}
              onChange={() => toggleLayer(layer.id as LayerId)}
            />
            <div className={`flex flex-1 justify-between items-center bg-black/20 rounded px-3 py-2 border border-white/5 transition-colors ${activeLayers[layer.id as LayerId] ? 'border-white/20 bg-black/40' : ''}`}>
              <span className="text-sm font-medium opacity-90">{layer.label}</span>
              <div className={`w-8 h-4 rounded-full transition-colors relative ${activeLayers[layer.id as LayerId] ? layer.displayColor : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${activeLayers[layer.id as LayerId] ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

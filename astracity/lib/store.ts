import { create } from 'zustand';

export type LayerId = 'dumps' | 'methane' | 'waste' | 'dumpProbability' | 'routes' | 'wardVulnerability';

interface AppState {
  activeLayers: Record<LayerId, boolean>;
  toggleLayer: (layer: LayerId) => void;
  selectedWardId: number | null;
  setSelectedWardId: (id: number | null) => void;
}

export const useStore = create<AppState>((set) => ({
  activeLayers: {
    dumps: true,
    methane: false,
    waste: false,
    dumpProbability: false,
    routes: false,
    wardVulnerability: true,
  },
  toggleLayer: (layer) => set((state) => ({
    activeLayers: { ...state.activeLayers, [layer]: !state.activeLayers[layer] }
  })),
  selectedWardId: null,
  setSelectedWardId: (id) => set({ selectedWardId: id }),
}));

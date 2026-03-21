import { create } from 'zustand';

export type LayerId = 'dumps' | 'dryWaste' | 'processing' | 'methane' | 'density' | 'openSpaces' | 'segregation' | 'lulc' | 'truckHubs' | 'autoRoutes' | 'mainRoute';

interface AppState {
  activeLayers: Record<LayerId, boolean>;
  toggleLayer: (layer: LayerId) => void;
  selectedWardId: string | null;
  setSelectedWardId: (id: string | null) => void;
  highlightedWards: string[];
  setHighlightedWards: (wards: string[]) => void;
  filteredWards: string[];
  setFilteredWards: (wards: string[]) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newSyntheticDumps: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setNewSyntheticDumps: (dumps: any[]) => void;
}

export const useStore = create<AppState>((set) => ({
  activeLayers: {
    dumps: true,
    dryWaste: true,
    processing: true,
    methane: true,
    density: false,
    openSpaces: false,
    segregation: false,
    lulc: false,
    truckHubs: true,
    autoRoutes: true,
    mainRoute: true,
  },
  toggleLayer: (layer) => set((state) => ({
    activeLayers: { ...state.activeLayers, [layer]: !state.activeLayers[layer] }
  })),
  selectedWardId: null,
  setSelectedWardId: (id) => set({ selectedWardId: id }),
  highlightedWards: [],
  setHighlightedWards: (wards) => set({ highlightedWards: wards }),
  filteredWards: [],
  setFilteredWards: (wards) => set({ filteredWards: wards }),
  newSyntheticDumps: [],
  setNewSyntheticDumps: (dumps) => set({ newSyntheticDumps: dumps }),
}));

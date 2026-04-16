import { create } from 'zustand';
import type { AustralianRegionId, ConservationStatus, FilterState, HabitatType } from '../types/bird';

interface FilterStore {
  filters: FilterState;
  setSearchQuery: (query: string) => void;
  toggleRegion: (region: AustralianRegionId) => void;
  toggleHabitat: (habitat: HabitatType) => void;
  toggleConservationStatus: (status: ConservationStatus) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  clearAllFilters: () => void;
  activeFilterCount: () => number;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  regions: [],
  habitats: [],
  conservationStatuses: [],
  sortBy: 'name',
  sortDirection: 'asc',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  filters: { ...defaultFilters },

  setSearchQuery: (query) =>
    set((state) => ({ filters: { ...state.filters, searchQuery: query } })),

  toggleRegion: (region) =>
    set((state) => {
      const regions = state.filters.regions.includes(region)
        ? state.filters.regions.filter((r) => r !== region)
        : [...state.filters.regions, region];
      return { filters: { ...state.filters, regions } };
    }),

  toggleHabitat: (habitat) =>
    set((state) => {
      const habitats = state.filters.habitats.includes(habitat)
        ? state.filters.habitats.filter((h) => h !== habitat)
        : [...state.filters.habitats, habitat];
      return { filters: { ...state.filters, habitats } };
    }),

  toggleConservationStatus: (status) =>
    set((state) => {
      const conservationStatuses = state.filters.conservationStatuses.includes(status)
        ? state.filters.conservationStatuses.filter((s) => s !== status)
        : [...state.filters.conservationStatuses, status];
      return { filters: { ...state.filters, conservationStatuses } };
    }),

  setSortBy: (sortBy) =>
    set((state) => ({ filters: { ...state.filters, sortBy } })),

  clearAllFilters: () =>
    set({ filters: { ...defaultFilters } }),

  activeFilterCount: () => {
    const f = get().filters;
    let count = 0;
    if (f.searchQuery) count++;
    count += f.regions.length;
    count += f.habitats.length;
    count += f.conservationStatuses.length;
    return count;
  },
}));

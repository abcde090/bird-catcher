import { create } from 'zustand';
import type { BirdSpecies } from '../types/bird';

interface BirdStore {
  birds: BirdSpecies[];
  isLoading: boolean;
  error: string | null;
  fetchBirds: () => Promise<void>;
  getBirdBySlug: (slug: string) => BirdSpecies | undefined;
}

export const useBirdStore = create<BirdStore>((set, get) => ({
  birds: [],
  isLoading: false,
  error: null,

  fetchBirds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/data/birds.json');
      const birds: BirdSpecies[] = await response.json();
      set({ birds, isLoading: false });
    } catch {
      set({ error: 'Failed to load bird data', isLoading: false });
    }
  },

  getBirdBySlug: (slug: string) => {
    return get().birds.find(b => b.id === slug);
  },
}));

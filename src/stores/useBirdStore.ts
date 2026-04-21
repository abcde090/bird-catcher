import { create } from "zustand";
import type { BirdSpecies } from "../types/bird";
import { asset } from "../lib/asset";

interface BirdStore {
  birds: BirdSpecies[];
  isLoading: boolean;
  error: string | null;
  fetchBirds: () => Promise<void>;
}

export const useBirdStore = create<BirdStore>((set) => ({
  birds: [],
  isLoading: false,
  error: null,
  fetchBirds: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(asset("/data/birds.json"));
      const birds: BirdSpecies[] = await response.json();
      set({ birds, isLoading: false });
    } catch {
      set({ error: "Failed to load bird data", isLoading: false });
    }
  },
}));

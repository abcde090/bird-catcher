import { create } from "zustand";

interface CollectionStore {
  discoveredBirdIds: string[];
  totalCatches: number;
  gamesPlayed: number;
  discoverBird: (id: string) => void;
  addCatch: () => void;
  addGame: () => void;
  isDiscovered: (id: string) => boolean;
}

const loadCollection = (): {
  discoveredBirdIds: string[];
  totalCatches: number;
  gamesPlayed: number;
} => {
  const ids = localStorage.getItem("bird-catcher-collection");
  const catches = localStorage.getItem("bird-catcher-total-catches");
  const games = localStorage.getItem("bird-catcher-games-played");
  return {
    discoveredBirdIds: ids ? JSON.parse(ids) : [],
    totalCatches: catches ? parseInt(catches, 10) : 0,
    gamesPlayed: games ? parseInt(games, 10) : 0,
  };
};

const saveCollection = (ids: string[], catches: number, games: number) => {
  localStorage.setItem("bird-catcher-collection", JSON.stringify(ids));
  localStorage.setItem("bird-catcher-total-catches", String(catches));
  localStorage.setItem("bird-catcher-games-played", String(games));
};

export const useCollectionStore = create<CollectionStore>((set, get) => {
  const initial = loadCollection();
  return {
    ...initial,
    discoverBird: (id) => {
      const state = get();
      if (state.discoveredBirdIds.includes(id)) return;
      const updated = [...state.discoveredBirdIds, id];
      saveCollection(updated, state.totalCatches, state.gamesPlayed);
      set({ discoveredBirdIds: updated });
    },
    addCatch: () => {
      const state = get();
      const updated = state.totalCatches + 1;
      saveCollection(state.discoveredBirdIds, updated, state.gamesPlayed);
      set({ totalCatches: updated });
    },
    addGame: () => {
      const state = get();
      const updated = state.gamesPlayed + 1;
      saveCollection(state.discoveredBirdIds, state.totalCatches, updated);
      set({ gamesPlayed: updated });
    },
    isDiscovered: (id) => get().discoveredBirdIds.includes(id),
  };
});

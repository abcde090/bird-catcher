import { create } from "zustand";

const KEY_HIGH = "bc_high";
const KEY_DISCOVERED = "bc_discovered";

const loadHigh = (): number => {
  const raw = localStorage.getItem(KEY_HIGH);
  return raw ? parseInt(raw, 10) || 0 : 0;
};

const loadDiscovered = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY_DISCOVERED) ?? "[]"));
  } catch {
    return new Set();
  }
};

interface CollectionStore {
  highScore: number;
  discovered: Set<string>;
  setHighScore: (score: number) => void;
  discoverBird: (id: string) => void;
  isDiscovered: (id: string) => boolean;
}

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  highScore: loadHigh(),
  discovered: loadDiscovered(),
  setHighScore: (score) => {
    localStorage.setItem(KEY_HIGH, String(score));
    set({ highScore: score });
  },
  discoverBird: (id) => {
    const { discovered } = get();
    if (discovered.has(id)) return;
    const next = new Set(discovered);
    next.add(id);
    localStorage.setItem(KEY_DISCOVERED, JSON.stringify([...next]));
    set({ discovered: next });
  },
  isDiscovered: (id) => get().discovered.has(id),
}));

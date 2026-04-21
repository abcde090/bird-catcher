import { create } from "zustand";
import type { BirdSpecies } from "../types/bird";
import type {
  CatchEffectData,
  FlyingBird,
  GameScreen,
  RevealBird,
} from "../types/game";
import { ROUND_DURATION } from "../lib/game-config";

interface GameStore {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;

  score: number;
  timeRemaining: number;
  misses: number;
  combo: number;
  lastCatchTime: number;
  activeBirds: FlyingBird[];
  catchEffects: CatchEffectData[];
  catches: BirdSpecies[];
  newDiscoveries: number;
  revealBird: RevealBird | null;
  missFlashKey: number;

  startRound: () => void;
  endRound: () => void;
}

const initialRoundState = () => ({
  score: 0,
  timeRemaining: ROUND_DURATION,
  misses: 0,
  combo: 0,
  lastCatchTime: 0,
  activeBirds: [],
  catchEffects: [],
  catches: [],
  newDiscoveries: 0,
  revealBird: null,
  missFlashKey: 0,
});

export const useGameStore = create<GameStore>((set) => ({
  screen: "title",
  setScreen: (screen) => set({ screen }),
  ...initialRoundState(),
  startRound: () => set({ ...initialRoundState(), screen: "playing" }),
  endRound: () => set({ screen: "results" }),
}));

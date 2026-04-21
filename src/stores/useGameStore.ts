import { create } from "zustand";
import type { BirdSpecies } from "../types/bird";
import type {
  CatchEffectData,
  FlyingBird,
  GameScreen,
  NetPhase,
  RevealBird,
} from "../types/game";
import { ROUND_DURATION } from "../lib/game-config";

interface NetState {
  phase: NetPhase;
  startTime: number;
  targetX: number;
  targetY: number;
  originX: number;
  originY: number;
  catchesThisCast: number;
}

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

  net: NetState;
  setNet: (net: Partial<NetState>) => void;
  cursorX: number;
  cursorY: number;
  cursorSet: boolean;
  setCursor: (x: number, y: number) => void;

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
  net: {
    phase: "idle" as NetPhase,
    startTime: 0,
    targetX: 0,
    targetY: 0,
    originX: 0,
    originY: 0,
    catchesThisCast: 0,
  },
});

export const useGameStore = create<GameStore>((set) => ({
  screen: "title",
  setScreen: (screen) => set({ screen }),
  ...initialRoundState(),
  cursorX: 0,
  cursorY: 0,
  cursorSet: false,
  setNet: (net) => set((s) => ({ net: { ...s.net, ...net } })),
  setCursor: (cursorX, cursorY) => set({ cursorX, cursorY, cursorSet: true }),
  startRound: () => set({ ...initialRoundState(), screen: "playing" }),
  endRound: () => set({ screen: "results" }),
}));

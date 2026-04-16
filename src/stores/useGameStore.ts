import { create } from "zustand";
import type {
  GameScreen,
  DayPhase,
  FlyingBird,
  CatchEffectData,
} from "../types/game";
import { getPhaseForTime } from "../lib/game-config";

interface GameStore {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  timeRemaining: number;
  currentPhase: DayPhase;
  setTimeRemaining: (time: number) => void;
  score: number;
  combo: number;
  lastCatchTime: number;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  misses: number;
  addMiss: () => void;
  activeBirds: FlyingBird[];
  setActiveBirds: (birds: FlyingBird[]) => void;
  catchEffects: CatchEffectData[];
  addCatchEffect: (effect: CatchEffectData) => void;
  removeCatchEffect: (id: string) => void;
  caughtThisRound: string[];
  newSpeciesThisRound: string[];
  addCatch: (birdId: string, isNew: boolean) => void;
  revealBirdId: string | null;
  setRevealBirdId: (id: string | null) => void;
  highScore: number;
  setHighScore: (score: number) => void;
  startNewRound: () => void;
}

const loadHighScore = (): number => {
  const stored = localStorage.getItem("bird-catcher-high-score");
  return stored ? parseInt(stored, 10) : 0;
};

export const useGameStore = create<GameStore>((set) => ({
  screen: "title",
  setScreen: (screen) => set({ screen }),
  timeRemaining: 180,
  currentPhase: "dawn",
  setTimeRemaining: (time) =>
    set({ timeRemaining: time, currentPhase: getPhaseForTime(time) }),
  score: 0,
  combo: 0,
  lastCatchTime: 0,
  addScore: (points) => set((s) => ({ score: s.score + points })),
  incrementCombo: () =>
    set((s) => ({ combo: s.combo + 1, lastCatchTime: Date.now() })),
  resetCombo: () => set({ combo: 0 }),
  misses: 0,
  addMiss: () => set((s) => ({ misses: s.misses + 1 })),
  activeBirds: [],
  setActiveBirds: (birds) => set({ activeBirds: birds }),
  catchEffects: [],
  addCatchEffect: (effect) =>
    set((s) => ({ catchEffects: [...s.catchEffects, effect] })),
  removeCatchEffect: (id) =>
    set((s) => ({ catchEffects: s.catchEffects.filter((e) => e.id !== id) })),
  caughtThisRound: [],
  newSpeciesThisRound: [],
  addCatch: (birdId, isNew) =>
    set((s) => ({
      caughtThisRound: [...s.caughtThisRound, birdId],
      newSpeciesThisRound: isNew
        ? [...s.newSpeciesThisRound, birdId]
        : s.newSpeciesThisRound,
    })),
  revealBirdId: null,
  setRevealBirdId: (id) => set({ revealBirdId: id }),
  highScore: loadHighScore(),
  setHighScore: (score) => {
    localStorage.setItem("bird-catcher-high-score", String(score));
    set({ highScore: score });
  },
  startNewRound: () =>
    set({
      screen: "playing",
      timeRemaining: 180,
      currentPhase: "dawn",
      score: 0,
      combo: 0,
      lastCatchTime: 0,
      misses: 0,
      activeBirds: [],
      catchEffects: [],
      caughtThisRound: [],
      newSpeciesThisRound: [],
      revealBirdId: null,
    }),
}));

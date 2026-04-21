import type { BirdSpecies } from "./bird";

export type GameScreen = "title" | "playing" | "results" | "guide";

export type PhaseId = "dawn" | "noon" | "dusk" | "night";

export type FlightPattern = "straight" | "arc" | "dive" | "zigzag";

export type NetPhase = "idle" | "casting" | "open" | "retracting" | "cooldown";

export interface FlyingBird {
  id: string;
  species: BirdSpecies;
  pattern: FlightPattern;
  direction: 1 | -1;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  x: number;
  y: number;
  progress: number;
  speed: number;
  wobble: number;
  spawnTime: number;
  flinchUntil: number; // 0 if no flinch active; otherwise seconds timestamp from performance.now()/1000
  flinchDx: number; // lateral offset (px) applied while flinchUntil > now
  speedBurstUntil: number;
  dodgeUntil: number;
  dodgeDx: number; // per-second bank velocity components
  dodgeDy: number;
  biteStart: number; // 0 for non-Legendary
  biteEnd: number;
  biteTriggered: boolean; // true once the bird has entered its bite window
}

export interface CatchEffectData {
  id: string;
  x: number;
  y: number;
  points: number;
  name: string;
  color: string;
}

export interface RevealBird {
  species: BirdSpecies;
  shownAt: number;
}

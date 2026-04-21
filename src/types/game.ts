import type { BirdSpecies } from "./bird";

export type GameScreen = "title" | "playing" | "results" | "guide";

export type PhaseId = "dawn" | "noon" | "dusk" | "night";

export type FlightPattern = "straight" | "arc" | "dive" | "zigzag";

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

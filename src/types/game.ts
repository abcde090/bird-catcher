import type { BirdSpecies } from "./bird";

export type GameScreen =
  | "title"
  | "playing"
  | "card-reveal"
  | "results"
  | "field-guide";
export type DayPhase = "dawn" | "noon" | "dusk" | "night";
export type FlightPattern = "straight" | "arc" | "dive" | "zigzag";

export interface FlyingBird {
  id: string;
  species: BirdSpecies;
  x: number;
  y: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  pattern: FlightPattern;
  direction: 1 | -1;
  spawnTime: number;
}

export interface CatchEffectData {
  id: string;
  x: number;
  y: number;
  score: number;
  birdName: string;
  spawnTime: number;
}

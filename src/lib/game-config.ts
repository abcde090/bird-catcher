import type { ConservationStatus } from "../types/bird";
import type { DayPhase, FlightPattern } from "../types/game";

export const ROUND_DURATION = 180;

export const PHASE_CONFIG: Record<
  DayPhase,
  {
    startTime: number;
    endTime: number;
    label: string;
    emoji: string;
    spawnInterval: number;
    speedMultiplier: number;
    gradientFrom: string;
    gradientTo: string;
    allowedStatuses: ConservationStatus[];
  }
> = {
  dawn: {
    startTime: 180,
    endTime: 135,
    label: "Dawn",
    emoji: "🌅",
    spawnInterval: 1.8,
    speedMultiplier: 1.0,
    gradientFrom: "#fde68a",
    gradientTo: "#f59e0b",
    allowedStatuses: ["least_concern"],
  },
  noon: {
    startTime: 135,
    endTime: 90,
    label: "Noon",
    emoji: "☀️",
    spawnInterval: 1.2,
    speedMultiplier: 1.4,
    gradientFrom: "#7dd3fc",
    gradientTo: "#bae6fd",
    allowedStatuses: ["least_concern", "near_threatened"],
  },
  dusk: {
    startTime: 90,
    endTime: 45,
    label: "Dusk",
    emoji: "🌆",
    spawnInterval: 0.8,
    speedMultiplier: 1.9,
    gradientFrom: "#ea580c",
    gradientTo: "#dc2626",
    allowedStatuses: [
      "least_concern",
      "near_threatened",
      "vulnerable",
      "endangered",
      "critically_endangered",
    ],
  },
  night: {
    startTime: 45,
    endTime: 0,
    label: "Night",
    emoji: "🌙",
    spawnInterval: 0.6,
    speedMultiplier: 2.5,
    gradientFrom: "#1e293b",
    gradientTo: "#0f172a",
    allowedStatuses: [
      "least_concern",
      "near_threatened",
      "vulnerable",
      "endangered",
      "critically_endangered",
    ],
  },
};

export const RARITY_CONFIG: Record<
  ConservationStatus,
  {
    basePoints: number;
    speedMultiplier: number;
    spawnWeight: number;
    size: number;
  }
> = {
  least_concern: {
    basePoints: 50,
    speedMultiplier: 1.0,
    spawnWeight: 10,
    size: 60,
  },
  near_threatened: {
    basePoints: 100,
    speedMultiplier: 1.3,
    spawnWeight: 5,
    size: 52,
  },
  vulnerable: {
    basePoints: 150,
    speedMultiplier: 1.6,
    spawnWeight: 3,
    size: 44,
  },
  endangered: {
    basePoints: 250,
    speedMultiplier: 2.0,
    spawnWeight: 1,
    size: 36,
  },
  critically_endangered: {
    basePoints: 300,
    speedMultiplier: 2.4,
    spawnWeight: 1,
    size: 32,
  },
  extinct: { basePoints: 0, speedMultiplier: 0, spawnWeight: 0, size: 0 },
};

export const FIRST_CATCH_BONUS = 50;
export const MAX_MISSES = 5;
export const MAX_ACTIVE_BIRDS = 8;
export const COMBO_WINDOW = 2;
export const COMBO_THRESHOLDS = [2, 3, 5, 8] as const;
export const BASE_BIRD_SPEED = 200;
export const CATCH_EFFECT_DURATION = 500;
export const CARD_REVEAL_DURATION = 3000;

export const FLIGHT_PATTERNS: FlightPattern[] = [
  "straight",
  "arc",
  "dive",
  "zigzag",
];

export function getPhaseForTime(timeRemaining: number): DayPhase {
  if (timeRemaining > 135) return "dawn";
  if (timeRemaining > 90) return "noon";
  if (timeRemaining > 45) return "dusk";
  return "night";
}

export function getComboMultiplier(combo: number): number {
  if (combo >= 8) return 8;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

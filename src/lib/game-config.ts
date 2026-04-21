import type { ConservationStatus } from "../types/bird";
import type { PhaseId } from "../types/game";

export const ROUND_DURATION = 90;
export const MAX_MISSES = 6;
export const MAX_ACTIVE = 6;

// Net cast state machine (seconds)
export const NET_CAST_DURATION = 0.5;
export const NET_OPEN_DURATION = 0.8;
export const NET_RETRACT_DURATION = 0.4;
export const NET_COOLDOWN = 0.3;

// Geometry
export const NET_RADIUS = 60;
export const NET_CHARACTER_Y_OFFSET = 80;

// Tier reaction tuning
export const FLINCH_TRIGGER_DIST = 120;
export const FLINCH_DURATION = 0.15;
export const FLINCH_MAX_OFFSET = 18;
export const RARE_SPEED_BURST_MULT = 1.4;
export const RARE_SPEED_BURST_DURATION = 0.4;
export const EPIC_DODGE_SPEED = 180;
export const EPIC_DODGE_DURATION = 0.5;
export const LEGENDARY_BITE_DURATION = 0.7;
export const LEGENDARY_BITE_WINDOW_MIN = 0.3;
export const LEGENDARY_BITE_WINDOW_MAX = 0.7;

export interface RarityConfig {
  label: string;
  points: number;
  weight: number;
  sizeScale: number;
  speed: number;
  color: string;
  ring: string;
}

export const RARITY: Record<ConservationStatus, RarityConfig> = {
  least_concern: {
    label: "Common",
    points: 50,
    weight: 10,
    sizeScale: 1.1,
    speed: 0.85,
    color: "#6a8a3c",
    ring: "#9cb662",
  },
  near_threatened: {
    label: "Uncommon",
    points: 100,
    weight: 5,
    sizeScale: 1.0,
    speed: 1.0,
    color: "#d4a43a",
    ring: "#e8c260",
  },
  vulnerable: {
    label: "Rare",
    points: 150,
    weight: 3,
    sizeScale: 0.95,
    speed: 1.2,
    color: "#e08a3a",
    ring: "#f2a860",
  },
  endangered: {
    label: "Epic",
    points: 250,
    weight: 1,
    sizeScale: 0.9,
    speed: 1.4,
    color: "#c85530",
    ring: "#e87860",
  },
  critically_endangered: {
    label: "Legendary",
    points: 400,
    weight: 0.6,
    sizeScale: 0.85,
    speed: 1.6,
    color: "#9c3a70",
    ring: "#c85d96",
  },
};

export interface PhaseConfig {
  id: PhaseId;
  label: string;
  start: number;
  end: number;
  sky: [string, string, string, string];
  sun: string;
  horizon: string;
  allowed: ConservationStatus[];
  spawn: number;
}

export const PHASES: PhaseConfig[] = [
  {
    id: "dawn",
    label: "Dawn",
    start: 90,
    end: 67,
    sky: ["#f5d6a0", "#f0a86a", "#d8785a", "#6a4a5a"],
    sun: "#f5a85a",
    horizon: "#2a3138",
    allowed: ["least_concern"],
    spawn: 1.6,
  },
  {
    id: "noon",
    label: "Midday",
    start: 67,
    end: 45,
    sky: ["#a8d4e8", "#7fb8d4", "#c8e0e8", "#e8d4b0"],
    sun: "#f5f0d8",
    horizon: "#4a5a48",
    allowed: ["least_concern", "near_threatened"],
    spawn: 1.2,
  },
  {
    id: "dusk",
    label: "Dusk",
    start: 45,
    end: 22,
    sky: ["#d87030", "#b8452a", "#6a2840", "#2a1a3a"],
    sun: "#e85a30",
    horizon: "#1a1018",
    allowed: ["least_concern", "near_threatened", "vulnerable", "endangered"],
    spawn: 0.9,
  },
  {
    id: "night",
    label: "Night",
    start: 22,
    end: 0,
    sky: ["#1a1a2e", "#0f0f22", "#2a2040", "#050510"],
    sun: "#e8d4a0",
    horizon: "#000000",
    allowed: [
      "least_concern",
      "near_threatened",
      "vulnerable",
      "endangered",
      "critically_endangered",
    ],
    spawn: 0.7,
  },
];

export function getPhase(t: number): PhaseConfig {
  return (
    PHASES.find((p) => t <= p.start && t > p.end) ?? PHASES[PHASES.length - 1]
  );
}

export function getComboMult(c: number): number {
  if (c >= 8) return 4;
  if (c >= 5) return 3;
  if (c >= 3) return 2;
  if (c >= 2) return 1.5;
  return 1;
}

export function weightedPick<T>(items: T[], getW: (item: T) => number): T {
  const total = items.reduce((s, i) => s + getW(i), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= getW(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

import type { BirdSpecies } from "../types/bird";
import type { DayPhase, FlyingBird, FlightPattern } from "../types/game";
import {
  PHASE_CONFIG,
  RARITY_CONFIG,
  BASE_BIRD_SPEED,
  FLIGHT_PATTERNS,
} from "./game-config";
import { generateFlightEndpoints } from "./flight-paths";

let nextId = 0;

function pickWeightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function spawnBird(
  birds: BirdSpecies[],
  phase: DayPhase,
  viewport: { width: number; height: number },
): FlyingBird | null {
  const config = PHASE_CONFIG[phase];
  const eligible = birds.filter((b) =>
    config.allowedStatuses.includes(b.conservationStatus),
  );
  if (eligible.length === 0) return null;

  const weights = eligible.map(
    (b) => RARITY_CONFIG[b.conservationStatus].spawnWeight,
  );
  const species = pickWeightedRandom(eligible, weights);
  const rarityConfig = RARITY_CONFIG[species.conservationStatus];

  const pattern: FlightPattern = pickWeightedRandom(
    FLIGHT_PATTERNS,
    species.conservationStatus === "least_concern"
      ? [10, 5, 3, 0]
      : [5, 5, 5, 5],
  );

  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  const endpoints = generateFlightEndpoints(pattern, direction, viewport);
  const speed =
    BASE_BIRD_SPEED * config.speedMultiplier * rarityConfig.speedMultiplier;

  return {
    id: `bird-${nextId++}`,
    species,
    x: endpoints.startX,
    y: endpoints.startY,
    startX: endpoints.startX,
    startY: endpoints.startY,
    endX: endpoints.endX,
    endY: endpoints.endY,
    progress: 0,
    speed,
    pattern,
    direction,
    spawnTime: performance.now() / 1000,
  };
}

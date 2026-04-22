import type { BirdSpecies, ConservationStatus } from "../types/bird";
import type { FlyingBird, FlightPattern } from "../types/game";
import {
  RARITY,
  TIER_SPAWN_WEIGHT,
  NET_CHARACTER_Y_OFFSET,
  weightedPick,
  LEGENDARY_BITE_DURATION,
  LEGENDARY_BITE_WINDOW_MIN,
  LEGENDARY_BITE_WINDOW_MAX,
  type PhaseConfig,
} from "./game-config";
import { getBirdBaseSize, getPoleOffset } from "./viewport";

export function spawnBird(
  birds: BirdSpecies[],
  phase: PhaseConfig,
  viewport: { width: number; height: number },
  nextId: number,
): FlyingBird | null {
  // Tier-first pick: choose a conservation status using TIER_SPAWN_WEIGHT
  // restricted to the phase's allowed tiers, then uniformly pick a species
  // within that tier. Decouples spawn probability from roster size.
  const eligibleTiers = phase.allowed.filter((t) =>
    birds.some((b) => b.status === t),
  );
  if (eligibleTiers.length === 0) return null;

  const chosenTier: ConservationStatus = weightedPick(
    eligibleTiers,
    (t) => TIER_SPAWN_WEIGHT[t],
  );

  const tierSpecies = birds.filter((b) => b.status === chosenTier);
  if (tierSpecies.length === 0) return null;
  const species = tierSpecies[Math.floor(Math.random() * tierSpecies.length)];

  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

  const r = Math.random();
  const pattern: FlightPattern =
    r < 0.55 ? "straight" : r < 0.85 ? "arc" : r < 0.95 ? "dive" : "zigzag";

  const startX = direction > 0 ? -120 : viewport.width + 120;
  const endX = direction > 0 ? viewport.width + 120 : -120;

  // Keep spawns above the character's reach. originY is where the cast
  // originates (the net hoop); birds below that can't be caught because
  // the arc can't curve downward past the hand. Leave a bird-sized buffer
  // above that line so the whole bird body is reachable. Top margin
  // clears the HUD plates.
  const birdDiameter = getBirdBaseSize();
  const originY = viewport.height - NET_CHARACTER_Y_OFFSET - getPoleOffset();
  // Clear the HUD's tallest column (Chapter + Time, stacked center). On
  // mobile this is ~120 px from the top; 170 leaves comfortable headroom
  // on both phones and desktops.
  const topMargin = 170;
  const bottomMargin = birdDiameter + 30;
  const maxY = Math.max(topMargin + 60, originY - bottomMargin);
  const baseY = topMargin + Math.random() * (maxY - topMargin);

  const speed = (120 + Math.random() * 50) * RARITY[species.status].speed;

  const spawnTime = performance.now() / 1000;
  let biteStart = 0;
  let biteEnd = 0;

  if (species.status === "critically_endangered") {
    const totalDx = Math.abs(endX - startX);
    const totalFlightSeconds = totalDx / speed;
    const centerFrac =
      LEGENDARY_BITE_WINDOW_MIN +
      Math.random() * (LEGENDARY_BITE_WINDOW_MAX - LEGENDARY_BITE_WINDOW_MIN);
    const centerT = spawnTime + centerFrac * totalFlightSeconds;
    biteStart = centerT - LEGENDARY_BITE_DURATION / 2;
    biteEnd = centerT + LEGENDARY_BITE_DURATION / 2;
  }

  return {
    id: `b${nextId}`,
    species,
    pattern,
    direction,
    startX,
    endX,
    startY: baseY,
    // Clamp the end-Y drift so the bird stays within the reachable band
    // even if it drifts downward over the course of its flight.
    endY: Math.min(maxY, baseY + (Math.random() - 0.5) * 80),
    x: startX,
    y: baseY,
    progress: 0,
    speed,
    wobble: 0,
    spawnTime,
    flinchUntil: 0,
    flinchDx: 0,
    speedBurstUntil: 0,
    dodgeUntil: 0,
    dodgeDx: 0,
    dodgeDy: 0,
    biteStart,
    biteEnd,
    biteTriggered: false,
  };
}

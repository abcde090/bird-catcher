import type { BirdSpecies } from "../types/bird";
import type { FlyingBird, FlightPattern } from "../types/game";
import {
  RARITY,
  weightedPick,
  LEGENDARY_BITE_DURATION,
  LEGENDARY_BITE_WINDOW_MIN,
  LEGENDARY_BITE_WINDOW_MAX,
  type PhaseConfig,
} from "./game-config";

export function spawnBird(
  birds: BirdSpecies[],
  phase: PhaseConfig,
  viewport: { width: number; height: number },
  nextId: number,
): FlyingBird | null {
  const eligible = birds.filter((b) => phase.allowed.includes(b.status));
  if (eligible.length === 0) return null;

  const species = weightedPick(eligible, (b) => RARITY[b.status].weight);
  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

  const r = Math.random();
  const pattern: FlightPattern =
    r < 0.55 ? "straight" : r < 0.85 ? "arc" : r < 0.95 ? "dive" : "zigzag";

  const startX = direction > 0 ? -120 : viewport.width + 120;
  const endX = direction > 0 ? viewport.width + 120 : -120;
  const baseY = 140 + Math.random() * (viewport.height * 0.55);
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
    endY: baseY + (Math.random() - 0.5) * 80,
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

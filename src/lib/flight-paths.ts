import type { FlightPattern } from "../types/game";

interface Viewport {
  width: number;
  height: number;
}

interface FlightEndpoints {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function generateFlightEndpoints(
  pattern: FlightPattern,
  direction: 1 | -1,
  viewport: Viewport,
): FlightEndpoints {
  const margin = 100;
  const enterX = direction === 1 ? -margin : viewport.width + margin;
  const exitX = direction === 1 ? viewport.width + margin : -margin;
  const minY = 80;
  const maxY = viewport.height - 120;

  switch (pattern) {
    case "straight": {
      const y = minY + Math.random() * (maxY - minY);
      // Slight angle — not perfectly horizontal
      const drift = (Math.random() - 0.5) * 100;
      return { startX: enterX, startY: y, endX: exitX, endY: y + drift };
    }
    case "arc": {
      const startY = maxY - Math.random() * (maxY - minY) * 0.2;
      const endY = startY;
      return { startX: enterX, startY, endX: exitX, endY };
    }
    case "dive": {
      const startY = minY + Math.random() * 60;
      const endY = maxY - Math.random() * 40;
      return { startX: enterX, startY, endX: exitX, endY };
    }
    case "zigzag": {
      const y = minY + Math.random() * (maxY - minY);
      return { startX: enterX, startY: y, endX: exitX, endY: y };
    }
  }
}

export function interpolatePosition(
  pattern: FlightPattern,
  progress: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
): { x: number; y: number } {
  // Ease-in: birds accelerate as they cross (harder to catch later)
  const t = progress * progress * (3 - 2 * progress); // smoothstep
  const baseX = startX + (endX - startX) * t;
  const baseY = startY + (endY - startY) * t;
  const bob = Math.sin(time * 4) * 5;

  switch (pattern) {
    case "straight":
      return { x: baseX, y: baseY + bob };
    case "arc": {
      // Taller arc
      const arcHeight = -180 * Math.sin(progress * Math.PI);
      return { x: baseX, y: baseY + arcHeight + bob };
    }
    case "dive": {
      // Accelerating dive
      const diveProgress = progress * progress;
      const diveY = startY + (endY - startY) * diveProgress;
      return { x: baseX, y: diveY + bob };
    }
    case "zigzag": {
      // Wider, faster zigzag
      const zigzag = Math.sin(progress * Math.PI * 4) * 90;
      return { x: baseX, y: baseY + zigzag + bob };
    }
  }
}

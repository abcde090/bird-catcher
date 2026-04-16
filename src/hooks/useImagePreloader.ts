import { useState, useEffect } from "react";
import type { BirdSpecies } from "../types/bird";

export function useImagePreloader(birds: BirdSpecies[]): {
  loaded: boolean;
  progress: number;
} {
  const [loadedCount, setLoadedCount] = useState(0);
  const total = birds.length;

  useEffect(() => {
    if (total === 0) return;

    let count = 0;

    birds.forEach((bird) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        count++;
        setLoadedCount(count);
      };
      img.src = bird.imageUrl;
    });
  }, [birds, total]);

  return {
    loaded: total > 0 && loadedCount >= total,
    progress: total > 0 ? loadedCount / total : 0,
  };
}

import { useEffect, useState } from "react";
import type { BirdSpecies } from "../types/bird";
import { asset } from "../lib/asset";

export function useImagePreloader(birds: BirdSpecies[]): { loaded: boolean } {
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (birds.length === 0) return;

    let cancelled = false;

    const done = () => {
      if (cancelled) return;
      setLoadedCount((n) => n + 1);
    };

    for (const b of birds) {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = asset(b.imageUrl);
    }

    return () => {
      cancelled = true;
    };
  }, [birds]);

  return { loaded: birds.length > 0 && loadedCount >= birds.length };
}

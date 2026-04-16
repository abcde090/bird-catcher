import { useRef, useCallback, useEffect } from "react";
import { useGameStore } from "../stores/useGameStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useBirdStore } from "../stores/useBirdStore";
import { spawnBird } from "../lib/spawner";
import { interpolatePosition } from "../lib/flight-paths";
import {
  PHASE_CONFIG,
  RARITY_CONFIG,
  FIRST_CATCH_BONUS,
  MAX_MISSES,
  MAX_ACTIVE_BIRDS,
  COMBO_WINDOW,
  getPhaseForTime,
  getComboMultiplier,
} from "../lib/game-config";
import type { FlyingBird } from "../types/game";

export function useGameLoop() {
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const rafRef = useRef(0);
  const birdsRef = useRef<FlyingBird[]>([]);

  const gameStore = useGameStore;
  const collectionStore = useCollectionStore;
  const allBirds = useBirdStore((s) => s.birds);

  const tick = useCallback(
    (timestamp: number) => {
      const state = gameStore.getState();
      if (state.screen !== "playing") return;

      const delta =
        lastFrameRef.current === 0
          ? 0.016
          : (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;

      const dt = Math.min(delta, 0.1);

      const newTime = Math.max(0, state.timeRemaining - dt);
      const newPhase = getPhaseForTime(newTime);

      const now = Date.now();
      if (
        state.combo > 0 &&
        (now - state.lastCatchTime) / 1000 > COMBO_WINDOW
      ) {
        gameStore.setState({ combo: 0 });
      }

      const phaseConfig = PHASE_CONFIG[newPhase];
      const timeSinceSpawn = timestamp / 1000 - lastSpawnRef.current;
      if (
        timeSinceSpawn >= phaseConfig.spawnInterval &&
        birdsRef.current.length < MAX_ACTIVE_BIRDS
      ) {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        const newBird = spawnBird(allBirds, newPhase, viewport);
        if (newBird) {
          birdsRef.current = [...birdsRef.current, newBird];
          lastSpawnRef.current = timestamp / 1000;
        }
      }

      let missesThisFrame = 0;
      const currentTime = timestamp / 1000;

      birdsRef.current = birdsRef.current
        .map((bird) => {
          const elapsed = currentTime - bird.spawnTime;
          const totalDistance = Math.sqrt(
            (bird.endX - bird.startX) ** 2 + (bird.endY - bird.startY) ** 2,
          );
          const duration = totalDistance / bird.speed;
          const progress = Math.min(elapsed / duration, 1);

          const pos = interpolatePosition(
            bird.pattern,
            progress,
            bird.startX,
            bird.startY,
            bird.endX,
            bird.endY,
            currentTime,
          );

          return { ...bird, x: pos.x, y: pos.y, progress };
        })
        .filter((bird) => {
          if (bird.progress >= 1) {
            missesThisFrame++;
            return false;
          }
          return true;
        });

      const totalMisses = state.misses + missesThisFrame;
      const isGameOver = newTime <= 0 || totalMisses >= MAX_MISSES;

      gameStore.setState({
        timeRemaining: newTime,
        currentPhase: newPhase,
        activeBirds: birdsRef.current,
        misses: totalMisses,
      });

      if (isGameOver) {
        const finalScore = gameStore.getState().score;
        if (finalScore > state.highScore) {
          gameStore.getState().setHighScore(finalScore);
        }
        collectionStore.getState().addGame();
        gameStore.setState({ screen: "results" });
        birdsRef.current = [];
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [allBirds, gameStore, collectionStore],
  );

  const start = useCallback(() => {
    lastFrameRef.current = 0;
    lastSpawnRef.current = 0;
    birdsRef.current = [];
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const catchBird = useCallback(
    (birdId: string, clickX: number, clickY: number) => {
      const state = gameStore.getState();
      const bird = birdsRef.current.find((b) => b.id === birdId);
      if (!bird) return;

      birdsRef.current = birdsRef.current.filter((b) => b.id !== birdId);

      const rarityConfig = RARITY_CONFIG[bird.species.conservationStatus];
      const isNew = !collectionStore.getState().isDiscovered(bird.species.id);
      const basePoints =
        rarityConfig.basePoints + (isNew ? FIRST_CATCH_BONUS : 0);

      gameStore.getState().incrementCombo();
      const comboMultiplier = getComboMultiplier(state.combo + 1);
      const totalPoints = basePoints * comboMultiplier;

      gameStore.getState().addScore(totalPoints);
      gameStore.getState().addCatch(bird.species.id, isNew);
      collectionStore.getState().addCatch();

      if (isNew) {
        collectionStore.getState().discoverBird(bird.species.id);
      }

      gameStore.getState().addCatchEffect({
        id: `effect-${Date.now()}`,
        x: clickX,
        y: clickY,
        score: totalPoints,
        birdName: bird.species.commonName,
        spawnTime: Date.now(),
      });

      if (isNew) {
        gameStore.setState({
          screen: "card-reveal",
          revealBirdId: bird.species.id,
          activeBirds: birdsRef.current,
        });
        stop();
      } else {
        gameStore.setState({ activeBirds: birdsRef.current });
      }
    },
    [gameStore, collectionStore, stop],
  );

  const resumeAfterReveal = useCallback(() => {
    gameStore.setState({ screen: "playing", revealBirdId: null });
    lastFrameRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  }, [gameStore, tick]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop, catchBird, resumeAfterReveal };
}

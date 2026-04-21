import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../stores/useGameStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useBirdStore } from "../stores/useBirdStore";
import { spawnBird } from "../lib/spawner";
import {
  MAX_ACTIVE,
  MAX_MISSES,
  RARITY,
  getComboMult,
  getPhase,
} from "../lib/game-config";
import type { FlyingBird } from "../types/game";

export function useGameLoop() {
  const birdsRef = useRef<FlyingBird[]>([]);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextIdRef = useRef(0);
  const screenRef = useRef<string>("title");

  const gameStore = useGameStore;
  const collectionStore = useCollectionStore;
  const birdStore = useBirdStore;

  const screen = useGameStore((s) => s.screen);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const tick = useCallback(
    (timestamp: number) => {
      if (screenRef.current !== "playing") return;

      const state = gameStore.getState();
      const now = timestamp / 1000;
      const delta =
        lastFrameRef.current === 0
          ? 0.016
          : Math.min(0.1, now - lastFrameRef.current);
      lastFrameRef.current = now;

      const timeRemaining = Math.max(0, state.timeRemaining - delta);
      const phase = getPhase(timeRemaining);
      const spawnInterval = phase.spawn;

      if (
        now - lastSpawnRef.current >= spawnInterval &&
        birdsRef.current.length < MAX_ACTIVE
      ) {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        const nb = spawnBird(
          birdStore.getState().birds,
          phase,
          viewport,
          nextIdRef.current++,
        );
        if (nb) {
          birdsRef.current = [...birdsRef.current, nb];
          lastSpawnRef.current = now;
        }
      }

      let missed = 0;
      birdsRef.current = birdsRef.current
        .map((b) => {
          const elapsed = now - b.spawnTime;
          const totalDx = Math.abs(b.endX - b.startX);
          const duration = totalDx / b.speed;
          const progress = Math.min(1, elapsed / duration);
          const t = progress * progress * (3 - 2 * progress);
          const baseX = b.startX + (b.endX - b.startX) * t;
          let y = b.startY + (b.endY - b.startY) * t;
          const bob = Math.sin(now * 2.5 + b.startY) * 2.5;

          if (b.pattern === "arc") {
            y += -100 * Math.sin(progress * Math.PI);
          } else if (b.pattern === "zigzag") {
            y += Math.sin(progress * Math.PI * 2.5) * 35;
          } else if (b.pattern === "dive") {
            y = b.startY + (b.endY - b.startY) * (progress * progress);
          }

          return {
            ...b,
            x: baseX,
            y: y + bob,
            progress,
            wobble: Math.sin(now * 3 + b.startY) * 1.5,
          };
        })
        .filter((b) => {
          if (b.progress >= 1) {
            missed++;
            return false;
          }
          return true;
        });

      // Combo expiry
      let combo = state.combo;
      if (combo > 0 && Date.now() - state.lastCatchTime > 2500) {
        combo = 0;
      }

      const totalMisses = state.misses + missed;
      const missFlashKey = missed > 0 ? Date.now() : state.missFlashKey;
      const comboAfterMiss = missed > 0 ? 0 : combo;

      const gameOver = timeRemaining <= 0 || totalMisses >= MAX_MISSES;

      gameStore.setState({
        timeRemaining,
        misses: totalMisses,
        combo: comboAfterMiss,
        activeBirds: birdsRef.current,
        missFlashKey,
      });

      // --- Net state machine ---
      const net = gameStore.getState().net;
      if (net.phase !== "idle") {
        const elapsed = now - net.startTime;
        const CAST = 0.5;
        const OPEN = 0.8;
        const RETRACT = 0.4;
        const COOLDOWN = 0.3;

        if (net.phase === "casting" && elapsed >= CAST) {
          gameStore.setState({
            net: { ...net, phase: "open", catchesThisCast: 0 },
          });
        } else if (net.phase === "open" && elapsed >= CAST + OPEN) {
          const current = gameStore.getState();
          const hadCatches = current.net.catchesThisCast > 0;
          if (!hadCatches) {
            gameStore.setState({
              misses: current.misses + 1,
              missFlashKey: Date.now(),
            });
          }
          gameStore.setState({
            net: { ...gameStore.getState().net, phase: "retracting" },
          });
        } else if (
          net.phase === "retracting" &&
          elapsed >= CAST + OPEN + RETRACT
        ) {
          gameStore.setState({
            net: { ...gameStore.getState().net, phase: "cooldown" },
          });
        } else if (
          net.phase === "cooldown" &&
          elapsed >= CAST + OPEN + RETRACT + COOLDOWN
        ) {
          gameStore.setState({
            net: { ...gameStore.getState().net, phase: "idle" },
          });
        }
      }

      if (gameOver) {
        const finalScore = gameStore.getState().score;
        const { highScore, setHighScore } = collectionStore.getState();
        if (finalScore > highScore) setHighScore(finalScore);
        birdsRef.current = [];
        gameStore.setState({ activeBirds: [], screen: "results" });
        cancelAnimationFrame(rafRef.current);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [gameStore, collectionStore, birdStore],
  );

  const catchBird = useCallback(
    (id: string, cx: number, cy: number) => {
      const state = gameStore.getState();
      const bird = birdsRef.current.find((b) => b.id === id);
      if (!bird) return;

      birdsRef.current = birdsRef.current.filter((b) => b.id !== id);
      const rarity = RARITY[bird.species.status];
      const isNew = !collectionStore.getState().isDiscovered(bird.species.id);

      const nextCombo = state.combo + 1;
      const mult = getComboMult(nextCombo);
      const points = Math.round((rarity.points + (isNew ? 50 : 0)) * mult);

      const fxId = `fx${Date.now()}${Math.random()}`;
      const newEffect = {
        id: fxId,
        x: cx,
        y: cy,
        points,
        name: bird.species.name,
        color: rarity.ring,
      };

      gameStore.setState({
        score: state.score + points,
        combo: nextCombo,
        lastCatchTime: Date.now(),
        catches: [...state.catches, bird.species],
        catchEffects: [...state.catchEffects, newEffect],
        activeBirds: birdsRef.current,
        newDiscoveries: state.newDiscoveries + (isNew ? 1 : 0),
        revealBird: isNew
          ? { species: bird.species, shownAt: performance.now() }
          : state.revealBird,
      });

      if (isNew) {
        collectionStore.getState().discoverBird(bird.species.id);
      }

      setTimeout(() => {
        const s = gameStore.getState();
        gameStore.setState({
          catchEffects: s.catchEffects.filter((e) => e.id !== fxId),
        });
      }, 800);
    },
    [gameStore, collectionStore],
  );

  const closeReveal = useCallback(() => {
    gameStore.setState({ revealBird: null });
  }, [gameStore]);

  useEffect(() => {
    if (screen !== "playing") return;
    birdsRef.current = [];
    nextIdRef.current = 0;
    lastFrameRef.current = 0;
    lastSpawnRef.current = performance.now() / 1000;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, tick]);

  return { catchBird, closeReveal };
}

import { useCallback, useEffect, useRef } from "react";
import { useGameStore } from "../stores/useGameStore";
import { useCollectionStore } from "../stores/useCollectionStore";
import { useBirdStore } from "../stores/useBirdStore";
import { spawnBird } from "../lib/spawner";
import {
  MAX_ACTIVE,
  MAX_MISSES,
  NET_RADIUS,
  RARITY,
  LEGENDARY_BITE_DURATION,
  FLINCH_TRIGGER_DIST,
  FLINCH_DURATION,
  FLINCH_MAX_OFFSET,
  RARE_SPEED_BURST_MULT,
  RARE_SPEED_BURST_DURATION,
  EPIC_DODGE_SPEED,
  EPIC_DODGE_DURATION,
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

      birdsRef.current = birdsRef.current
        .map((b) => {
          const isLegendary = b.species.status === "critically_endangered";
          const inBite = isLegendary && now >= b.biteStart && now <= b.biteEnd;

          // Freeze position during bite window: return bird unchanged except
          // mark biteTriggered = true so we know it has entered the pause
          if (inBite) {
            return { ...b, biteTriggered: true };
          }

          // If the bite window has already passed, discount it from elapsed so the
          // bird resumes from where it paused (not from where it would've been).
          const pastBite = isLegendary && b.biteTriggered && now > b.biteEnd;
          const effectiveElapsed = pastBite
            ? now - b.spawnTime - LEGENDARY_BITE_DURATION
            : now - b.spawnTime;

          const speedMult = now < b.speedBurstUntil ? RARE_SPEED_BURST_MULT : 1;
          const effectiveSpeed = b.speed * speedMult;
          const totalDx = Math.abs(b.endX - b.startX);
          const duration = totalDx / effectiveSpeed;
          const progress = Math.min(1, effectiveElapsed / duration);
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

          const flinchOffset = now < b.flinchUntil ? b.flinchDx : 0;
          let dodgeX = 0;
          let dodgeY = 0;
          if (now < b.dodgeUntil) {
            const remaining = b.dodgeUntil - now;
            dodgeX = b.dodgeDx * remaining;
            dodgeY = b.dodgeDy * remaining;
          }

          return {
            ...b,
            x: baseX + flinchOffset + dodgeX,
            y: y + bob + dodgeY,
            progress,
            wobble: Math.sin(now * 3 + b.startY) * 1.5,
          };
        })
        .filter((b) => b.progress < 1);

      // Combo expiry (only triggered by timeout — misses no longer reset combo here)
      let combo = state.combo;
      if (combo > 0 && Date.now() - state.lastCatchTime > 2500) {
        combo = 0;
      }

      const gameOver = timeRemaining <= 0 || state.misses >= MAX_MISSES;

      gameStore.setState({
        timeRemaining,
        combo,
        activeBirds: birdsRef.current,
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
          // Trigger tier reactions on any bird within flinch range of the target.
          // Mutates birdsRef in place — values are read in the .map above on next tick.
          const triggerDistSq = FLINCH_TRIGGER_DIST * FLINCH_TRIGGER_DIST;
          for (const b of birdsRef.current) {
            const dx = b.x - net.targetX;
            const dy = b.y - net.targetY;
            if (dx * dx + dy * dy > triggerDistSq) continue;

            const status = b.species.status;
            // Uncommon, Rare, Epic all flinch. (Legendary doesn't react — spec-aligned.)
            if (
              status === "near_threatened" ||
              status === "vulnerable" ||
              status === "endangered"
            ) {
              b.flinchUntil = now + FLINCH_DURATION;
              b.flinchDx = (Math.random() - 0.5) * 2 * FLINCH_MAX_OFFSET;
            }
            if (status === "vulnerable") {
              b.speedBurstUntil = now + RARE_SPEED_BURST_DURATION;
            }
            if (status === "endangered") {
              // Dodge direction = away from net center, normalized
              const dxFromNet = b.x - net.targetX;
              const dyFromNet = b.y - net.targetY;
              const len =
                Math.sqrt(dxFromNet * dxFromNet + dyFromNet * dyFromNet) || 1;
              b.dodgeDx = (dxFromNet / len) * EPIC_DODGE_SPEED;
              b.dodgeDy = (dyFromNet / len) * EPIC_DODGE_SPEED;
              b.dodgeUntil = now + EPIC_DODGE_DURATION;
            }
          }

          gameStore.setState({
            net: { ...net, phase: "open", catchesThisCast: 0 },
          });
        }

        // Every frame during open — check collisions
        if (net.phase === "open" && elapsed < CAST + OPEN) {
          for (const bird of birdsRef.current) {
            // Legendaries are only catchable during their bite window
            if (bird.species.status === "critically_endangered") {
              if (now < bird.biteStart || now > bird.biteEnd) continue;
            }
            const dx = bird.x - net.targetX;
            const dy = bird.y - net.targetY;
            const distSq = dx * dx + dy * dy;
            const hitR = 40 * RARITY[bird.species.status].sizeScale;
            const threshold = NET_RADIUS + hitR;
            if (distSq <= threshold * threshold) {
              catchBird(bird.id, net.targetX, net.targetY);
              gameStore.setState((s) => ({
                net: { ...s.net, catchesThisCast: s.net.catchesThisCast + 1 },
              }));
            }
          }
        }

        if (net.phase === "open" && elapsed >= CAST + OPEN) {
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
    [gameStore, collectionStore, birdStore, catchBird],
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

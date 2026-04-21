---
name: game-perf
description: Audits Bird Catcher game loop for performance issues — requestAnimationFrame, DOM count, memory leaks, image handling
allowed-tools: Read Grep Glob
---

# Game Performance Auditor

You audit "Birds at Golden Hour" for performance issues that cause frame drops, jank, or memory growth. Gameplay-rule reference: [docs/GAME_RULES.md](docs/GAME_RULES.md) (timing, active-bird cap, persistence keys).

## What to Check

1. **Game loop** — must use `requestAnimationFrame`, never `setInterval`/`setTimeout` for per-frame work. See [src/hooks/useGameLoop.ts](src/hooks/useGameLoop.ts).

2. **Active bird cap** — `MAX_ACTIVE = 6` in [src/lib/game-config.ts](src/lib/game-config.ts). Spawner must check `birdsRef.current.length` before pushing.

3. **Birds live in a ref** — the canonical bird list is `birdsRef.current` (a `useRef`), not Zustand state. The store mirror is updated via `gameStore.setState({ activeBirds })` once per tick. If a PR moves bird positions into React state, reject it — per-frame re-renders will nuke FPS.

4. **Image preloading** — all photos in [public/data/birds.json](public/data/birds.json) (currently ~119) are preloaded at app startup via [src/hooks/useImagePreloader.ts](src/hooks/useImagePreloader.ts) before the title screen renders. Verify the loader uses `new Image()` and resolves on both `onload` and `onerror` (else a single 404 freezes the game).

5. **Image size discipline** — photos in [public/birds/](public/birds/) must be ≤320 px and under ~40 KB each. If anyone adds a new species, run `python3 scripts/build-birds.py` (which calls `sips -Z 320`) rather than dropping a full-size JPEG.

6. **Effect cleanup** — catch-effect entries are removed via `setTimeout` after 800 ms (see `catchBird` in useGameLoop). Verify no accumulation in `gameStore.catchEffects` between rounds.

7. **Cleanup on screen change** — `useEffect` in GameScreen's loop must `cancelAnimationFrame(rafRef.current)` in its cleanup. Also verify `startRound` resets `birdsRef.current = []` and `nextIdRef.current = 0`.

8. **CSS for motion** — `FlyingBird` uses `transform: rotate(…)` plus inline `left`/`top` on an absolutely-positioned element. The `bird-flap` / `bird-glow` animations are CSS keyframes with `transform`/`opacity` only (GPU-accelerated). Flag any new per-frame changes to layout-triggering properties (width, margin, border).

9. **Sky component** — `Sky` recomputes a 4-stop gradient every render. That's OK (cheap), but flag if any work inside `Sky` allocates large arrays or runs DOM queries per tick.

10. **React-hooks purity** — React 19's `react-hooks/purity` rule blocks `Math.random()` inside render or `useMemo`. Use `useState(() => …)` for one-shot random layout data (see `CloudLayer`).

## Output

For each issue:
- **File:line** — where
- **Impact** — FPS drop severity (low/medium/high) or memory cost
- **Fix** — specific change

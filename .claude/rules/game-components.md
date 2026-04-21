---
paths:
  - "src/components/game/**/*.tsx"
  - "src/stores/useGameStore.ts"
  - "src/stores/useCollectionStore.ts"
  - "src/stores/useBirdStore.ts"
  - "src/hooks/useGameLoop.ts"
  - "src/hooks/useImagePreloader.ts"
  - "src/lib/spawner.ts"
  - "src/lib/game-config.ts"
---

# Game Component Rules

When working on "Birds at Golden Hour" game code. Full rule reference: [docs/GAME_RULES.md](../../docs/GAME_RULES.md). The items below are the non-obvious engineering constraints.

1. **requestAnimationFrame only** — `useGameLoop.ts` owns the per-frame tick. Never `setInterval` or `setTimeout` for per-frame updates (a short `setTimeout` to clean up catch-effects is fine).

2. **Birds live in a ref** — canonical bird list is `birdsRef.current` in [useGameLoop.ts](../../src/hooks/useGameLoop.ts). React/Zustand state is a once-per-tick mirror. Don't move bird positions into state — it tanks FPS.

3. **Max active birds** — `MAX_ACTIVE = 6` from [game-config.ts](../../src/lib/game-config.ts). Always check `birdsRef.current.length < MAX_ACTIVE` before pushing.

4. **Cleanup effects** — every `useEffect` that registers timers, intervals, or RAF must return a cleanup. The game-loop effect must `cancelAnimationFrame(rafRef.current)` on teardown.

5. **Preload images** — all photos in [public/birds/](../../public/birds/) are preloaded by [useImagePreloader.ts](../../src/hooks/useImagePreloader.ts) before the title screen renders. Resolve on both `onload` and `onerror` so a single 404 doesn't freeze the game.

6. **Phase timing** — `ROUND_DURATION = 90` seconds; Dawn 90→67, Noon 67→45, Dusk 45→22, Night 22→0. See `PHASES` in game-config. Timer counts DOWN.

7. **Conservation → rarity tiers** — five tiers, see `RARITY` map:
   - `least_concern` → Common (1.10 size, ×0.85 speed, 50 pts)
   - `near_threatened` → Uncommon (1.00 size, ×1.0 speed, 100 pts)
   - `vulnerable` → Rare (0.95 size, ×1.2 speed, 150 pts)
   - `endangered` → Epic (0.90 size, ×1.4 speed, 250 pts)
   - `critically_endangered` → Legendary (0.85 size, ×1.6 speed, 400 pts)

8. **Miss limit** — `MAX_MISSES = 10`; combo resets after any miss or 2.5 s without a catch.

9. **Combo multipliers** — see `getComboMult`: 2→1.5×, 3→2×, 5→3×, 8→4×.

10. **Bird photos** — render via [BirdImage.tsx](../../src/components/game/BirdImage.tsx) (circular `<img>` with rarity-colored border + drop shadow + `scaleX(-1)` for facing). Paths are local under `/birds/{id}.jpg`.

11. **Card reveal is a toast, not a screen** — a new-species catch sets `gameStore.revealBird` and keeps the loop running. Don't flip `screen` to show it.

12. **Screen state machine** — `title → playing → results → (title | playing)` plus a `guide` branch from title/results. `screen` lives in `useGameStore`.

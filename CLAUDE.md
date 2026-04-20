# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — ESLint (flat config, TypeScript + react-hooks + react-refresh)
- `npm run preview` — serve the production build locally

There is no test runner configured in this repo.

## Architecture

Bird Catcher is a standalone single-page arcade game (no backend). Static bird data is served from [public/data/birds.json](public/data/birds.json) (40 Australian species) and fetched at app startup.

### Screen flow (state machine)

[src/App.tsx](src/App.tsx) is a switch over `useGameStore.screen`:
`title → playing ⇄ card-reveal → results → (title | playing)`, plus a `field-guide` branch from title/results. There is no router — `screen` in [useGameStore](src/stores/useGameStore.ts) is the single source of truth.

### State (Zustand)

Four independent stores in [src/stores/](src/stores/):

- **useBirdStore** — fetches and caches bird species from `/data/birds.json`
- **useGameStore** — round state: screen, score, combo, misses, active birds, catch effects, per-round catches, high score (persisted to `localStorage`)
- **useCollectionStore** — cross-session progress: discovered bird IDs, total catches, games played (all `localStorage`-backed)
- **useFilterStore** — field-guide filters

Stores access each other via `useXStore.getState()` inside the game loop to avoid re-render churn.

### Game loop ([src/hooks/useGameLoop.ts](src/hooks/useGameLoop.ts))

A single `requestAnimationFrame` loop drives everything. Critical detail: **active birds live in a `useRef` array** (`birdsRef.current`), not in Zustand state — the store is updated once per frame via `setState`. This keeps per-frame mutation off React's render path. On catch/spawn, the ref is the canonical list; the store mirror is for rendering.

Per-tick work: decrement timer → maybe expire combo (2s window) → maybe spawn (based on phase `spawnInterval`, capped at `MAX_ACTIVE_BIRDS=8`) → advance each bird's progress via [flight-paths.ts](src/lib/flight-paths.ts) → drop birds at `progress >= 1` as misses → check game-over (`timeRemaining <= 0` or `misses >= MAX_MISSES=5`).

Card reveal pauses the loop: on a new-species catch, screen flips to `card-reveal` and `stop()` is called; `resumeAfterReveal()` kicks a new RAF and flips back to `playing`.

### Phases and rarity ([src/lib/game-config.ts](src/lib/game-config.ts))

Round is 180s split into four phases (dawn→noon→dusk→night) via `getPhaseForTime`. Each phase has its own `spawnInterval`, `speedMultiplier`, gradient, and `allowedStatuses` — rarer species only appear in later phases. Rarity (`ConservationStatus`) drives `basePoints`, `spawnWeight`, bird size, and a speed multiplier layered on top of the phase multiplier. Combo multiplier tiers at 2/3/5/8 (see `getComboMultiplier`).

Spawning ([src/lib/spawner.ts](src/lib/spawner.ts)) uses weighted-random selection by rarity over phase-eligible species, then picks a `FlightPattern` (`least_concern` birds bias to `straight`/`arc`).

### Components

- [src/components/game/](src/components/game/) — screens and in-game overlays (HUD, combo, phase announcement, card reveal, catch effects)
- [src/components/birds/](src/components/birds/) — presentational bird metadata chips
- Framer Motion for UI animation; birds themselves are positioned via inline style updates from the RAF loop (not Framer Motion) for performance

### Types

- [src/types/bird.ts](src/types/bird.ts) — `BirdSpecies`, `ConservationStatus`, `HabitatType`, `AustralianRegionId`, `FilterState`
- [src/types/game.ts](src/types/game.ts) — `GameScreen`, `DayPhase`, `FlightPattern`, `FlyingBird`, `CatchEffectData`

## Conventions

- Path style: relative imports throughout (no path aliases configured).
- Styling: Tailwind v4 via `@tailwindcss/vite` plugin — no `tailwind.config.*` file; config lives in CSS (`src/index.css`). Custom color tokens like `bg-night-sky` and `border-outback-gold` are defined there.
- React 19 + strict TS. `tsc -b` runs before `vite build`, so type errors block builds.
- Bird data is treated as immutable; mutations to game state go through store actions, never direct writes (except the deliberate `birdsRef` pattern in the game loop).

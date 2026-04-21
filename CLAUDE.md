# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — ESLint (flat config, TypeScript + react-hooks + react-refresh)
- `npm run preview` — serve the production build locally

There is no test runner configured in this repo.

## Game rules

Canonical gameplay reference — phase timing, rarity tiers, scoring, combo, miss cap, persistence, worked spawn-probability example: [docs/GAME_RULES.md](docs/GAME_RULES.md). Consult it before tweaking balance numbers.

## Architecture

"Birds at Golden Hour" is a standalone single-page arcade game (no backend). Static bird data is served from [public/data/birds.json](public/data/birds.json) (~119 Australian species) and fetched at app startup. Each species has a cropped photo in [public/birds/](public/birds/) (`{id}.jpg`, ≤320 px, ~25 KB each).

Regenerating the dataset: `python3 scripts/build-birds.py` — edits the inline `BIRDS` list, fetches Wikipedia REST summary thumbnails, resizes with `sips`, writes `public/data/birds.json`. Existing image files are skipped; delete a file to re-fetch it. The `.claude/skills/add-bird/` skill is a single-entry variant that walks through adding one species interactively.

The front-end is a port of a claude.ai/design handoff bundle (see `birds-catcher-handoff/`). Visual style is a "golden hour field journal" aesthetic — paper/ink/ember palette, Fraunces + JetBrains Mono type. Most component styling is inline to match the handoff 1:1; only design tokens, global animations, and shared classes (`.panel`, `.btn`, `.chip`, `.label`) live in [src/index.css](src/index.css).

### Screen flow (state machine)

[src/App.tsx](src/App.tsx) is a switch over `useGameStore.screen`:
`title → playing → results → (title | playing)`, plus a `guide` (field journal) branch from title/results. There is no router — `screen` in [useGameStore](src/stores/useGameStore.ts) is the single source of truth. A new-species reveal is an in-play toast (`CardReveal`), **not** a separate screen — the game loop keeps running behind it.

### State (Zustand)

Three stores in [src/stores/](src/stores/):

- **useBirdStore** — fetches and caches bird species from `/data/birds.json`
- **useGameStore** — round state: screen, score, combo, misses, time, active birds, catch effects, per-round catches, reveal toast, miss-flash trigger key
- **useCollectionStore** — cross-session progress: `highScore` + `discovered: Set<string>`, persisted to `localStorage` under `bc_high` / `bc_discovered`

Stores access each other via `useXStore.getState()` inside the game loop to avoid re-render churn.

### Game loop ([src/hooks/useGameLoop.ts](src/hooks/useGameLoop.ts))

A single `requestAnimationFrame` loop drives everything. Critical detail: **active birds live in a `useRef` array** (`birdsRef.current`), not in Zustand state — the store is updated once per frame via `setState`. This keeps per-frame mutation off React's render path. On catch/spawn, the ref is the canonical list; the store mirror is for rendering.

Per-tick work: decrement timer → maybe spawn (phase `spawn` interval, capped at `MAX_ACTIVE=6`) → advance each bird's progress along its flight pattern (straight / arc / dive / zigzag, with a sine bob) → drop birds at `progress >= 1` as misses → expire combo after 2.5s of inactivity → check game-over (`timeRemaining <= 0` or `misses >= MAX_MISSES=10`).

### Phases and rarity ([src/lib/game-config.ts](src/lib/game-config.ts))

Round is `ROUND_DURATION=90` seconds split into four phases (dawn 90→67, noon 67→45, dusk 45→22, night 22→0) via `getPhase`. Each phase has its own `spawn` interval, sky gradient (4-stop), sun color, horizon color, and `allowed` conservation statuses — rarer species only unlock in later phases. Rarity (`ConservationStatus`) drives `points`, `weight`, `sizeScale`, and `speed`. Combo multiplier tiers: 2→1.5×, 3→2×, 5→3×, 8→4× (see `getComboMult`). The Sky component linearly interpolates the 4-stop gradient between the current and next phase for smooth transitions.

Spawning ([src/lib/spawner.ts](src/lib/spawner.ts)) uses weighted-random selection by rarity over phase-eligible species. Flight pattern is sampled: 55% straight, 30% arc, 10% dive, 5% zigzag.

### Components

- [src/components/game/](src/components/game/) — everything: `Sky`, `TitleScreen`, `GameScreen`, `GameHUD` (with `PhaseGlyph`), `FlyingBird`, `BirdSVG`, `CatchEffect`, `MissFlash`, `CardReveal` (toast), `ResultsScreen`, `FieldGuide`
- Birds render as inline SVG via `BirdSVG` — silhouette path data lives in [src/lib/bird-silhouettes.ts](src/lib/bird-silhouettes.ts), keyed by `SilhouetteId`. Each bird supplies a 3-color `palette` (body, accent, belly).

### Types

- [src/types/bird.ts](src/types/bird.ts) — `BirdSpecies`, `ConservationStatus`, `SilhouetteId`
- [src/types/game.ts](src/types/game.ts) — `GameScreen`, `PhaseId`, `FlightPattern`, `FlyingBird`, `CatchEffectData`, `RevealBird`

## Conventions

- Path style: relative imports throughout (no path aliases configured).
- Styling: Tailwind v4 is installed via `@tailwindcss/vite` but largely unused — components use inline styles + global classes (`.panel`, `.btn-primary`, `.btn-ghost`, `.btn-outline`, `.chip`, `.label`) defined in [src/index.css](src/index.css). Design tokens are plain CSS custom properties on `:root` (`--paper`, `--ink`, `--ember`, …).
- React 19 + strict TS. The `react-hooks/purity` rule flags `Math.random()` inside `useMemo`/render — use `useState(() => …)` for one-shot random layout data (see `CloudLayer` in [Sky.tsx](src/components/game/Sky.tsx)).
- `tsc -b` runs before `vite build`, so type errors block builds.
- Bird data is treated as immutable; mutations to game state go through store actions, never direct writes (except the deliberate `birdsRef` pattern in the game loop).

# Birds at Golden Hour

A standalone single-page arcade game: cast a net across an Australian sky and catch native birds as the light shifts from dawn to night. Real photographs, real species, real conservation data.

**Play it:** [abcde090.github.io/bird-catcher](https://abcde090.github.io/bird-catcher/)

![Screenshot placeholder — add one to this README if you'd like](https://placehold.co/1200x600/fdf6e8/2a1a0a?text=Birds+at+Golden+Hour)

---

## What it is

- **90-second arcade rounds** — four phases (dawn → noon → dusk → night), each unlocking rarer species as the sky deepens
- **Pointer-aimed net** — click the sky to cast a parabolic arc; a catch circle opens briefly at the target. Aim, time, lead. Miss cap is 6 empty casts
- **119 Australian species**, ranked from Common (Galah, Magpie) to Legendary (Night Parrot, Regent Honeyeater). Rarer birds fly faster, dodge, flinch, or pause briefly mid-flight — Legendaries can only be caught during that pause window
- **Field Journal** — a per-species catalogue. Caught entries open into a detail panel with real photos, Wikipedia-sourced distribution maps, population estimates, habitats, diet, and a fun fact

No backend. Everything runs in the browser. Progress (high score + discovered species) persists in `localStorage` per device.

---

## Quick start

```bash
git clone https://github.com/abcde090/bird-catcher.git
cd bird-catcher
npm install
npm run dev            # http://localhost:5173
```

Other scripts:

```bash
npm run build          # tsc -b && vite build
npm run lint           # ESLint
npm run preview        # serve the production build locally
```

There is no test runner configured.

---

## Architecture at a glance

- **React 19 + TypeScript (strict) + Vite + Zustand.** No router — screen flow (`title → playing → results → guide`) is a single Zustand field.
- **Single RAF game loop** in [`src/hooks/useGameLoop.ts`](src/hooks/useGameLoop.ts). Active birds live in a `useRef` array to keep per-frame mutation off React's render path; the store mirrors once per tick for UI.
- **Styling** is inline `style` props + a small set of global classes (`.panel`, `.btn-*`, `.chip`, `.label`) from [`src/index.css`](src/index.css). Tailwind v4 is installed but essentially idle — see [`.claude/rules/styling.md`](.claude/rules/styling.md). Type is Fraunces + JetBrains Mono.
- **Bird data** is a static JSON file at [`public/data/birds.json`](public/data/birds.json), generated from [`scripts/build-birds.py`](scripts/build-birds.py) (species metadata, regions) and [`scripts/fetch-range-maps.py`](scripts/fetch-range-maps.py) (distribution map images).

Deeper reading:

- [`docs/GAME_RULES.md`](docs/GAME_RULES.md) — canonical gameplay reference (phase timing, rarity tiers, scoring, combo, net state machine, tier reactions, persistence keys)
- [`docs/superpowers/specs/2026-04-21-net-mechanic-design.md`](docs/superpowers/specs/2026-04-21-net-mechanic-design.md) — design spec for the net mechanic
- [`CLAUDE.md`](CLAUDE.md) — architecture notes for agents working on the repo

---

## Regenerating the dataset

Adding or editing species: edit the `BIRDS` list in [`scripts/build-birds.py`](scripts/build-birds.py) (and optionally the hand-curated `REGIONS` dict in the same file), then:

```bash
python3 scripts/build-birds.py              # fetches photos from Wikipedia, resizes via sips
python3 scripts/fetch-range-maps.py         # fetches distribution maps, rasterizes SVGs via rsvg-convert
```

Both are idempotent — existing files are skipped. `build-birds.py` preserves `rangeMapUrl` across rebuilds so the two scripts compose cleanly.

macOS tools used: `sips` (bundled) and `rsvg-convert` (`brew install librsvg`).

---

## Deployment

Pushes to `main` automatically build and publish to GitHub Pages via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The app is served under the repo subpath (`/bird-catcher/`) — runtime asset URLs go through the small [`src/lib/asset.ts`](src/lib/asset.ts) helper so `import.meta.env.BASE_URL` is respected everywhere.

To deploy under a different path (root of a custom domain, a Vercel preview, etc.):

```bash
VITE_BASE=/ npm run build
```

---

## Data credits

- Photographs: Wikimedia Commons and [birdsinbackyards.net](https://www.birdsinbackyards.net/). Individual file credits live on each source page.
- Distribution maps: Wikipedia species articles (Taxobox `range_map` field and article images).
- Fallback Australia silhouette: [`File:Australia_states_blank.svg`](https://commons.wikimedia.org/wiki/File:Australia_states_blank.svg) (public domain).
- Conservation status per species follows IUCN / EPBC Act references via Wikipedia at time of data generation.

All data is publicly available; this project doesn't relicense anything — it wraps existing free-culture material in a small game loop. If you're a rightsholder and want something removed or credited differently, open an issue.

---

## Origins

The visual design is a port of a claude.ai/design handoff bundle (preserved for historical reference under [`birds-catcher-handoff/`](birds-catcher-handoff/)). The live game has since diverged substantially — cast-and-reel replaced click-to-catch, per-tier reactive bird behaviors, the field-journal detail system, and real-map distribution data are all additions past the handoff.

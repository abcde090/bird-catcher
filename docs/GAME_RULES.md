# Birds at Golden Hour — Game Rules

Canonical reference for gameplay mechanics. Numbers below are authoritative in this doc but mirror constants in [src/lib/game-config.ts](../src/lib/game-config.ts). If you're changing balance, update the source file and this document in the same PR.

---

## Session structure

```
title → playing → results → (title | playing)
              ↘ guide (from title or results)
```

- Single source of truth for screen is `useGameStore.screen` ([src/stores/useGameStore.ts](../src/stores/useGameStore.ts)). There's no router.
- A round is 90 seconds. No lives-across-rounds — each round starts fresh.
- New-species catches raise a **toast** (`CardReveal`) without pausing the loop. Rounds never pause.

---

## Round timing

`ROUND_DURATION = 90` seconds, counting **down** from 90 → 0. The round is split into four phases by `getPhase(t)`:

| Phase | Window (`t`) | Duration | Spawn interval |
|---|---|---|---|
| Dawn | 90 → 67 | 23 s | 1.6 s |
| Noon | 67 → 45 | 22 s | 1.2 s |
| Dusk | 45 → 22 | 23 s | 0.9 s |
| Night | 22 → 0 | 22 s | 0.7 s |

`getPhase` matches `t <= p.start && t > p.end`. At `t = 90` you're in Dawn; at `t = 67` you flip to Noon; at `t = 0` you're in Night.

Spawn interval is the **minimum seconds between new birds**. Spawns also respect the active-bird cap (below). Later phases = more spawns.

---

## Phase gating

Each phase has an `allowed` list of conservation statuses. A bird of a rarer tier simply cannot spawn until you reach its phase:

| Phase | Allowed statuses |
|---|---|
| Dawn | least_concern |
| Noon | least_concern, near_threatened |
| Dusk | least_concern, near_threatened, vulnerable, endangered |
| Night | all five (adds critically_endangered) |

This means **Legendary (critically_endangered) birds only appear in the last 22 seconds** of the round. Epic (endangered) shows up in the last ~45 seconds. A full run with every tier represented requires surviving into Night.

---

## Spawning

Defined in [src/lib/spawner.ts](../src/lib/spawner.ts) and driven by `useGameLoop`.

Per tick:
1. If `now - lastSpawnRef >= phase.spawn` **and** `birdsRef.current.length < getMaxActive()`, attempt a spawn.
2. **Pick a tier** (`ConservationStatus`) using weighted-random over `TIER_SPAWN_WEIGHT`, restricted to the phase's `allowed` list.
3. **Pick a species** uniformly within that tier — decouples spawn probability from roster count.
4. Roll a flight pattern — 55% `straight`, 30% `arc`, 10% `dive`, 5% `zigzag`.
5. Roll a direction (left ↔ right, 50/50), a base `y` clamped to the catchable band (above the character's reach — `originY - birdSize - 30`), and a speed of `(120 + random·50) × RARITY[status].speed` px/s.

Tier spawn weights (from [src/lib/game-config.ts](../src/lib/game-config.ts), re-normalized per phase):

| Tier | Weight |
|---|---|
| Common (`least_concern`) | 60 |
| Uncommon (`near_threatened`) | 26 |
| Rare (`vulnerable`) | 11 |
| Epic (`endangered`) | 5 |
| Legendary (`critically_endangered`) | 3 |

Constants:
- `getMaxActive()` — active-bird cap scaled by viewport area (3 on phone, 5 on tablet, 6 on desktop)
- No exclusion of already-caught species — duplicates can (and do) appear in the same round
- Birds never spawn below `viewport.height - NET_CHARACTER_Y_OFFSET - poleOffset - birdSize - 30` — keeps every bird within the net's cast arc

---

## Rarity tiers

Five tiers, mapped directly from IUCN/EPBC conservation status. Each tier defines four independent gameplay multipliers plus a game-display label:

| Tier | Status | Points | Tier spawn weight | Size × | Speed × |
|---|---|---|---|---|---|
| Common | least_concern | 50 | 60 | 1.10 | 0.85 |
| Uncommon | near_threatened | 100 | 26 | 1.00 | 1.00 |
| Rare | vulnerable | 150 | 11 | 0.95 | 1.20 |
| Epic | endangered | 250 | 5 | 0.90 | 1.40 |
| Legendary | critically_endangered | 400 | 3 | 0.85 | 1.60 |

Meaning of each column:

- **Points** — base score on a successful catch, before combo multiplier and before the first-discovery bonus.
- **Tier spawn weight** — probability of the tier being chosen before species selection. Applied via `TIER_SPAWN_WEIGHT` after filtering to the phase's eligible tiers. Unlike the old per-species weight, this is independent of roster count — adding more Legendary species doesn't change how often Legendaries appear.
- **Size ×** — multiplier on the viewport-relative bird diameter. Legendary renders at 85% of the base size, so ~15% smaller click target than Common's 110%.
- **Speed ×** — multiplier on base ground-speed. Legendary birds cross the screen in roughly half the time Common birds do.

Rarer birds also show a pulsing `bird-glow` halo (anything that isn't Common) and a rarity-colored circular border via `RARITY[status].ring`.

---

## Catching

A bird is caught when the player's cast net opens and its catch circle overlaps the bird's hitbox. The net is triggered by clicking anywhere in the sky (not the bird directly).

### Net mechanic

A naturalist character is fixed at bottom-center. Clicking the sky casts a net along a parabolic arc to the clicked point. The net has four sequential states:

| State | Duration |
|---|---|
| Casting out | 0.5 s |
| Open (catch window) | 0.8 s |
| Retracting | 0.4 s |
| Cooldown | 0.3 s |

Total cycle: ~2 s. The catch circle is 60 px radius. Multi-catch is allowed — any bird whose center is inside the circle during any frame of the 0.8 s open window is caught.

### Tier reactions

When the net's open circle appears within 120 px of a bird, per-tier reactions trigger:

- Common (`least_concern`) — no reaction.
- Uncommon (`near_threatened`) — 0.15 s random lateral twitch (up to ±18 px).
- Rare (`vulnerable`) — flinch + 1.4× speed burst for 0.4 s.
- Epic (`endangered`) — banks away from net center at 180 px/s for 0.5 s with linear decay.
- Legendary (`critically_endangered`) — does NOT flinch/dodge/burst. Instead, pauses mid-flight for 0.7 s at a random 30%–70% point of its path. Catchable ONLY during this pause. After the pause, resumes normal flight (with pause duration discounted from progress).

**Score awarded** (per catch):

```
basePoints = RARITY[status].points + (firstDiscovery ? 50 : 0)
gained     = round(basePoints × comboMultiplier)
```

- `firstDiscovery` is true the first time a given species is caught across **all sessions** (persisted as `bc_discovered` in localStorage).
- `comboMultiplier` comes from `getComboMult(comboCount)`:

| Combo streak | Multiplier |
|---|---|
| 1 | 1× |
| 2 | 1.5× |
| 3–4 | 2× |
| 5–7 | 3× |
| 8+ | 4× |

**Combo resets** when 2.5 seconds elapse since the last catch. Empty casts increment the miss counter but do not reset combo — that's an intentional softening to pair with the tighter miss cap.

**New-species toast** — if `firstDiscovery` is true, `gameStore.revealBird` is set to trigger the CardReveal toast. The toast auto-dismisses after 3.2 s or on click. The game loop does not pause.

---

## Ending the round

The round ends when either condition is met first:

- `timeRemaining <= 0` — time ran out
- `misses >= MAX_MISSES` where `MAX_MISSES = 6`. A miss is now triggered by an *empty cast* — a cast whose open window catches zero birds. Birds flying off-screen no longer count against the player.

On game-over:
- High score updates in localStorage (`bc_high`) if beaten
- `screen` flips to `results`
- `activeBirds` and `birdsRef.current` are emptied

No mid-round fail states other than the miss cap — you cannot lose by scoring low.

---

## Persistence

Stored in localStorage only. No server.

| Key | Value | Managed by |
|---|---|---|
| `bc_high` | Integer — best single-round score | `useCollectionStore.setHighScore` |
| `bc_discovered` | JSON array of species IDs ever caught | `useCollectionStore.discoverBird` |

Discoveries survive across rounds and sessions. Clearing either key resets that axis.

---

## Field Journal

The journal (from title or results screen) shows all 119 species, always visible but gated by catch state:

- **Caught entries** — photo, name, scientific, rarity badge, fun fact. Clickable: opens `BirdDetailModal` with larger photo, category, distribution map (`RangeMap` — real Wikipedia-sourced map where available, stylized `AustraliaMap` fallback otherwise), population, size, habitats, diet, and the full fun fact.
- **Uncaught entries** — photo grayscaled + dimmed with a padlock overlay; name shown in italic muted; rarity label muted; text "Not yet catalogued" in place of scientific/fact. Not clickable.

Filter chips at the top toggle between All / Common / Uncommon / Rare / Epic / Legendary.

Each `BirdSpecies` carries a `regions: AustralianStateId[]` field (subset of `nsw | vic | qld | wa | sa | tas | nt | act`). Ranges are hand-curated per-species in [scripts/build-birds.py](../scripts/build-birds.py) under the `REGIONS` dict. Many species also carry a `rangeMapUrl` pointing to a Wikipedia-sourced distribution image under [public/birds/maps/](../public/birds/maps/) — fetched and rasterized by [scripts/fetch-range-maps.py](../scripts/fetch-range-maps.py).

---

## Worked example — what does a round look like?

Tier-first spawning (see `TIER_SPAWN_WEIGHT`) gives tier shares that depend only on the eligible tiers of each phase — roster size doesn't skew the picks.

Share by tier in each phase (weights re-normalized over eligible tiers):

| Tier | Dawn (only least_concern) | Noon (+ near_threatened) | Dusk (+ vulnerable, endangered) | Night (all five) |
|---|---|---|---|---|
| Common | 100 % | 69.8 % | 58.8 % | 57.1 % |
| Uncommon | — | 30.2 % | 25.5 % | 24.8 % |
| Rare | — | — | 10.8 % | 10.5 % |
| Epic | — | — | 4.9 % | 4.8 % |
| Legendary | — | — | — | 2.9 % |

### Expected catches per 90-second round

Spawn attempts per phase: Dawn ≈ 14, Noon ≈ 18, Dusk ≈ 26, Night ≈ 31 (subject to the `getMaxActive()` cap — roughly 3 on phone, 5 on tablet, 6 on desktop).

Summed across all four phases ⇒ about 89 spawns per round, split:

| Tier | Per round | Per 100 birds |
|---|---|---|
| Common | ~60 | 67 |
| Uncommon | ~20 | 22 |
| Rare | ~6 | 7 |
| Epic | ~3 | 3 |
| Legendary | ~1 (roughly one every round or two) | 1 |

Legendary is still genuinely rare — you won't see one in every Night phase, but you're not waiting 8 rounds for one either. A Legendary catch pays `(400 + 50) × up to 4` = up to **1,800** points.

---

## Where to edit

| What to change | File |
|---|---|
| Phase windows, spawn intervals, sky colors | `PHASES` in [src/lib/game-config.ts](../src/lib/game-config.ts) |
| Points / weight / size / speed per tier | `RARITY` in [src/lib/game-config.ts](../src/lib/game-config.ts) |
| Combo multiplier curve | `getComboMult` in [src/lib/game-config.ts](../src/lib/game-config.ts) |
| Round length, miss cap, active-bird cap | `ROUND_DURATION`, `MAX_MISSES`, `MAX_ACTIVE` in [src/lib/game-config.ts](../src/lib/game-config.ts) |
| Combo reset window (2.5 s) | Hard-coded in [src/hooks/useGameLoop.ts](../src/hooks/useGameLoop.ts) — `Date.now() - state.lastCatchTime > 2500` |
| First-discovery bonus (+50) | Hard-coded in [src/hooks/useGameLoop.ts](../src/hooks/useGameLoop.ts) — `catchBird` |
| Flight-pattern distribution (55/30/10/5) | `spawnBird` in [src/lib/spawner.ts](../src/lib/spawner.ts) |
| Card-reveal toast duration (3.2 s) | `CardReveal` effect in [src/components/game/CardReveal.tsx](../src/components/game/CardReveal.tsx) |
| Species roster | Append a tuple in `BIRDS` in [scripts/build-birds.py](../scripts/build-birds.py), then `python3 scripts/build-birds.py` |
| Net state-machine timings, geometry, reaction tuning | `NET_*`, `FLINCH_*`, `RARE_SPEED_BURST_*`, `EPIC_DODGE_*`, `LEGENDARY_BITE_*` in [src/lib/game-config.ts](../src/lib/game-config.ts) |
| Net cast trajectory (arc shape) | `arcPoint` helper in [src/components/game/Net.tsx](../src/components/game/Net.tsx) and symmetric math in [src/components/game/AimArc.tsx](../src/components/game/AimArc.tsx) |
| Per-tier reactions | Trigger block (casting → open transition) and per-bird map in [src/hooks/useGameLoop.ts](../src/hooks/useGameLoop.ts) |

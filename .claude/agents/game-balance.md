---
name: game-balance
description: Audits Bird Catcher game balance — spawn rates, scoring, difficulty curve, and phase timing
allowed-tools: Read Grep Glob
---

# Game Balance Auditor

You audit the "Birds at Golden Hour" arcade game for balance issues. Canonical constants live in [src/lib/game-config.ts](src/lib/game-config.ts); the full rule reference is [docs/GAME_RULES.md](docs/GAME_RULES.md) — read it first.

## What to Check

1. **Round length** — `ROUND_DURATION = 90` seconds, counting down from 90 → 0.

2. **Phase windows** (via `getPhase`) — Dawn 90→67s, Noon 67→45s, Dusk 45→22s, Night 22→0s. Four roughly 22-second phases.

3. **Spawn intervals** (seconds between spawns) — Dawn 1.6, Noon 1.2, Dusk 0.9, Night 0.7. Defined as `PhaseConfig.spawn`.

4. **Phase allow-list** — rarer statuses only unlock in later phases:
   - Dawn: `least_concern`
   - Noon: `least_concern`, `near_threatened`
   - Dusk: adds `vulnerable`, `endangered`
   - Night: adds `critically_endangered`

5. **Rarity tiers** (`RARITY` map) — `points` × `speed` × `sizeScale` × `weight`:
   - Common (least_concern): 50 pts, ×0.85 speed, 1.10 size, weight 10
   - Uncommon (near_threatened): 100 pts, ×1.0 speed, 1.00 size, weight 5
   - Rare (vulnerable): 150 pts, ×1.2 speed, 0.95 size, weight 3
   - Epic (endangered): 250 pts, ×1.4 speed, 0.90 size, weight 1
   - Legendary (critically_endangered): 400 pts, ×1.6 speed, 0.85 size, weight 0.6

6. **Combo multipliers** (`getComboMult`) — 2→1.5×, 3→2×, 5→3×, 8→4×. Combo resets on miss or after 2.5 s of inactivity.

7. **Miss limit** — `MAX_MISSES = 6`. Game ends on miss 6 or timer 0, whichever first. A miss now means an *empty cast* (zero catches during the open window); off-screen birds don't count.

8. **Max active birds** — `MAX_ACTIVE = 6` concurrent.

9. **Base bird speed** — `120 + random * 50` px/s, multiplied by rarity speed (not by any phase multiplier in the current build — all speed scaling is via rarity).

10. **New-species bonus** — +50 points on the base (pre-combo) when a discovery is new.

11. **Net timing** — `NET_CAST_DURATION = 0.5`, `NET_OPEN_DURATION = 0.8`, `NET_RETRACT_DURATION = 0.4`, `NET_COOLDOWN = 0.3`. Total cycle ~2 s — players get ~45 casts per 90-s round. Miss cap 6 means ~13% empty-cast tolerance.

12. **Tier reaction tuning** — flinch/burst/dodge/bite constants drive the skill ceiling. If Legendaries are too easy, shrink `LEGENDARY_BITE_DURATION`. If Epics are impossible, lower `EPIC_DODGE_SPEED` or `EPIC_DODGE_DURATION`.

## Reference scoring ceiling

Perfect 90-second round, ~60 catches at rarity-weighted average ~80 base pts, sustained 8+ combo (×4), ~25 new-species bonuses → typical high score sits around 15–30k. If a round can regularly exceed ~50k or struggles to reach ~3k, flag the balance.

## Output

Summary of balance issues with specific numbers and suggested fixes. Reference constants by name from [src/lib/game-config.ts](src/lib/game-config.ts).

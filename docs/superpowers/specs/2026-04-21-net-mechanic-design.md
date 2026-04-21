# Net Mechanic — Design Spec

**Date:** 2026-04-21
**Status:** Design approved, pending implementation plan

## Problem

The current catch interaction ("click the flying bird") is a reflex test, not a game. Two specific complaints from the player:

- **A.** Clicking moving targets gets old quickly; no skill ceiling beyond raw reaction speed.
- **B.** Which bird you catch doesn't matter mechanically — a Legendary feels identical to a Common bird, just worth more points.

The 119-species roster, conservation-status data, and rarity tiers are not doing any gameplay work.

## Goal

Replace click-to-catch with a **cast-and-reel net mechanic** that (a) introduces genuine aim and timing skills and (b) makes different rarity tiers play mechanically differently.

## Non-goals

- Character movement, net skins, power-meter variants (Approach 2/3 from brainstorm) — deferred to later specs
- Audio, haptics, or new music
- Achievements, daily challenges, leaderboards
- Mobile-first redesign (mechanic must work on touch, but we're not reshaping for it)

---

## Core interaction

A naturalist character is fixed at the bottom-center of the play area, just above the terrain silhouette. A pointer-aimed net is cast upward into the bird sky, opens briefly as a catch zone, then retracts.

### Cast state machine

| State | Duration | Behavior |
|---|---|---|
| **Idle** | — | Dotted parabolic arc renders from character's hand to cursor. Click to cast. |
| **Casting out** | 0.5 s | Closed-net shape travels along the committed arc. No catches possible. |
| **Open** | **0.8 s** | Net blooms into a 60-px-radius circle at the arc endpoint. Any bird whose center is inside the circle during any frame in this window is caught. Multi-catch allowed. |
| **Retracting** | 0.4 s | Net closes and flies straight back to the character. |
| **Cooldown** | 0.3 s | Brief lockout before next cast. |

Total cycle ceiling: 2.0 s. The arc is committed at click — post-click cursor movement doesn't steer the net.

### Loss condition

"Miss" becomes **empty cast** — every cast that catches nothing increments `misses`. The off-screen-bird-escape = miss rule is removed.

`MAX_MISSES = 6`. This is tighter than the current 10 because each cast is a deliberate decision and empty casts should feel painful.

The existing `MissFlash` visual and HUD dots behavior stay the same, just triggered by the new condition.

### Aim preview

A faint dotted quadratic-bezier path from the character's hand (fixed origin) to the current cursor position. Hidden when:

- `netPhase !== "idle"` (already casting)
- Cursor is below the character's hand y (would require a negative arc)

### Catch flow

Each caught bird flows through the existing `catchBird(id, clickX, clickY)` pipeline in [src/hooks/useGameLoop.ts](../../../src/hooks/useGameLoop.ts). No change to score, combo, new-species discovery, or CardReveal toast.

For multi-catch, `catchBird` is called once per bird, in sequence, all within the same tick. The combo counter increments per bird via the existing `incrementCombo()` path — so the second bird in a cast scores at a higher combo multiplier than the first. This is intentional: rewards aiming at bird clusters.

---

## Implementation shape

### Files that change

| File | Change |
|---|---|
| [src/lib/game-config.ts](../../../src/lib/game-config.ts) | Add `NET_*` timing/size constants. Drop `MAX_MISSES` from 10 to 6. |
| [src/stores/useGameStore.ts](../../../src/stores/useGameStore.ts) | Add net state fields and cursor position. See schema below. |
| [src/hooks/useGameLoop.ts](../../../src/hooks/useGameLoop.ts) | Delete the off-screen-miss branch. Add net-state-machine tick and collision detection. Per-cast "did we catch anything" accounting. |
| [src/components/game/FlyingBird.tsx](../../../src/components/game/FlyingBird.tsx) | Remove the `onClick` on the bird wrapper div. Birds become purely cosmetic + collision targets. |
| [src/components/game/GameScreen.tsx](../../../src/components/game/GameScreen.tsx) | Add `onMouseMove` (updates cursor position) and `onClick` (calls `castNet(x,y)`). Mount the three new components below the HUD layer. |
| [src/types/game.ts](../../../src/types/game.ts) | Add `NetPhase` type + net state shape. |

### New components (all in `src/components/game/`)

- **`NetCharacter.tsx`** — fixed inline SVG (hand + pole + hanging net). One-time render at bottom-center. z-index 11 (above terrain, below birds).
- **`AimArc.tsx`** — renders an SVG `<path>` as a dotted quadratic bezier from character's hand origin to current cursor position. Subscribes to cursor from Zustand, throttled to RAF. Hidden when `netPhase !== "idle"`. z:12.
- **`Net.tsx`** — renders the moving net. During `casting`/`retracting`: small closed shape at the interpolated point on the arc. During `open`: expanding circle at the arc endpoint with rarity-tinted glow if a bird is inside. z:25 (in front of birds during catch window).

### State shape (in `useGameStore`)

```ts
type NetPhase = "idle" | "casting" | "open" | "retracting" | "cooldown";

interface NetState {
  phase: NetPhase;
  startTime: number;       // performance.now() when cast began (0 if idle)
  startX: number;          // character's hand origin (constant for v1)
  startY: number;
  targetX: number;         // committed cast target
  targetY: number;
  catchesThisCast: number; // zero on transition to "open"; incremented on each catch
}

interface CursorState {
  x: number;
  y: number;
}
```

Both live directly on `useGameStore` (not in a ref), because they update ~5 times per cast — cheap. Birds continue to live in `birdsRef.current` in the game loop; no change there.

### Per-tick loop logic (simplified pseudo)

```
const { phase, startTime, targetX, targetY } = gameStore.getState().net;

if (phase !== "idle") {
  const elapsed = now - startTime;

  // Phase transitions
  if (phase === "casting" && elapsed >= CAST_DURATION) {
    transition to "open"; reset catchesThisCast = 0
  }
  if (phase === "open" && elapsed >= CAST_DURATION + OPEN_DURATION) {
    // End of open window — decide if this cast missed
    if (catchesThisCast === 0) { misses++; trigger missFlash; }
    transition to "retracting"
  }
  if (phase === "retracting" && elapsed >= CAST + OPEN + RETRACT) {
    transition to "cooldown"
  }
  if (phase === "cooldown" && elapsed >= CAST + OPEN + RETRACT + COOLDOWN) {
    transition to "idle"
  }

  // Collision detection during the open window
  if (phase === "open") {
    for (bird of birdsRef.current) {
      if (dist(bird.x, bird.y, targetX, targetY) < NET_RADIUS + birdHitboxR) {
        catchBird(bird.id, targetX, targetY);
        catchesThisCast++;
      }
    }
  }
}
```

---

## Bird differentiation (tier behavior)

This is the gameplay half of the fix. Each rarity tier plays mechanically differently when the net is active nearby.

| Tier | Behavior |
|---|---|
| **Common** | No reaction. Flies normal path. |
| **Uncommon** | **Flinch**: a 0.15 s random lateral twitch when the net's *open circle* appears within 120 px of the bird. |
| **Rare** | Flinch + **speed burst**: for 0.4 s after the net opens nearby, the bird moves at ×1.4 its normal speed. |
| **Epic** | **Predictive dodge**: when the net opens within 120 px, the bird banks away from the net's center at ~180 px/s for 0.5 s. Forces the player to lead the cast into empty space. |
| **Legendary** | **Bite window**: flies its path normally but pauses mid-air for 0.7 s at a random point 30–70% along the path. The net can *only* catch a Legendary during this pause. Halo intensifies during the bite window as the tell. Miss the window → bird continues, never pauses again this round. |

Trigger condition for Uncommon/Rare/Epic reactions: measured at the moment the net phase transitions `casting → open`. The bird's position relative to the net's `targetX/targetY` is what drives the flinch/dodge — the bird doesn't react during the casting travel time.

Bird state additions (in `FlyingBird` type or as per-bird transient fields):
- `flinchUntil`: number (timestamp — while `now < flinchUntil`, apply lateral twitch)
- `speedBurstUntil`: number (while active, multiply speed by 1.4)
- `dodgeUntil`, `dodgeDx`, `dodgeDy`: directional bank offset with expiry
- `biteStart`, `biteEnd`: set at spawn for Legendary birds; during `[biteStart, biteEnd]` the bird is pause-state
- `biteUsed`: if the net opens near a Legendary outside its bite window, no bite happens — bird continues normally

### Catchability rules under the net

During the `open` phase:

```
for bird of birdsRef.current:
  if bird is Legendary AND now not in [biteStart, biteEnd]: skip
  if dist(bird, netTarget) < NET_RADIUS + hitbox: catchBird(bird)
```

Non-Legendary birds can always be caught if they're inside the circle — dodge/flinch makes it *harder*, not impossible.

Legendary birds can *only* be caught during the bite pause window. Outside that window, Legendaries do **not** flinch, dodge, or burst — they fly their normal path unmoved by nearby nets. The only reaction they have is the pause itself.

---

## Tuning defaults

```
NET_CAST_DURATION         = 0.5 s
NET_OPEN_DURATION         = 0.8 s
NET_RETRACT_DURATION      = 0.4 s
NET_COOLDOWN              = 0.3 s
NET_RADIUS                = 60 px
NET_CHARACTER_Y_OFFSET    = 80 px from bottom of screen
MAX_MISSES                = 6
FLINCH_TRIGGER_DIST       = 120 px
FLINCH_DURATION           = 0.15 s
FLINCH_MAX_OFFSET         = 18 px
RARE_SPEED_BURST_MULT     = 1.4
RARE_SPEED_BURST_DURATION = 0.4 s
EPIC_DODGE_SPEED          = 180 px/s
EPIC_DODGE_DURATION       = 0.5 s
LEGENDARY_BITE_DURATION   = 0.7 s
LEGENDARY_BITE_WINDOW     = random point in [30%, 70%] of flight path
```

All numbers are playtest-tunable. Most of the "feel" tuning work will be in this table. Put them all in [src/lib/game-config.ts](../../../src/lib/game-config.ts).

---

## Documentation updates (part of this change)

- **[CLAUDE.md](../../../CLAUDE.md)** — rewrite the "Game loop" section (no more off-screen-miss; net state machine drives collision checks). Add the three new components to the component list. Update the Conventions note mentioning click-to-catch if any.
- **[.claude/rules/styling.md](../../../.claude/rules/styling.md)** — add the z-index stack explicitly: terrain (10), character (11), aim arc (12), birds (20), net (25), catch effects (30), HUD (50), flash (60), reveal toast (60). Note that the new net assets are inline SVG matching the handoff aesthetic.
- **[birds-catcher-handoff/README.md](../../../birds-catcher-handoff/README.md)** — add a one-line note at the top: "The live game has diverged from this handoff bundle; authoritative current state is in [CLAUDE.md](../CLAUDE.md)." Leave the rest of the file intact as a historical record.
- **[docs/GAME_RULES.md](../GAME_RULES.md)** — major update. Replace the "Catching" section with net-cast rules, update "Ending the round" with the new miss semantics, add a new "Tier behavior under the net" subsection, update "Where to edit" table with the new constants.
- **[.claude/agents/game-balance.md](../../../.claude/agents/game-balance.md)** — update the rarity/spawn summary to include net timing and tier behavior. Constants table gets the `NET_*` additions.

---

## Testing approach

This repo has no automated test runner. Validation is manual playtest against a fixed checklist. Acceptance criteria:

### Build & type
- `npm run build` passes (tsc clean, vite builds)
- `npm run lint` passes (including `react-hooks/purity`)

### Playtest scenarios

- [ ] Aim arc renders smoothly on mouse move; updates every frame; hides during cast
- [ ] Click casts the net; net travels along the arc; opens at endpoint; retracts; cooldown blocks re-cast
- [ ] Catching a common bird works exactly as before — score, combo, CardReveal all fire
- [ ] Multi-catch: cast at two close birds → both caught in one cast, combo increments twice
- [ ] Empty cast (nothing in the circle) → misses + 1, MissFlash visible
- [ ] After 6 empty casts, game ends (results screen shows)
- [ ] Uncommon flinches visibly when net opens nearby but within circle — still catchable
- [ ] Rare speed-bursts visibly on nearby net-open
- [ ] Epic banks away from net center — if aimed at current position, misses
- [ ] Legendary does NOT get caught outside its bite window, even inside the net circle
- [ ] Legendary's halo intensifies during the bite window; catchable only then
- [ ] Off-screen birds no longer count as misses — player can ignore them
- [ ] Existing phases / rarity spawn gating unchanged (night still unlocks Legendary)

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cooldown + MAX_MISSES=6 feels too punishing | MEDIUM | Tune numbers early. If still bad, relax to 8 or switch to no-miss-cap. |
| Legendary bite window is too hard — player never catches one | MEDIUM | 0.7 s is generous given the 0.8 s open window. Can extend to 1.0 s. Also: visibly telegraph the bite (halo pulse). |
| Arc preview flickers or feels laggy with throttling | LOW | Skip Zustand selector, update directly from mousemove via a ref and force re-render at RAF cadence. |
| Multi-catch combo interaction is overpowered (one cast → +5 combo) | MEDIUM | Probably fine — limits by how many birds fit in a 60 px circle. Playtest; if broken, cap combo +1 per cast. |
| Touch/mobile ergonomics (no hover) | LOW | Aim arc can follow *last touch* position. Deferred; v1 is mouse. |

---

## Open questions

None blocking. Numbers in the tuning table are my best first guesses; expect 3–4 playtest iterations.

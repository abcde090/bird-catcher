# Net Mechanic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace click-to-catch with a pointer-aimed cast-and-reel net mechanic and give each rarity tier a distinct reactive behavior (flinch, dodge, bite window).

**Architecture:** A fixed naturalist character at the bottom-center casts a net along a parabolic arc to the clicked point. The net opens as a 60-px radius circle for 0.8 s, catching any non-Legendary bird inside it. Legendaries are only catchable during a short, random "bite" pause window. The existing RAF game loop drives the net state machine; net state lives in Zustand, birds stay in the ref.

**Tech Stack:** React 19, TypeScript (strict), Zustand, Vite. No test runner — validation is `npm run build` + `npm run lint` + manual playtest in the dev server per task.

**Spec:** [docs/superpowers/specs/2026-04-21-net-mechanic-design.md](../specs/2026-04-21-net-mechanic-design.md)

---

## Execution notes

- Each task ends in a commit. Commit message is specified.
- Manual verification replaces `pytest`. Run `npm run dev` (localhost:5173) and follow the "Verify" steps.
- If a task fails build/lint, fix before committing — do not commit broken code.
- Type checker runs as part of `npm run build` (`tsc -b` then Vite). Use `npx tsc --noEmit` for fast iteration.

---

### Task 1: Constants, types, and store scaffolding

**Files:**
- Modify: [src/lib/game-config.ts](../../../src/lib/game-config.ts) — add net + reaction constants, lower `MAX_MISSES`
- Modify: [src/types/game.ts](../../../src/types/game.ts) — add `NetPhase` and extend `FlyingBird`
- Modify: [src/stores/useGameStore.ts](../../../src/stores/useGameStore.ts) — add net + cursor state and actions

- [ ] **Step 1.1 — Add constants to `game-config.ts`**

Append to the file (keep existing `ROUND_DURATION`, `MAX_ACTIVE`, `RARITY`, `PHASES`, `getPhase`, `getComboMult`, `weightedPick`):

```ts
// Change this existing constant:
export const MAX_MISSES = 6; // was 10; empty casts only

// Net cast state machine (seconds)
export const NET_CAST_DURATION = 0.5;
export const NET_OPEN_DURATION = 0.8;
export const NET_RETRACT_DURATION = 0.4;
export const NET_COOLDOWN = 0.3;

// Geometry
export const NET_RADIUS = 60; // px
export const NET_CHARACTER_Y_OFFSET = 80; // px from bottom of viewport

// Tier reaction tuning
export const FLINCH_TRIGGER_DIST = 120;
export const FLINCH_DURATION = 0.15;
export const FLINCH_MAX_OFFSET = 18;
export const RARE_SPEED_BURST_MULT = 1.4;
export const RARE_SPEED_BURST_DURATION = 0.4;
export const EPIC_DODGE_SPEED = 180; // px/s
export const EPIC_DODGE_DURATION = 0.5;
export const LEGENDARY_BITE_DURATION = 0.7;
// Bite window center falls within 30%..70% of bird's flight path
export const LEGENDARY_BITE_WINDOW_MIN = 0.3;
export const LEGENDARY_BITE_WINDOW_MAX = 0.7;
```

- [ ] **Step 1.2 — Extend `types/game.ts`**

Add:

```ts
export type NetPhase = "idle" | "casting" | "open" | "retracting" | "cooldown";
```

Extend `FlyingBird` interface by adding these optional reactive fields (all timestamps in seconds of `performance.now()/1000`):

```ts
export interface FlyingBird {
  // ... existing fields unchanged ...

  // Reactive state — all default to 0 (no effect)
  flinchUntil: number;
  flinchDx: number;       // lateral offset applied while flinchUntil > now
  speedBurstUntil: number;
  dodgeUntil: number;
  dodgeDx: number;        // per-second bank offset
  dodgeDy: number;

  // Legendary only — set at spawn, used once
  biteStart: number;      // 0 for non-Legendary
  biteEnd: number;
  biteTriggered: boolean; // true once the bird has entered its bite window
}
```

- [ ] **Step 1.3 — Extend `useGameStore`**

Add to the store interface:

```ts
interface NetState {
  phase: NetPhase;
  startTime: number;       // seconds since performance.now origin
  targetX: number;
  targetY: number;
  originX: number;         // character origin for this cast
  originY: number;
  catchesThisCast: number;
}

interface GameStore {
  // ... existing fields ...
  net: NetState;
  setNet: (net: Partial<NetState>) => void;
  cursorX: number;
  cursorY: number;
  setCursor: (x: number, y: number) => void;
}
```

Add to the initial state and to `startRound` reset:

```ts
net: { phase: "idle", startTime: 0, targetX: 0, targetY: 0, originX: 0, originY: 0, catchesThisCast: 0 },
cursorX: 0,
cursorY: 0,
```

Add actions:

```ts
setNet: (net) => set((s) => ({ net: { ...s.net, ...net } })),
setCursor: (cursorX, cursorY) => set({ cursorX, cursorY }),
```

In `startRound`, reset net and cursor along with the other fields.

- [ ] **Step 1.4 — Verify build**

Run: `npm run build`
Expected: PASS (no ts errors). If existing `FlyingBird` constructions in spawner break on the new fields, add them there in Task 9. For now, set all new fields to `0` / `false` in [src/lib/spawner.ts](../../../src/lib/spawner.ts) on bird creation:

```ts
flinchUntil: 0,
flinchDx: 0,
speedBurstUntil: 0,
dodgeUntil: 0,
dodgeDx: 0,
dodgeDy: 0,
biteStart: 0,
biteEnd: 0,
biteTriggered: false,
```

Re-run `npm run build`. Expected: PASS.

- [ ] **Step 1.5 — Commit**

```bash
git add src/lib/game-config.ts src/types/game.ts src/stores/useGameStore.ts src/lib/spawner.ts
git commit -m "feat(net): scaffold constants, types, and store state"
```

---

### Task 2: NetCharacter component (static SVG)

**Files:**
- Create: `src/components/game/NetCharacter.tsx`
- Modify: `src/components/game/GameScreen.tsx` — mount it

- [ ] **Step 2.1 — Create `NetCharacter.tsx`**

```tsx
import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";

export default function NetCharacter() {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: NET_CHARACTER_Y_OFFSET,
        transform: "translateX(-50%)",
        width: 80,
        height: 120,
        zIndex: 11,
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 80 120" width="80" height="120">
        {/* pole */}
        <line
          x1="40"
          y1="115"
          x2="40"
          y2="30"
          stroke="#3a2818"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* hand grip */}
        <rect x="35" y="95" width="10" height="18" rx="3" fill="#6a4a2a" />
        {/* net hoop */}
        <ellipse
          cx="40"
          cy="25"
          rx="14"
          ry="7"
          fill="none"
          stroke="#3a2818"
          strokeWidth="2.5"
        />
        {/* net mesh */}
        <path
          d="M 26 25 Q 40 42, 54 25"
          fill="rgba(253, 246, 232, 0.35)"
          stroke="#3a2818"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2.2 — Mount in GameScreen**

In [src/components/game/GameScreen.tsx](../../../src/components/game/GameScreen.tsx), import and render `<NetCharacter />` after `<Sky />` and before the birds layer:

```tsx
import NetCharacter from "./NetCharacter";
// ...
<Sky phase={phase} timeRemaining={time} />
<NetCharacter />
<div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
  {activeBirds.map(...)}
</div>
```

- [ ] **Step 2.3 — Verify**

Run: `npm run dev` and open localhost:5173, click Begin Round.
Expected: a small brown-pole-with-net figure at bottom-center, above the terrain silhouette, static.

- [ ] **Step 2.4 — Commit**

```bash
git add src/components/game/NetCharacter.tsx src/components/game/GameScreen.tsx
git commit -m "feat(net): add static NetCharacter at bottom-center"
```

---

### Task 3: Cursor tracking in GameScreen

**Files:**
- Modify: `src/components/game/GameScreen.tsx` — add `onMouseMove`

- [ ] **Step 3.1 — Wire cursor updates**

In [GameScreen.tsx](../../../src/components/game/GameScreen.tsx), add the mouse handler to the outer div:

```tsx
const setCursor = useGameStore((s) => s.setCursor);
// ... in render:
<div
  onMouseMove={(e) => setCursor(e.clientX, e.clientY)}
  style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: "crosshair" }}
>
```

- [ ] **Step 3.2 — Verify**

Run: `npm run dev`. Open React DevTools, find `useGameStore`. Move mouse across the screen.
Expected: `cursorX` and `cursorY` update in real time.

- [ ] **Step 3.3 — Commit**

```bash
git add src/components/game/GameScreen.tsx
git commit -m "feat(net): track cursor position in game store"
```

---

### Task 4: AimArc component

**Files:**
- Create: `src/components/game/AimArc.tsx`
- Modify: `src/components/game/GameScreen.tsx` — mount it

- [ ] **Step 4.1 — Create `AimArc.tsx`**

```tsx
import { useGameStore } from "../../stores/useGameStore";
import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";

export default function AimArc() {
  const cursorX = useGameStore((s) => s.cursorX);
  const cursorY = useGameStore((s) => s.cursorY);
  const netPhase = useGameStore((s) => s.net.phase);

  if (netPhase !== "idle") return null;

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight - NET_CHARACTER_Y_OFFSET - 90;

  // Hide if cursor is below or too close to the character
  if (cursorY >= originY - 10) return null;

  // Quadratic bezier control point: above the midpoint between origin and target
  const midX = (originX + cursorX) / 2;
  const height = Math.max(60, (originY - cursorY) * 0.55);
  const ctrlY = Math.min(originY, cursorY) - height;

  const path = `M ${originX} ${originY} Q ${midX} ${ctrlY}, ${cursorX} ${cursorY}`;

  return (
    <svg
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 12,
        pointerEvents: "none",
      }}
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(253, 246, 232, 0.55)"
        strokeWidth="2"
        strokeDasharray="4 6"
      />
      <circle cx={cursorX} cy={cursorY} r="6" fill="rgba(253, 246, 232, 0.35)" stroke="#fde8b8" strokeWidth="1" />
    </svg>
  );
}
```

- [ ] **Step 4.2 — Mount in GameScreen**

```tsx
import AimArc from "./AimArc";
// After NetCharacter, before birds:
<NetCharacter />
<AimArc />
```

- [ ] **Step 4.3 — Verify**

Run: `npm run dev`, start a round, move mouse around the sky area.
Expected: a dotted arc curves from the character up to the cursor; a small circle marks the cursor tip. Arc disappears when cursor is at or below the character.

- [ ] **Step 4.4 — Commit**

```bash
git add src/components/game/AimArc.tsx src/components/game/GameScreen.tsx
git commit -m "feat(net): add AimArc preview following cursor"
```

---

### Task 5: Cast handler + net state machine in game loop

**Files:**
- Modify: `src/components/game/GameScreen.tsx` — onClick triggers cast
- Modify: `src/hooks/useGameLoop.ts` — net state machine tick

- [ ] **Step 5.1 — Add cast handler to GameScreen**

At the outer div in [GameScreen.tsx](../../../src/components/game/GameScreen.tsx):

```tsx
const cursorX = useGameStore((s) => s.cursorX);
const cursorY = useGameStore((s) => s.cursorY);
const netPhase = useGameStore((s) => s.net.phase);
const setNet = useGameStore((s) => s.setNet);

const handleCast = (e: React.MouseEvent) => {
  if (netPhase !== "idle") return;
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight - 80 - 90; // NET_CHARACTER_Y_OFFSET - pole height
  if (e.clientY >= originY - 10) return; // invalid target
  setNet({
    phase: "casting",
    startTime: performance.now() / 1000,
    originX,
    originY,
    targetX: e.clientX,
    targetY: e.clientY,
    catchesThisCast: 0,
  });
};
// ...
<div onMouseMove={...} onClick={handleCast} ...>
```

- [ ] **Step 5.2 — Add net state machine to game loop**

In [useGameLoop.ts](../../../src/hooks/useGameLoop.ts), inside the `tick` function AFTER the existing bird-advance logic and BEFORE the game-over check, insert:

```ts
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
    const hadCatches = gameStore.getState().net.catchesThisCast > 0;
    if (!hadCatches) {
      const s = gameStore.getState();
      gameStore.setState({
        misses: s.misses + 1,
        missFlashKey: Date.now(),
      });
    }
    gameStore.setState({
      net: { ...gameStore.getState().net, phase: "retracting" },
    });
  } else if (net.phase === "retracting" && elapsed >= CAST + OPEN + RETRACT) {
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
```

(Import `now` comes from the existing `timestamp / 1000` in the tick. Reuse the existing `now` local.)

- [ ] **Step 5.3 — Verify**

Run: `npm run dev`, start round. Click somewhere in the sky. Watch the React DevTools `useGameStore.net.phase` cycle through casting → open → retracting → cooldown → idle over about 2 seconds.

- [ ] **Step 5.4 — Commit**

```bash
git add src/components/game/GameScreen.tsx src/hooks/useGameLoop.ts
git commit -m "feat(net): add cast handler and state machine transitions"
```

---

### Task 6: Net visual rendering

**Files:**
- Create: `src/components/game/Net.tsx`
- Modify: `src/components/game/GameScreen.tsx` — mount it

- [ ] **Step 6.1 — Create `Net.tsx`**

```tsx
import { useGameStore } from "../../stores/useGameStore";
import {
  NET_CAST_DURATION,
  NET_OPEN_DURATION,
  NET_RADIUS,
  NET_RETRACT_DURATION,
} from "../../lib/game-config";

function arcPoint(
  t: number,
  ox: number,
  oy: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  // Quadratic bezier with apex 55% of rise above the higher endpoint
  const midX = (ox + tx) / 2;
  const height = Math.max(60, (oy - ty) * 0.55);
  const ctrlY = Math.min(oy, ty) - height;
  const x = (1 - t) * (1 - t) * ox + 2 * (1 - t) * t * midX + t * t * tx;
  const y = (1 - t) * (1 - t) * oy + 2 * (1 - t) * t * ctrlY + t * t * ty;
  return { x, y };
}

export default function Net() {
  const net = useGameStore((s) => s.net);

  if (net.phase === "idle") return null;

  const elapsed = performance.now() / 1000 - net.startTime;

  let x = net.originX;
  let y = net.originY;
  let radius = 6;
  let showCircle = false;

  if (net.phase === "casting") {
    const t = Math.min(1, elapsed / NET_CAST_DURATION);
    ({ x, y } = arcPoint(t, net.originX, net.originY, net.targetX, net.targetY));
  } else if (net.phase === "open") {
    x = net.targetX;
    y = net.targetY;
    showCircle = true;
    // Expand radius quickly then hold
    const openElapsed = elapsed - NET_CAST_DURATION;
    const expand = Math.min(1, openElapsed / 0.12);
    radius = NET_RADIUS * expand;
    // Shrink at the very end
    const closing = Math.max(
      0,
      (NET_OPEN_DURATION - openElapsed) / NET_OPEN_DURATION,
    );
    if (openElapsed > NET_OPEN_DURATION - 0.12) radius *= closing + 0.3;
  } else if (net.phase === "retracting") {
    const retractElapsed = elapsed - NET_CAST_DURATION - NET_OPEN_DURATION;
    const t = 1 - Math.min(1, retractElapsed / NET_RETRACT_DURATION);
    ({ x, y } = arcPoint(t, net.originX, net.originY, net.targetX, net.targetY));
  } else {
    return null; // cooldown = no visual
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x - (showCircle ? radius : 8),
        top: y - (showCircle ? radius : 8),
        width: showCircle ? radius * 2 : 16,
        height: showCircle ? radius * 2 : 16,
        zIndex: 25,
        pointerEvents: "none",
        borderRadius: "50%",
        border: showCircle
          ? "3px solid rgba(253, 232, 184, 0.85)"
          : "2px solid rgba(58, 40, 24, 0.9)",
        background: showCircle
          ? "radial-gradient(circle, rgba(253,232,184,0.15) 0%, transparent 70%)"
          : "rgba(138, 94, 32, 0.4)",
        boxShadow: showCircle ? "0 0 24px rgba(253, 232, 184, 0.5)" : "none",
      }}
    />
  );
}
```

- [ ] **Step 6.2 — Mount in GameScreen**

```tsx
import Net from "./Net";
// After the birds layer, before CatchEffect:
<Net />
<CatchEffect />
```

- [ ] **Step 6.3 — Verify**

Run: `npm run dev`, start round. Click in the sky. You should see:
1. A small brown dot fly along an arc to the clicked point (casting)
2. A glowing circle expand at the target, hold, then close (open)
3. The dot retrace the arc back to the character (retracting)
4. Brief pause (cooldown)
5. Arc preview re-appears

- [ ] **Step 6.4 — Commit**

```bash
git add src/components/game/Net.tsx src/components/game/GameScreen.tsx
git commit -m "feat(net): render cast/open/retract visuals"
```

---

### Task 7: Remove click-to-catch and off-screen-miss

**Files:**
- Modify: `src/components/game/FlyingBird.tsx` — delete `onClick`
- Modify: `src/hooks/useGameLoop.ts` — stop counting off-screen-exits as misses

- [ ] **Step 7.1 — Strip onClick from FlyingBird**

In [FlyingBird.tsx](../../../src/components/game/FlyingBird.tsx), remove the `onClick` prop from the wrapper div and the `onCatch` prop from the component interface. Change `cursor: "crosshair"` to `"default"` (or just remove it — the parent sets the cursor). Component becomes purely presentational.

Also remove the `onCatch` prop from the `FlyingBirdProps` interface and from the usage in `GameScreen.tsx` where birds are mapped.

- [ ] **Step 7.2 — Remove off-screen-miss from the loop**

In [useGameLoop.ts](../../../src/hooks/useGameLoop.ts), find this block in the tick:

```ts
let missed = 0;
birdsRef.current = birdsRef.current
  .map(...)
  .filter((b) => {
    if (b.progress >= 1) {
      missed++;
      return false;
    }
    return true;
  });
```

Change to:

```ts
birdsRef.current = birdsRef.current
  .map(...)
  .filter((b) => b.progress < 1);
```

Then remove the following block that adds `missed` to `state.misses` and triggers `missFlashKey`. Also remove the combo-reset-on-miss line. Empty-cast misses (added in Task 5) now carry that role.

- [ ] **Step 7.3 — Verify**

Run: `npm run dev`, start round. Clicking on a flying bird should do nothing (the cast still fires, but the bird doesn't self-catch). Birds that fly off-screen silently vanish — the miss counter does NOT increment.

- [ ] **Step 7.4 — Commit**

```bash
git add src/components/game/FlyingBird.tsx src/components/game/GameScreen.tsx src/hooks/useGameLoop.ts
git commit -m "feat(net): remove click-to-catch and off-screen-miss"
```

---

### Task 8: Collision detection during open window

**Files:**
- Modify: `src/hooks/useGameLoop.ts` — iterate birds each tick during `open` phase

- [ ] **Step 8.1 — Add collision loop**

In [useGameLoop.ts](../../../src/hooks/useGameLoop.ts), inside the existing net state machine block from Task 5, replace the simple `casting → open` transition with:

```ts
if (net.phase === "casting" && elapsed >= CAST) {
  gameStore.setState({
    net: { ...net, phase: "open", catchesThisCast: 0 },
  });
}
```

Add a new branch — collision check during `open`:

```ts
if (net.phase === "open") {
  // Bird hitbox radius — use BirdImage size formula: 80 * sizeScale, half of that
  for (const bird of birdsRef.current) {
    const dx = bird.x - net.targetX;
    const dy = bird.y - net.targetY;
    const distSq = dx * dx + dy * dy;
    const hitR = 40 * RARITY[bird.species.status].sizeScale;
    const threshold = NET_RADIUS + hitR;
    if (distSq <= threshold * threshold) {
      // Skip if this bird already caught (shouldn't happen — catchBird removes it)
      catchBird(bird.id, net.targetX, net.targetY);
      gameStore.setState((s) => ({
        net: { ...s.net, catchesThisCast: s.net.catchesThisCast + 1 },
      }));
    }
  }
}
```

Import `NET_RADIUS` and `RARITY` at the top of the file.

Note: `catchBird` already removes the bird from `birdsRef.current` in-place in its implementation, so the loop won't double-catch.

- [ ] **Step 8.2 — Verify**

Run: `npm run dev`, start round. Wait for a bird to fly. Click directly on a bird during its flight.
Expected: the net fires at the click point; when the open window lands on the bird, it's caught with the usual score and CatchEffect animation.

Also try: click in empty sky, not near any bird.
Expected: the open window appears, closes, then `miss flash` fires; HUD miss dots increment.

- [ ] **Step 8.3 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): collision detection during open window"
```

---

### Task 9: Legendary bite-window initialization

**Files:**
- Modify: `src/lib/spawner.ts` — compute `biteStart`/`biteEnd` for Legendaries

- [ ] **Step 9.1 — Compute bite window at spawn**

In [spawner.ts](../../../src/lib/spawner.ts), inside `spawnBird`, after computing `speed` and before the return:

```ts
import {
  LEGENDARY_BITE_DURATION,
  LEGENDARY_BITE_WINDOW_MIN,
  LEGENDARY_BITE_WINDOW_MAX,
  RARITY,
  // ... existing imports
} from "./game-config";

// Inside spawnBird, after speed calculation:
const spawnTime = performance.now() / 1000;
let biteStart = 0;
let biteEnd = 0;

if (species.status === "critically_endangered") {
  const totalDx = Math.abs(endX - startX);
  const totalFlightSeconds = totalDx / speed;
  const centerFrac =
    LEGENDARY_BITE_WINDOW_MIN +
    Math.random() * (LEGENDARY_BITE_WINDOW_MAX - LEGENDARY_BITE_WINDOW_MIN);
  const centerT = spawnTime + centerFrac * totalFlightSeconds;
  biteStart = centerT - LEGENDARY_BITE_DURATION / 2;
  biteEnd = centerT + LEGENDARY_BITE_DURATION / 2;
}

return {
  // ... existing fields
  spawnTime,
  biteStart,
  biteEnd,
  biteTriggered: false,
  flinchUntil: 0,
  flinchDx: 0,
  speedBurstUntil: 0,
  dodgeUntil: 0,
  dodgeDx: 0,
  dodgeDy: 0,
};
```

- [ ] **Step 9.2 — Verify**

Run: `npm run build` — PASS.
Run: `npm run dev`, survive until Night phase (wait ~68 s), watch for a Legendary spawn. Set a debug breakpoint in DevTools or `console.log(bird.biteStart, bird.biteEnd)` temporarily to confirm the window is set.

- [ ] **Step 9.3 — Commit**

```bash
git add src/lib/spawner.ts
git commit -m "feat(net): initialize Legendary bite windows at spawn"
```

---

### Task 10: Legendary bite-pause behavior in the loop

**Files:**
- Modify: `src/hooks/useGameLoop.ts` — freeze Legendary position during bite window

- [ ] **Step 10.1 — Implement bite-pause**

In [useGameLoop.ts](../../../src/hooks/useGameLoop.ts), in the `birdsRef.current = birdsRef.current.map(...)` block, modify the position-advance logic:

```ts
birdsRef.current = birdsRef.current
  .map((b) => {
    // Legendary bite-pause: freeze position, don't advance progress
    if (
      b.species.status === "critically_endangered" &&
      now >= b.biteStart &&
      now <= b.biteEnd
    ) {
      return { ...b, biteTriggered: true };
    }

    const elapsed = now - b.spawnTime;
    const totalDx = Math.abs(b.endX - b.startX);
    const duration = totalDx / b.speed;
    const progress = Math.min(1, elapsed / duration);
    // ... rest of the existing map logic ...
  })
```

Important: also subtract `LEGENDARY_BITE_DURATION` from `elapsed` for progress calculation AFTER the bite window has passed, so the bird doesn't "lose" travel time during the pause. Replace the elapsed line with:

```ts
const isLegendary = b.species.status === "critically_endangered";
const pastBite = isLegendary && b.biteTriggered && now > b.biteEnd;
const effectiveElapsed = pastBite
  ? now - b.spawnTime - LEGENDARY_BITE_DURATION
  : now - b.spawnTime;
```

Use `effectiveElapsed` where the old `elapsed` was used.

- [ ] **Step 10.2 — Verify**

Run: `npm run dev`. In Night phase, spawn a Legendary. Watch it fly — it should visibly pause for ~0.7 s partway across, then resume.

- [ ] **Step 10.3 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): Legendary birds pause during bite window"
```

---

### Task 11: Legendary catchability gate

**Files:**
- Modify: `src/hooks/useGameLoop.ts` — skip Legendaries outside bite window in collision

- [ ] **Step 11.1 — Add the gate**

In the collision loop added in Task 8:

```ts
for (const bird of birdsRef.current) {
  // Legendary: only catchable during bite window
  if (bird.species.status === "critically_endangered") {
    if (now < bird.biteStart || now > bird.biteEnd) continue;
  }
  const dx = bird.x - net.targetX;
  // ... rest unchanged
}
```

- [ ] **Step 11.2 — Verify**

Run: `npm run dev`. In Night phase, cast at a flying Legendary BEFORE its pause — it should NOT be caught. Cast during the pause — it should be caught.

- [ ] **Step 11.3 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): gate Legendary catching to bite window only"
```

---

### Task 12: Uncommon flinch reaction

**Files:**
- Modify: `src/hooks/useGameLoop.ts` — on net→open, trigger flinch on nearby uncommons; apply lateral offset in tick

- [ ] **Step 12.1 — Trigger flinch on open**

In the net state machine, on the `casting → open` transition, iterate birds and set `flinchUntil` for eligible ones:

```ts
if (net.phase === "casting" && elapsed >= CAST) {
  // Trigger reactions when the open window arrives
  for (const b of birdsRef.current) {
    const dx = b.x - net.targetX;
    const dy = b.y - net.targetY;
    const distSq = dx * dx + dy * dy;
    const trigger = FLINCH_TRIGGER_DIST * FLINCH_TRIGGER_DIST;
    if (distSq > trigger) continue;

    const s = b.species.status;
    if (s === "near_threatened" || s === "vulnerable" || s === "endangered") {
      b.flinchUntil = now + FLINCH_DURATION;
      b.flinchDx = (Math.random() - 0.5) * 2 * FLINCH_MAX_OFFSET;
    }
    // Rare adds speed burst (Task 13), Epic adds dodge (Task 14)
  }
  gameStore.setState({
    net: { ...net, phase: "open", catchesThisCast: 0 },
  });
}
```

Import `FLINCH_TRIGGER_DIST`, `FLINCH_DURATION`, `FLINCH_MAX_OFFSET`.

- [ ] **Step 12.2 — Apply flinch offset in position update**

In the `.map((b) => ...)` block, after computing `baseX/y + bob`:

```ts
let fx = 0;
if (now < b.flinchUntil) {
  fx = b.flinchDx;
}
return { ...b, x: baseX + fx, y: y + bob, progress, wobble: ... };
```

- [ ] **Step 12.3 — Verify**

Run: `npm run dev`. In Noon+ phase, cast the net near an Uncommon bird (e.g. Brolga, Musk Duck — though many uncommons are cockatoos).
Expected: the bird visibly twitches sideways the moment the net opens, then settles.

- [ ] **Step 12.4 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): uncommon birds flinch when net opens nearby"
```

---

### Task 13: Rare speed-burst reaction

**Files:**
- Modify: `src/hooks/useGameLoop.ts`

- [ ] **Step 13.1 — Trigger speed burst**

In the same `casting → open` trigger block from Task 12, extend:

```ts
if (s === "vulnerable") {
  b.speedBurstUntil = now + RARE_SPEED_BURST_DURATION;
}
```

- [ ] **Step 13.2 — Apply in speed calculation**

Modify the `duration` calculation in the `.map` block:

```ts
const speedMult = now < b.speedBurstUntil ? RARE_SPEED_BURST_MULT : 1;
const effectiveSpeed = b.speed * speedMult;
const duration = totalDx / effectiveSpeed;
```

Use `effectiveSpeed` in place of `b.speed`.

- [ ] **Step 13.3 — Verify**

Run: `npm run dev`. In Dusk+ phase, cast near a Rare bird (Powerful Owl, Gang-gang Cockatoo, etc.).
Expected: the bird visibly accelerates for ~0.4 s after the net opens nearby.

- [ ] **Step 13.4 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): rare birds speed-burst when net opens nearby"
```

---

### Task 14: Epic predictive dodge

**Files:**
- Modify: `src/hooks/useGameLoop.ts`

- [ ] **Step 14.1 — Trigger dodge**

Extend the `casting → open` block:

```ts
if (s === "endangered") {
  // Dodge direction: away from the net center, normalized
  const len = Math.sqrt(distSq) || 1;
  b.dodgeDx = (b.x - net.targetX) / len * EPIC_DODGE_SPEED;
  b.dodgeDy = (b.y - net.targetY) / len * EPIC_DODGE_SPEED;
  b.dodgeUntil = now + EPIC_DODGE_DURATION;
}
```

- [ ] **Step 14.2 — Apply in position update**

In the `.map` block, after computing bob:

```ts
let ddx = 0, ddy = 0;
if (now < b.dodgeUntil) {
  // Integrate dodge velocity
  ddx = b.dodgeDx * dt;
  ddy = b.dodgeDy * dt;
}
```

But `dt` isn't available per-bird — the easier model is to apply dodge as a position offset that decays with remaining time:

```ts
let ddx = 0, ddy = 0;
if (now < b.dodgeUntil) {
  const remaining = b.dodgeUntil - now;
  ddx = b.dodgeDx * remaining;
  ddy = b.dodgeDy * remaining;
}
// return with x: baseX + fx + ddx, y: y + bob + ddy
```

This decays naturally: the offset shrinks linearly as `remaining → 0`.

- [ ] **Step 14.3 — Verify**

Run: `npm run dev`. In Dusk+ phase, cast at an Epic bird (Southern Cassowary, Red Goshawk, etc.).
Expected: the bird banks noticeably away from the net's center when the open window appears. Aiming at the current position misses; aim slightly ahead-and-away to catch.

- [ ] **Step 14.4 — Commit**

```bash
git add src/hooks/useGameLoop.ts
git commit -m "feat(net): epic birds dodge away from net center"
```

---

### Task 15: Legendary bite-window halo tell

**Files:**
- Modify: `src/components/game/FlyingBird.tsx` — amplify glow during bite window

- [ ] **Step 15.1 — Intensify glow during bite**

In [FlyingBird.tsx](../../../src/components/game/FlyingBird.tsx), the glow `div` currently uses `${rarity.ring}44` alpha and `bird-glow` animation for non-common. Change:

```tsx
const isBiting =
  bird.species.status === "critically_endangered" &&
  performance.now() / 1000 >= bird.biteStart &&
  performance.now() / 1000 <= bird.biteEnd;

// inside render, glow div:
<div
  style={{
    position: "absolute",
    inset: isBiting ? -22 : -12,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${rarity.ring}${isBiting ? "cc" : "55"} 0%, transparent 70%)`,
    animation: rarity.label !== "Common"
      ? `bird-glow ${isBiting ? "0.4s" : "1.5s"} ease-in-out infinite alternate`
      : undefined,
  }}
/>
```

Pass nothing new from parent — `bird` already has `biteStart`/`biteEnd`.

- [ ] **Step 15.2 — Verify**

Run: `npm run dev`. In Night, find a Legendary mid-flight. As it enters its pause, the halo should visibly pulse larger and brighter for the bite window duration, then normalize.

- [ ] **Step 15.3 — Commit**

```bash
git add src/components/game/FlyingBird.tsx
git commit -m "feat(net): intensify halo during Legendary bite window"
```

---

### Task 16: Documentation updates

**Files:**
- Modify: [CLAUDE.md](../../../CLAUDE.md)
- Modify: [.claude/rules/styling.md](../../../.claude/rules/styling.md)
- Modify: [birds-catcher-handoff/README.md](../../../birds-catcher-handoff/README.md)
- Modify: [docs/GAME_RULES.md](../GAME_RULES.md)
- Modify: [.claude/agents/game-balance.md](../../../.claude/agents/game-balance.md)

- [ ] **Step 16.1 — CLAUDE.md**

In the "Game loop" section, replace the per-tick bullet list with:

```
Per-tick work: decrement timer → maybe spawn → advance each bird's progress, apply per-tier reactions (flinch/burst/dodge) and Legendary bite-pause → tick net state machine (idle → casting → open → retracting → cooldown) → during `open`, check bird/net collisions and call `catchBird` → at open→retracting, increment `misses` if zero catches this cast → check game-over (`timeRemaining <= 0` or `misses >= MAX_MISSES=6`).
```

In the Components bullet, add `NetCharacter`, `AimArc`, `Net` to the list.

- [ ] **Step 16.2 — .claude/rules/styling.md**

Add a new section after "Design tokens":

```md
## Z-index stack

- `10` — terrain silhouette (implicit, in Sky)
- `11` — NetCharacter
- `12` — AimArc preview
- `20` — flying birds
- `25` — Net (during cast/open/retract)
- `30` — CatchEffect
- `50` — GameHUD
- `60` — MissFlash, CardReveal toast

Keep new elements aware of this ordering.
```

- [ ] **Step 16.3 — birds-catcher-handoff/README.md**

Add a single note at the very top of the file, above the existing "CODING AGENTS: READ THIS FIRST":

```md
> **NOTE (2026-04-21):** The live game has diverged from this handoff bundle — click-to-catch has been replaced by a cast-and-reel net mechanic, and tier behaviors added. Authoritative current state is in [CLAUDE.md](../CLAUDE.md) and [docs/GAME_RULES.md](../docs/GAME_RULES.md). Leave the bundle intact as a historical record.

---
```

- [ ] **Step 16.4 — docs/GAME_RULES.md**

In the "Catching" section, replace the click-based description with:

```md
A bird is caught when the player's cast net's open window overlaps the bird's hitbox. The net is triggered by clicking anywhere in the sky — see the Net mechanic section below.

### Net mechanic

Player character is fixed at bottom-center. Clicking the sky casts a net along a parabolic arc. The net has four states:

| State | Duration |
|---|---|
| Casting out | 0.5 s |
| Open (catch window) | 0.8 s |
| Retracting | 0.4 s |
| Cooldown | 0.3 s |

Total cycle: ~2 s. The catch circle is 60 px radius. Multi-catch is allowed — any bird inside during any frame of the 0.8 s open window is caught.

### Tier reactions

- Common — no reaction.
- Uncommon — 0.15 s random lateral twitch when net opens within 120 px.
- Rare — 1.4× speed burst for 0.4 s after net opens nearby.
- Epic — banks away from net center at 180 px/s for 0.5 s.
- Legendary — pauses mid-flight for 0.7 s at a random 30%–70% point of its path; only catchable during this bite window.
```

In "Ending the round", replace the miss description:

```md
- `timeRemaining <= 0` — time ran out
- `misses >= MAX_MISSES` where `MAX_MISSES = 6`. A miss is now triggered by an *empty cast* — a cast that catches zero birds during its open window. Birds flying off-screen no longer count against the player.
```

In "Where to edit", add rows for the new constants. Update the worked example if Legendary reward math has shifted.

- [ ] **Step 16.5 — .claude/agents/game-balance.md**

In the "What to Check" list, replace item 5 (spawn rate / speed) text to reference net constants alongside `RARITY`. Add a new item:

```md
11. **Net timing** — `NET_CAST_DURATION = 0.5`, `NET_OPEN_DURATION = 0.8`, `NET_RETRACT_DURATION = 0.4`, `NET_COOLDOWN = 0.3`. Total cycle ~2 s — players get ~45 casts per round. Miss cap 6 means ~13% empty-cast tolerance.

12. **Tier reaction tuning** — flinch/burst/dodge/bite constants drive the skill ceiling. If Legendaries are too easy, shrink `LEGENDARY_BITE_DURATION`. If Epics are impossible, lower `EPIC_DODGE_SPEED` or `EPIC_DODGE_DURATION`.
```

- [ ] **Step 16.6 — Build + commit**

Run: `npm run build` and `npm run lint` — PASS.

```bash
git add CLAUDE.md .claude/rules/styling.md birds-catcher-handoff/README.md docs/GAME_RULES.md .claude/agents/game-balance.md
git commit -m "docs: update for net mechanic and tier reactions"
```

---

## Final verification

After all 16 tasks committed, run a full end-to-end playtest:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Start a round, play through Dawn → Night
- [ ] Dawn birds (Common) are straightforward to net
- [ ] Noon Uncommons visibly twitch when net opens near them
- [ ] Dusk Rares accelerate after a nearby cast
- [ ] Dusk/Night Epics dodge away
- [ ] Night Legendary pauses with intensified halo; catching it during pause gives +400 × combo + 50 discovery bonus; catching attempt outside pause yields no catch
- [ ] 6 empty casts ends the round with a results screen
- [ ] Card Reveal toast still fires on first discovery
- [ ] Field Guide still shows discovered species correctly
- [ ] High score persists via `bc_high`; discoveries persist via `bc_discovered`

---

## Self-review

**1. Spec coverage** — every spec section is mapped:
- Core interaction (cast state machine) → Tasks 1, 5, 6
- Loss condition (empty-cast miss) → Tasks 5, 7, 8
- Aim preview → Tasks 3, 4
- Catch flow through `catchBird` → Task 8
- Bird differentiation → Tasks 9–15
- Tuning defaults → Task 1
- Documentation updates → Task 16

**2. Placeholder scan** — no TBDs, TODOs, or "fill in later". All code blocks are complete.

**3. Type consistency** — `NetPhase`, `net` store field, `flinchUntil`/`speedBurstUntil`/`dodgeUntil`/`biteStart`/`biteEnd`/`biteTriggered` are all named consistently across tasks.

**4. Known ambiguities resolved inline:**
- `effectiveElapsed` for progress calculation accounts for the bite-pause hold.
- Dodge offset decays linearly with `remaining` to avoid per-frame `dt` plumbing.
- Legendaries do not flinch/burst/dodge — only the pause/bite behavior applies (spec-aligned).

---

## Risks during implementation

- **Task 10 `effectiveElapsed` math may look off for a Legendary that's *about* to enter its bite window** — the pause-on-boundary case. If the bird jerks oddly, add a smoothing tolerance (~0.05 s) around `biteStart`.
- **Task 14 dodge decay** — linear decay with `remaining` feels "floaty." If it looks wrong, swap for an exponential or cubic falloff.
- **Tasks 12–14 mutate `b` in place** inside a loop that's about to be remapped. That's OK because the map returns `{ ...b, ... }` overriding most fields, but `flinchUntil`/`speedBurstUntil`/`dodgeUntil` persist because they're not rewritten in the map. Double-check after each task: the existing `.map` returns `{ ...b, ... }` which preserves unmentioned fields. Good.

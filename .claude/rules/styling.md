---
paths:
  - "src/**/*.tsx"
  - "src/index.css"
---

# Styling

"Birds at Golden Hour" is a ported claude.ai/design prototype. Styling is done with **inline `style` props + a small set of global classes**, not Tailwind. Tailwind v4 is installed via `@tailwindcss/vite` and `@import "tailwindcss"` is in [src/index.css](../../src/index.css), but it's effectively idle — don't reach for utility classes unless you're adding something totally new.

## Global classes (defined in [src/index.css](../../src/index.css))

- `.panel` — paper-textured card (HUD plates, results, title chrome)
- `.btn-primary` / `.btn-ghost` / `.btn-outline` — button variants
- `.chip` / `.chip-active` — filter chips (field guide)
- `.label` — JetBrains Mono tracked-out caps label
- `.timer-low` — pulsing red shadow on the timer plate

## Design tokens (CSS custom properties on `:root`)

- `--paper` `#fdf6e8`, `--paper-warm` `#f0e2c4`
- `--ink` `#2a1a0a`, `--ink-muted` `#6a4a2a`
- `--ember` `#c85530`, `--gold` `#c89a3a`, `--forest` `#3a4a2a`

Rarity colors live in the `RARITY` map in [src/lib/game-config.ts](../../src/lib/game-config.ts) (each tier has `color` + `ring`) — use those for status-dependent styling, not new hex literals.

## Typography

- `Fraunces` — display, body, numbers
- `JetBrains Mono` — labels, timer, chips, small data text

Both loaded via Google Fonts link in [index.html](../../index.html).

## When to use what

- **Matching the handoff** (game screens, HUD, cards): use inline `style={{…}}` so the visual stays 1:1 with the design source in `birds-catcher-handoff/`.
- **Shared chrome** (panels, buttons): use the global classes above.
- **Keyframe animations**: add to `src/index.css` and reference by name (e.g. `animation: "catch-pop 0.8s ease-out forwards"`).

## What to avoid

- New `@theme` blocks or Tailwind color aliases — the old `outback-gold` / `night-sky` / `reef-blue` palette was removed along with the previous UI.
- Inline-style strings that hard-code rarity colors — pull from `RARITY[status].color` / `.ring` instead.
- Mixing Tailwind utility classes with large blocks of inline style in the same element — pick one.

## Z-index stack

- `10` — terrain silhouette (implicit, inside Sky)
- `11` — NetCharacter
- `12` — AimArc preview
- `20` — flying birds
- `25` — Net (during cast/open/retract)
- `30` — CatchEffect
- `50` — GameHUD
- `60` — MissFlash, CardReveal toast
- `100` — BirdDetailModal (overlays everything including gameplay if opened mid-round — though it's only reachable from the Field Guide screen today)

Keep new elements aware of this ordering. Net assets are inline SVG matching the paper/ink/ember palette.

## Modal / overlay pattern

Modals (see [`BirdDetailModal`](../../src/components/game/BirdDetailModal.tsx)) use:

- A full-screen fixed backdrop with `rgba(20, 12, 4, 0.65)` + `backdropFilter: blur(4px)`.
- A `.panel` child centered in the viewport with max-height and `overflow: auto`.
- Entry animation: existing `card-in` keyframe (0.35 s `cubic-bezier(0.16, 1, 0.3, 1)`) on the panel; `fade-in` on the backdrop.
- Dismiss paths (all three): click backdrop (outer `onClick`), press Escape (window `keydown` listener in a `useEffect`), click an explicit `×` button in the top-right corner. The inner panel must `stopPropagation()` on click to avoid triggering the backdrop dismiss.

## Responsive layout

Gameplay sizes are *fluid* (see [src/lib/viewport.ts](../../src/lib/viewport.ts)) using `clamp(min, %, max)` — no hard breakpoint "jump" between phone/desktop sizes. UI *chrome* (HUD plates, modal grid, field-guide card grid, card-reveal toast, horizon band heights) is responsive via a single `@media (max-width: 640px)` block at the bottom of [src/index.css](../../src/index.css).

Components that need responsive behavior tag themselves with semantic classes and let the stylesheet override inline values. Current classes:

- HUD: `.hud-top`, `.hud-score-value`, `.hud-time-value`, `.hud-chapter-value`, `.hud-chapter-label`, `.hud-best`, `.hud-discovered`, `.hud-miss-dot`, `.combo-display`
- Field Guide: `.guide-page`, `.guide-header`, `.guide-grid`, `.guide-card`, `.guide-card-photo`, `.guide-card-name`
- Modal: `.modal-shell`, `.modal-header`, `.modal-body`, `.modal-map`
- Overlays: `.card-reveal`, `.title-heading`
- Sky / title chrome: `.title-mountain`, `.title-ground`, `.sky-mountain-far`, `.sky-mountain-near`, `.sky-ground`, `.sky-grass`

When adding a new responsive-sensitive element, tag it with a semantic class and add a rule to the existing `@media` block — don't duplicate the breakpoint.

## Touch / iOS

- `touch-action: none` on the playfield (`GameScreen`) blocks iOS pinch/zoom/double-tap-zoom and pull-to-refresh during gameplay.
- `(hover: none)` media query bumps `.btn` (min-height 44 px) and `.chip` (min-height 36 px) to meet Apple HIG touch-target sizing.
- Any bottom-anchored interactive UI must include `env(safe-area-inset-bottom)` in its position — see the `.card-reveal` rule and `NetCharacter`'s `bottom: max(NET_CHARACTER_Y_OFFSET, env(safe-area-inset-bottom))`.

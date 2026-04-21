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

Keep new elements aware of this ordering. Net assets are inline SVG matching the paper/ink/ember palette.

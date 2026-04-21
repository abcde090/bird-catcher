---
name: frontend-fixer
description: Fixes visual bugs, layout issues, image cropping, responsive problems, and UI polish in Birds at Golden Hour
allowed-tools: Read Grep Glob Edit Write Bash(npx tsc*) Bash(npm run *)
---

# Frontend Fixer Agent

You fix visual and UI bugs in "Birds at Golden Hour". Read the code, identify the CSS/layout cause, fix it directly with minimal changes.

## Styling conventions (important)

Most component styling is **inline** (via the `style` prop) to match the claude.ai/design handoff 1:1 — not Tailwind utilities. Shared pieces live as global classes in [src/index.css](src/index.css):

- `.panel` — paper-textured card (title, HUD, results)
- `.btn-primary` / `.btn-ghost` / `.btn-outline` — button variants
- `.chip` / `.chip-active` — field-guide filter chips
- `.label` — JetBrains Mono tracked-out label text
- `.timer-low` — pulsing red timer

Design tokens are CSS custom properties on `:root`: `--paper`, `--paper-warm`, `--ink`, `--ink-muted`, `--ember`, `--gold`, `--forest`. Typography: `Fraunces` for display/body, `JetBrains Mono` for numbers/labels.

Tailwind is installed but mostly unused — if you're reaching for a utility class, first check whether an inline style or one of the global classes above is more consistent with the surrounding code.

## Common Issues You Fix

1. **Image cropping** — bird photos are rendered by [src/components/game/BirdImage.tsx](src/components/game/BirdImage.tsx) as a circular clip. If heads get cut, adjust `object-position` on the `<img>` or the container diameter.

2. **Layout overflow** — elements going off-screen. Fix with `overflow: hidden`, adjusted `position`, or bounded max-width.

3. **Responsive breakage** — test at mobile widths. Most screens use percentage-based or `clamp()` sizing already; check breakage around the title `<h1>`s and the field-guide grid.

4. **Text truncation** — use `text-overflow: ellipsis` with `white-space: nowrap; overflow: hidden;`.

5. **Animation jank** — keep animations on `transform`/`opacity`. Add `will-change: transform` on elements the RAF loop moves (already set on `FlyingBird`).

6. **Z-index conflicts** — Sky is `z:0` (implicit), birds are `z:20`, catch effects `z:30`, HUD `z:50`, miss flash `z:60`, card reveal `z:60`.

7. **Touch target sizing** — minimum 44×44 px on mobile for clickable buttons/birds.

8. **Color contrast** — text on the photo layer must have `text-shadow: 0 2px 8px rgba(0,0,0,0.5)` or similar.

## Process

1. Read the component file with the issue (check `src/components/game/` first)
2. Identify the CSS/layout cause
3. Fix with minimal changes — don't refactor surrounding code
4. Run `npx tsc --noEmit` (or `npm run build`) to verify no type errors introduced
5. Report what was fixed and why, citing file:line

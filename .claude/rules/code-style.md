---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code Style

- TypeScript strict mode — no `any`. Use `unknown` at boundaries and narrow.
- Functional React components + hooks only. Default export per component file.
- Keep component files under ~200 lines; extract when they grow.
- Prefer `useState(() => …)` over `useMemo(…, [])` for one-shot random/derived layout data — React 19's `react-hooks/purity` rule bans `Math.random()` inside render and `useMemo`. Intentional per-frame impure reads (e.g. `performance.now()` in `FlyingBird` during a bite window, or in `Net` for arc position) need `// eslint-disable-next-line react-hooks/purity` with a one-line rationale comment.
- Don't read or mutate Zustand state via hooks inside the RAF loop — use `useStore.getState()` / `setState()` to avoid re-render churn.
- Immutable updates: never mutate props or store state in place. Use spread or `new Set([...prev, x])`. Exception: transient per-bird reactive fields (`flinchUntil`, `dodgeUntil`, etc.) are mutated on the ref-held birds in the game loop — these survive the subsequent `.map({...b, ...})` because the map doesn't overwrite them.
- Relative imports only (no path aliases configured).
- No `console.log` in committed code.
- Use Pointer Events (`onPointerMove` / `onPointerDown` / `onPointerUp`) for input, not `onMouse*` or `onTouch*` separately — touch devices don't fire mouse events and vice versa.
- All runtime asset URLs (`fetch()`, `<img src>`, `new Image().src`) must go through `asset()` in [src/lib/asset.ts](../../src/lib/asset.ts) so the `/bird-catcher/` GitHub Pages subpath resolves in both dev and prod.

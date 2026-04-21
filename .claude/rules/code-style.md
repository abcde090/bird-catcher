---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code Style

- TypeScript strict mode — no `any`. Use `unknown` at boundaries and narrow.
- Functional React components + hooks only. Default export per component file.
- Keep component files under ~200 lines; extract when they grow.
- Prefer `useState(() => …)` over `useMemo(…, [])` for one-shot random/derived layout data — React 19's `react-hooks/purity` rule bans `Math.random()` inside render and `useMemo`.
- Don't read or mutate Zustand state via hooks inside the RAF loop — use `useStore.getState()` / `setState()` to avoid re-render churn.
- Immutable updates: never mutate props or store state in place. Use spread or `new Set([...prev, x])`.
- Relative imports only (no path aliases configured).
- No `console.log` in committed code.

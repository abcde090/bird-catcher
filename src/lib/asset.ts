/**
 * Resolve a public asset path, respecting Vite's `base` config.
 *
 * In dev (base `/`) this returns the path unchanged. In prod on GitHub Pages
 * (base `/bird-catcher/`) it prefixes so runtime fetches and <img src> work
 * under the repo subpath.
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL;
  const cleaned = path.startsWith("/") ? path.slice(1) : path;
  return base.endsWith("/") ? base + cleaned : `${base}/${cleaned}`;
}

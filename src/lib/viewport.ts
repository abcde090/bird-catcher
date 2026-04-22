/**
 * Viewport-aware gameplay sizing.
 *
 * Rationale: we don't want a hard mobile/desktop breakpoint that snaps at
 * 640 px — a 641 px window shouldn't feel radically different from 639 px.
 * Instead, express gameplay sizes as a percentage of the viewport width,
 * clamped to sensible minimums and maximums for finger/mouse ergonomics.
 *
 * Result: a bird is roughly the same visual fraction of the screen on a
 * 375 px phone as on a 1920 px monitor, while staying large enough to be
 * catchable on either.
 *
 * All helpers are plain functions that read `window.innerWidth` at call
 * time. Game components call them on render; the game loop calls them
 * once per tick. Resize (orientation change) therefore takes effect
 * within one frame without any extra listeners.
 */

/**
 * Base bird diameter in pixels, before rarity.sizeScale is applied.
 * ~9 % of the viewport width, clamped 56–80 px. Means a Legendary
 * (0.85 × base) stays ≥ 48 px on a 375 px phone — still a reliable
 * finger tap target.
 */
export function getBirdBaseSize(): number {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  return clamp(56, 80, vw * 0.09);
}

/**
 * Net catch circle radius in pixels. ~6 % of viewport width,
 * clamped 36–50 px. Reads as a hand-net rather than a drop-catching
 * basket; still larger than an average fingertip (~40 px) thanks to
 * the touch hitbox bonus applied in the collision loop.
 */
export function getNetRadius(): number {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  return clamp(36, 50, vw * 0.06);
}

/**
 * Naturalist character sprite dimensions. Keeps the 2:3 width:height
 * ratio of the SVG.
 */
export function getCharacterSize(): { width: number; height: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const width = clamp(55, 80, vw * 0.07);
  return { width, height: width * 1.5 };
}

/**
 * Distance from the character's bottom edge to the net hoop (where
 * casts originate). In the base SVG the hoop sits at y=30 in a 120 px
 * tall canvas — 90 px above the bottom. Scale proportionally.
 */
export function getPoleOffset(): number {
  return getCharacterSize().height * 0.75;
}

/**
 * True when the primary input has no hover state — phones, tablets,
 * some touchscreen laptops. Used to grow the net hitbox so fingertip
 * imprecision doesn't feel punishing.
 */
export function isTouchPrimary(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(hover: none)").matches ?? false;
}

/**
 * Multiplier applied to bird hitboxes during collision on touch
 * devices. 15 % extra catch area compensates for lower pointing
 * precision; desktop users get no bonus.
 */
export function getHitboxMultiplier(): number {
  return isTouchPrimary() ? 1.15 : 1;
}

/**
 * Cap on simultaneous flying birds, scaled by viewport area relative
 * to a 1280×720 reference. Small phone screens get 3-4; desktops and
 * large tablets stay at 6 (the design ceiling). Prevents crowding on
 * a cramped screen.
 */
export function getMaxActive(): number {
  if (typeof window === "undefined") return 6;
  const area = window.innerWidth * window.innerHeight;
  const reference = 1280 * 720;
  const scaled = Math.round((area / reference) * 6);
  return clamp(3, 6, scaled);
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

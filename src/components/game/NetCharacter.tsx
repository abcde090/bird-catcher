import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";
import { getCharacterSize } from "../../lib/viewport";

/**
 * The naturalist's butterfly net standing upright at the bottom-center.
 * Drawn in the viewBox 0..80 wide, 0..120 tall.
 *
 * Composition (top → bottom):
 *   - Hoop rim: wide ellipse at y≈20
 *   - Mesh bag: billowed V hanging from the rim, cross-hatched fill
 *   - Pole: thick vertical line
 *   - Hand grip: brown rectangle near the base
 */
export default function NetCharacter() {
  const { width, height } = getCharacterSize();
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: `max(${NET_CHARACTER_Y_OFFSET}px, env(safe-area-inset-bottom))`,
        transform: "translateX(-50%)",
        width,
        height,
        zIndex: 11,
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 80 120" width={width} height={height}>
        <defs>
          <pattern
            id="char-net-mesh"
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 0 0 L 4 4 M 4 0 L 0 4"
              stroke="rgba(58, 40, 24, 0.85)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>

        {/* Pole — goes from grip at the bottom up to the hoop. */}
        <line
          x1="40"
          y1="112"
          x2="40"
          y2="30"
          stroke="#3a2818"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Hand grip — short brown cylinder at the bottom of the pole. */}
        <rect x="34" y="92" width="12" height="22" rx="3" fill="#6a4a2a" />
        <line
          x1="34"
          y1="103"
          x2="46"
          y2="103"
          stroke="rgba(58, 40, 24, 0.5)"
          strokeWidth="0.8"
        />

        {/* Mesh bag — billows below the hoop rim, cross-hatched webbing. */}
        <path
          d="M 20 24 Q 40 60, 60 24"
          fill="url(#char-net-mesh)"
          stroke="#3a2818"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />

        {/* Hoop rim — wide ellipse at the top, suggesting a net opening. */}
        <ellipse
          cx="40"
          cy="22"
          rx="20"
          ry="6"
          fill="rgba(253, 246, 232, 0.55)"
          stroke="#3a2818"
          strokeWidth="2.5"
        />
        {/* Inner rim highlight for depth. */}
        <ellipse
          cx="40"
          cy="22"
          rx="18"
          ry="4.5"
          fill="none"
          stroke="rgba(253, 232, 184, 0.55)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}

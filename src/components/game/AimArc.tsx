import { useGameStore } from "../../stores/useGameStore";
import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";
import { getNetRadius, getPoleOffset } from "../../lib/viewport";

export default function AimArc() {
  const cursorX = useGameStore((s) => s.cursorX);
  const cursorY = useGameStore((s) => s.cursorY);
  const cursorSet = useGameStore((s) => s.cursorSet);
  const netPhase = useGameStore((s) => s.net.phase);

  if (netPhase !== "idle") return null;
  // Don't draw an arc until the player has actually moved/touched the screen —
  // otherwise the arc would render from the character to (0,0) on first paint.
  if (!cursorSet) return null;

  const originX = window.innerWidth / 2;
  const originY = window.innerHeight - NET_CHARACTER_Y_OFFSET - getPoleOffset();

  // Hide if cursor is at or below the character's hand
  if (cursorY >= originY - 10) return null;

  // Quadratic bezier control point: above the midpoint between origin and target
  const midX = (originX + cursorX) / 2;
  const height = Math.max(60, (originY - cursorY) * 0.55);
  const ctrlY = Math.min(originY, cursorY) - height;

  const path = `M ${originX} ${originY} Q ${midX} ${ctrlY}, ${cursorX} ${cursorY}`;
  const previewRadius = getNetRadius() * 0.45;

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
      <defs>
        <pattern
          id="aim-mesh"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 8 8 M 8 0 L 0 8"
            stroke="rgba(42, 26, 10, 0.35)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>

      {/* Trajectory arc */}
      <path
        d={path}
        fill="none"
        stroke="rgba(253, 246, 232, 0.55)"
        strokeWidth="2"
        strokeDasharray="4 6"
      />

      {/* Reticle: a miniature net hoop with mesh, previewing the open net. */}
      <circle
        cx={cursorX}
        cy={cursorY}
        r={previewRadius}
        fill="url(#aim-mesh)"
        opacity="0.7"
      />
      <circle
        cx={cursorX}
        cy={cursorY}
        r={previewRadius}
        fill="none"
        stroke="rgba(253, 232, 184, 0.9)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

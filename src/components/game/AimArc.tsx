import { useGameStore } from "../../stores/useGameStore";
import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";

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
  const originY = window.innerHeight - NET_CHARACTER_Y_OFFSET - 90;

  // Hide if cursor is at or below the character's hand
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
      <circle
        cx={cursorX}
        cy={cursorY}
        r="6"
        fill="rgba(253, 246, 232, 0.35)"
        stroke="#fde8b8"
        strokeWidth="1"
      />
    </svg>
  );
}

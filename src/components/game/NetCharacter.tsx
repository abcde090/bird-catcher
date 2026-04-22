import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";
import { getCharacterSize } from "../../lib/viewport";

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
        <line
          x1="40"
          y1="115"
          x2="40"
          y2="30"
          stroke="#3a2818"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="35" y="95" width="10" height="18" rx="3" fill="#6a4a2a" />
        <ellipse
          cx="40"
          cy="25"
          rx="14"
          ry="7"
          fill="none"
          stroke="#3a2818"
          strokeWidth="2.5"
        />
        <path
          d="M 26 25 Q 40 42, 54 25"
          fill="rgba(253, 246, 232, 0.35)"
          stroke="#3a2818"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      </svg>
    </div>
  );
}

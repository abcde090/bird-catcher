import { NET_CHARACTER_Y_OFFSET } from "../../lib/game-config";

export default function NetCharacter() {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: NET_CHARACTER_Y_OFFSET,
        transform: "translateX(-50%)",
        width: 80,
        height: 120,
        zIndex: 11,
        pointerEvents: "none",
      }}
    >
      <svg viewBox="0 0 80 120" width="80" height="120">
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

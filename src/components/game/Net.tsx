import { useEffect, useState } from "react";
import { useGameStore } from "../../stores/useGameStore";
import {
  NET_CAST_DURATION,
  NET_OPEN_DURATION,
  NET_RETRACT_DURATION,
} from "../../lib/game-config";
import { getNetRadius } from "../../lib/viewport";

function arcPoint(
  t: number,
  ox: number,
  oy: number,
  tx: number,
  ty: number,
): { x: number; y: number } {
  // Quadratic bezier with apex 55% of rise above the higher endpoint
  const midX = (ox + tx) / 2;
  const height = Math.max(60, (oy - ty) * 0.55);
  const ctrlY = Math.min(oy, ty) - height;
  const x = (1 - t) * (1 - t) * ox + 2 * (1 - t) * t * midX + t * t * tx;
  const y = (1 - t) * (1 - t) * oy + 2 * (1 - t) * t * ctrlY + t * t * ty;
  return { x, y };
}

export default function Net() {
  const net = useGameStore((s) => s.net);
  const [, setTick] = useState(0);

  // Drive per-frame re-render while the net is visibly active.
  useEffect(() => {
    if (net.phase === "idle" || net.phase === "cooldown") return;
    let raf = 0;
    const loop = () => {
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [net.phase]);

  if (net.phase === "idle" || net.phase === "cooldown") return null;

  // Intentional impure read — position tracks real time per frame.
  // eslint-disable-next-line react-hooks/purity
  const elapsed = performance.now() / 1000 - net.startTime;

  let x = net.originX;
  let y = net.originY;
  let radius = 10; // closed-net size while flying
  let isOpen = false;

  if (net.phase === "casting") {
    const t = Math.min(1, elapsed / NET_CAST_DURATION);
    ({ x, y } = arcPoint(
      t,
      net.originX,
      net.originY,
      net.targetX,
      net.targetY,
    ));
  } else if (net.phase === "open") {
    x = net.targetX;
    y = net.targetY;
    isOpen = true;
    const openElapsed = elapsed - NET_CAST_DURATION;
    const expand = Math.min(1, openElapsed / 0.12);
    radius = getNetRadius() * expand;
    const closing = Math.max(
      0,
      (NET_OPEN_DURATION - openElapsed) / NET_OPEN_DURATION,
    );
    if (openElapsed > NET_OPEN_DURATION - 0.12) radius *= closing + 0.3;
  } else if (net.phase === "retracting") {
    const retractElapsed = elapsed - NET_CAST_DURATION - NET_OPEN_DURATION;
    const t = 1 - Math.min(1, retractElapsed / NET_RETRACT_DURATION);
    ({ x, y } = arcPoint(
      t,
      net.originX,
      net.originY,
      net.targetX,
      net.targetY,
    ));
  }

  return (
    <svg
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 25,
        pointerEvents: "none",
      }}
    >
      <defs>
        {/* Diagonal cross-hatched mesh pattern — reads as net webbing. */}
        <pattern
          id="net-mesh"
          width="9"
          height="9"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 9 9 M 9 0 L 0 9"
            stroke="rgba(42, 26, 10, 0.7)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </pattern>
        {/* Lighter mesh for the closed-net shape during flight. */}
        <pattern
          id="net-mesh-small"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 0 0 L 5 5 M 5 0 L 0 5"
            stroke="rgba(42, 26, 10, 0.8)"
            strokeWidth="0.7"
          />
        </pattern>
      </defs>

      {/* Rope / line from the character's hand to the net — makes it read as a
          tool on a tether, not a projectile. */}
      <line
        x1={net.originX}
        y1={net.originY}
        x2={x}
        y2={y}
        stroke="rgba(58, 40, 24, 0.55)"
        strokeWidth="1.5"
        strokeDasharray="3 4"
        strokeLinecap="round"
      />

      {isOpen ? (
        <g>
          {/* Soft outer glow to signal "catch moment". */}
          <circle
            cx={x}
            cy={y}
            r={radius + 6}
            fill="none"
            stroke="rgba(253, 232, 184, 0.35)"
            strokeWidth="6"
          />
          {/* Mesh webbing filling the net. */}
          <circle
            cx={x}
            cy={y}
            r={radius - 1}
            fill="url(#net-mesh)"
            opacity="0.9"
          />
          {/* Hoop ring — the rim of the net. */}
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill="none"
            stroke="#3a2818"
            strokeWidth="2.5"
          />
          {/* Subtle inner highlight on the hoop. */}
          <circle
            cx={x}
            cy={y}
            r={radius - 2}
            fill="none"
            stroke="rgba(253, 232, 184, 0.45)"
            strokeWidth="1"
          />
        </g>
      ) : (
        <g>
          {/* Closed net shape during flight — ellipse with mesh fill. */}
          <ellipse
            cx={x}
            cy={y}
            rx={radius}
            ry={radius * 0.7}
            fill="url(#net-mesh-small)"
          />
          <ellipse
            cx={x}
            cy={y}
            rx={radius}
            ry={radius * 0.7}
            fill="none"
            stroke="#3a2818"
            strokeWidth="1.5"
          />
        </g>
      )}
    </svg>
  );
}

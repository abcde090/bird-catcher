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

  // Drive per-frame re-render while the net is visibly active, so arc
  // motion and radius bloom update smoothly (the store only mutates `net`
  // on phase transitions, not per frame).
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

  if (net.phase === "idle") return null;

  // Intentional impure read: visual position tracks real time as the parent
  // re-renders once per tick. See net-mechanic plan, Task 6.
  // eslint-disable-next-line react-hooks/purity
  const elapsed = performance.now() / 1000 - net.startTime;

  let x = net.originX;
  let y = net.originY;
  let radius = 6;
  let showCircle = false;

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
    showCircle = true;
    // Expand radius quickly then hold
    const openElapsed = elapsed - NET_CAST_DURATION;
    const expand = Math.min(1, openElapsed / 0.12);
    radius = getNetRadius() * expand;
    // Shrink at the very end
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
  } else {
    return null; // cooldown = no visual
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x - (showCircle ? radius : 8),
        top: y - (showCircle ? radius : 8),
        width: showCircle ? radius * 2 : 16,
        height: showCircle ? radius * 2 : 16,
        zIndex: 25,
        pointerEvents: "none",
        borderRadius: "50%",
        border: showCircle
          ? "3px solid rgba(253, 232, 184, 0.85)"
          : "2px solid rgba(58, 40, 24, 0.9)",
        background: showCircle
          ? "radial-gradient(circle, rgba(253,232,184,0.15) 0%, transparent 70%)"
          : "rgba(138, 94, 32, 0.4)",
        boxShadow: showCircle ? "0 0 24px rgba(253, 232, 184, 0.5)" : "none",
      }}
    />
  );
}

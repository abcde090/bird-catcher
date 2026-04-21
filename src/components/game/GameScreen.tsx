import type { PointerEvent } from "react";
import { useGameStore } from "../../stores/useGameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { getPhase } from "../../lib/game-config";
import Sky from "./Sky";
import NetCharacter from "./NetCharacter";
import AimArc from "./AimArc";
import FlyingBird from "./FlyingBird";
import Net from "./Net";
import GameHUD from "./GameHUD";
import CatchEffect from "./CatchEffect";
import MissFlash from "./MissFlash";
import CardReveal from "./CardReveal";

export default function GameScreen() {
  const time = useGameStore((s) => s.timeRemaining);
  const activeBirds = useGameStore((s) => s.activeBirds);
  const missFlashKey = useGameStore((s) => s.missFlashKey);
  const revealBird = useGameStore((s) => s.revealBird);
  const setCursor = useGameStore((s) => s.setCursor);
  const netPhase = useGameStore((s) => s.net.phase);
  const setNet = useGameStore((s) => s.setNet);
  const { closeReveal } = useGameLoop();

  const phase = getPhase(time);

  const updateCursor = (e: PointerEvent) => {
    setCursor(e.clientX, e.clientY);
  };

  const handleCast = (e: PointerEvent) => {
    if (netPhase !== "idle") return;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight - 80 - 90;
    if (e.clientY >= originY - 10) return;
    setNet({
      phase: "casting",
      startTime: performance.now() / 1000,
      originX,
      originY,
      targetX: e.clientX,
      targetY: e.clientY,
      catchesThisCast: 0,
    });
  };

  return (
    <div
      onPointerMove={updateCursor}
      onPointerDown={updateCursor}
      onPointerUp={handleCast}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: "crosshair",
        // Prevent iOS pinch/double-tap-zoom and pull-to-refresh during play
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <Sky phase={phase} timeRemaining={time} />
      <NetCharacter />
      <AimArc />
      <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
        {activeBirds.map((b) => (
          <FlyingBird key={b.id} bird={b} />
        ))}
      </div>
      <Net />
      <CatchEffect />
      <GameHUD />
      <MissFlash trigger={missFlashKey} />
      {revealBird && (
        <CardReveal bird={revealBird.species} onClose={closeReveal} />
      )}
    </div>
  );
}

import { useGameStore } from "../../stores/useGameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { getPhase } from "../../lib/game-config";
import Sky from "./Sky";
import NetCharacter from "./NetCharacter";
import AimArc from "./AimArc";
import FlyingBird from "./FlyingBird";
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
  const { catchBird, closeReveal } = useGameLoop();

  const phase = getPhase(time);

  return (
    <div
      onMouseMove={(e) => setCursor(e.clientX, e.clientY)}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <Sky phase={phase} timeRemaining={time} />
      <NetCharacter />
      <AimArc />
      <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
        {activeBirds.map((b) => (
          <FlyingBird key={b.id} bird={b} onCatch={catchBird} />
        ))}
      </div>
      <CatchEffect />
      <GameHUD />
      <MissFlash trigger={missFlashKey} />
      {revealBird && (
        <CardReveal bird={revealBird.species} onClose={closeReveal} />
      )}
    </div>
  );
}

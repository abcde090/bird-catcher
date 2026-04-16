import { useEffect } from "react";
import { useGameStore } from "../../stores/useGameStore";
import { useGameLoop } from "../../hooks/useGameLoop";
import { PHASE_CONFIG } from "../../lib/game-config";
import FlyingBird from "./FlyingBird";
import GameHUD from "./GameHUD";
import CatchEffect from "./CatchEffect";
import CardReveal from "./CardReveal";
import PhaseAnnouncement from "./PhaseAnnouncement";
import ComboIndicator from "./ComboIndicator";
import MissFlash from "./MissFlash";

export default function GameScreen() {
  const screen = useGameStore((s) => s.screen);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const activeBirds = useGameStore((s) => s.activeBirds);
  const combo = useGameStore((s) => s.combo);
  const misses = useGameStore((s) => s.misses);
  const { start, stop, catchBird, resumeAfterReveal } = useGameLoop();

  const phaseConfig = PHASE_CONFIG[currentPhase];

  useEffect(() => {
    if (screen === "playing") {
      start();
    }
    return () => stop();
  }, [screen, start, stop]);

  return (
    <div
      className="relative h-screen w-screen cursor-crosshair overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${phaseConfig.gradientFrom}, ${phaseConfig.gradientTo})`,
        transition: "background 2s ease",
      }}
    >
      <GameHUD />

      {/* Terrain silhouette */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div
          className="h-20 w-full"
          style={{
            background: "linear-gradient(0deg, #1b3d1b, #2d5f2d88)",
            borderRadius: "40% 60% 0 0",
          }}
        />
      </div>

      {/* Flying birds */}
      {activeBirds.map((bird) => (
        <FlyingBird key={bird.id} bird={bird} onClick={catchBird} />
      ))}

      <CatchEffect />
      <PhaseAnnouncement phase={currentPhase} />
      <ComboIndicator combo={combo} />
      <MissFlash misses={misses} />

      {screen === "card-reveal" && <CardReveal onDismiss={resumeAfterReveal} />}
    </div>
  );
}

import { useGameStore } from "../../stores/useGameStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import {
  PHASE_CONFIG,
  MAX_MISSES,
  ROUND_DURATION,
  getComboMultiplier,
} from "../../lib/game-config";

export default function GameHUD() {
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const currentPhase = useGameStore((s) => s.currentPhase);
  const misses = useGameStore((s) => s.misses);
  const discoveredCount = useCollectionStore((s) => s.discoveredBirdIds.length);

  const phaseConfig = PHASE_CONFIG[currentPhase];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const progress = 1 - timeRemaining / ROUND_DURATION;
  const comboMultiplier = getComboMultiplier(combo);

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-30">
      <div className="flex items-center justify-between bg-black/40 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-bold text-white">
            {score.toLocaleString()}
          </span>
          {combo >= 2 && (
            <span className="font-mono text-sm font-bold text-outback-gold">
              x{comboMultiplier}
            </span>
          )}
        </div>

        <div className="text-center">
          <span className="text-sm font-semibold text-white">
            {phaseConfig.emoji} {phaseConfig.label} — {timeStr}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white">{discoveredCount}/40</span>
          <span className="text-sm text-white">
            {"❌".repeat(misses)}
            {"⬜".repeat(MAX_MISSES - misses)}
          </span>
        </div>
      </div>

      <div className="h-1 bg-black/20">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: phaseConfig.gradientFrom,
          }}
        />
      </div>
    </div>
  );
}

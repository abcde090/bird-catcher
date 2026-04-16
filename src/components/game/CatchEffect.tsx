import { useEffect } from "react";
import { useGameStore } from "../../stores/useGameStore";
import { CATCH_EFFECT_DURATION } from "../../lib/game-config";

export default function CatchEffect() {
  const effects = useGameStore((s) => s.catchEffects);
  const removeCatchEffect = useGameStore((s) => s.removeCatchEffect);

  useEffect(() => {
    if (effects.length === 0) return;

    const timer = setTimeout(() => {
      const now = Date.now();
      effects.forEach((effect) => {
        if (now - effect.spawnTime > CATCH_EFFECT_DURATION) {
          removeCatchEffect(effect.id);
        }
      });
    }, CATCH_EFFECT_DURATION);

    return () => clearTimeout(timer);
  }, [effects, removeCatchEffect]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="absolute animate-score-float text-center"
          style={{
            left: effect.x,
            top: effect.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="font-mono text-xl font-bold text-outback-gold drop-shadow-lg">
            +{effect.score}
          </div>
          <div className="text-xs font-medium text-white drop-shadow-lg">
            {effect.birdName}
          </div>
        </div>
      ))}
    </div>
  );
}

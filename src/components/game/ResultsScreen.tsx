import { useGameStore } from "../../stores/useGameStore";
import { useBirdStore } from "../../stores/useBirdStore";

interface Props {
  onPlayAgain: () => void;
  onFieldGuide: () => void;
}

export default function ResultsScreen({ onPlayAgain, onFieldGuide }: Props) {
  const score = useGameStore((s) => s.score);
  const highScore = useGameStore((s) => s.highScore);
  const caughtThisRound = useGameStore((s) => s.caughtThisRound);
  const newSpeciesThisRound = useGameStore((s) => s.newSpeciesThisRound);
  const misses = useGameStore((s) => s.misses);
  const getBirdBySlug = useBirdStore((s) => s.getBirdBySlug);

  const isNewHighScore = score >= highScore && score > 0;
  const accuracy =
    caughtThisRound.length + misses > 0
      ? Math.round(
          (caughtThisRound.length / (caughtThisRound.length + misses)) * 100,
        )
      : 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-night-sky to-bark-900 px-6">
      {isNewHighScore && (
        <p className="mb-2 animate-pulse text-sm font-bold uppercase tracking-widest text-outback-gold">
          New High Score!
        </p>
      )}

      <p className="font-mono text-6xl font-bold text-white">
        {score.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-white/40">
        Best: {highScore.toLocaleString()}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-2xl font-bold text-white">
            {caughtThisRound.length}
          </p>
          <p className="text-xs text-white/50">Caught</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-2xl font-bold text-outback-gold">
            {newSpeciesThisRound.length}
          </p>
          <p className="text-xs text-white/50">New Species</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="text-2xl font-bold text-white">{accuracy}%</p>
          <p className="text-xs text-white/50">Accuracy</p>
        </div>
      </div>

      {newSpeciesThisRound.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-center text-xs uppercase tracking-widest text-white/40">
            New species discovered
          </p>
          <div className="flex gap-3">
            {newSpeciesThisRound.map((id) => {
              const bird = getBirdBySlug(id);
              if (!bird) return null;
              return (
                <div
                  key={id}
                  className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-outback-gold bg-white"
                >
                  <img
                    src={bird.imageUrl}
                    alt={bird.commonName}
                    className="h-full w-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <button
          onClick={onPlayAgain}
          className="rounded-full bg-outback-gold px-8 py-3 font-bold text-deep-bark transition-transform hover:scale-105"
        >
          Play Again
        </button>
        <button
          onClick={onFieldGuide}
          className="rounded-full border border-white/20 bg-white/10 px-8 py-3 font-bold text-white transition-colors hover:bg-white/20"
        >
          Field Guide
        </button>
      </div>
    </div>
  );
}

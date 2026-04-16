import { useGameStore } from "../../stores/useGameStore";
import { useCollectionStore } from "../../stores/useCollectionStore";

interface Props {
  onPlay: () => void;
  onFieldGuide: () => void;
  imagesLoaded: boolean;
}

export default function TitleScreen({
  onPlay,
  onFieldGuide,
  imagesLoaded,
}: Props) {
  const highScore = useGameStore((s) => s.highScore);
  const discoveredCount = useCollectionStore((s) => s.discoveredBirdIds.length);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-outback-gold to-outback-orange px-6">
      <h1 className="font-serif text-6xl font-bold text-deep-bark md:text-8xl">
        Bird Catcher
      </h1>
      <p className="mt-2 text-lg text-deep-bark/70">
        Catch Australian birds before they fly away!
      </p>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button
          onClick={onPlay}
          disabled={!imagesLoaded}
          className="rounded-full bg-deep-bark px-12 py-4 text-xl font-bold text-outback-gold transition-transform hover:scale-105 disabled:opacity-50"
        >
          {imagesLoaded ? "Play" : "Loading..."}
        </button>

        <button
          onClick={onFieldGuide}
          className="rounded-full border-2 border-deep-bark/30 px-8 py-3 font-semibold text-deep-bark transition-colors hover:bg-deep-bark/10"
        >
          Field Guide
        </button>
      </div>

      <div className="mt-8 flex gap-8 text-center">
        <div>
          <p className="font-mono text-2xl font-bold text-deep-bark">
            {highScore.toLocaleString()}
          </p>
          <p className="text-sm text-deep-bark/60">High Score</p>
        </div>
        <div>
          <p className="font-mono text-2xl font-bold text-deep-bark">
            {discoveredCount}/40
          </p>
          <p className="text-sm text-deep-bark/60">Discovered</p>
        </div>
      </div>
    </div>
  );
}

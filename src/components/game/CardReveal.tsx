import { useGameStore } from "../../stores/useGameStore";
import { useBirdStore } from "../../stores/useBirdStore";
import ConservationBadge from "../birds/ConservationBadge";

interface Props {
  onDismiss: () => void;
}

export default function CardReveal({ onDismiss }: Props) {
  const revealBirdId = useGameStore((s) => s.revealBirdId);
  const getBirdBySlug = useBirdStore((s) => s.getBirdBySlug);

  const bird = revealBirdId ? getBirdBySlug(revealBirdId) : null;

  if (!bird) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-xs animate-card-flip overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative h-48 bg-sand-200">
          <img
            src={bird.imageUrl}
            alt={bird.commonName}
            className="h-full w-full object-cover object-top"
          />
        </div>
        <div className="p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-outback-gold">
            New Species!
          </p>
          <h3 className="mt-1 font-serif text-xl font-bold text-bark-900">
            {bird.commonName}
          </h3>
          <p className="text-xs italic text-bark-400">{bird.scientificName}</p>

          <div className="mt-3 rounded-lg bg-sand-100 p-3">
            <p className="text-sm text-bark-700">{bird.funFact}</p>
          </div>

          <div className="mt-3">
            <ConservationBadge status={bird.conservationStatus} />
          </div>

          <button
            onClick={onDismiss}
            className="mt-4 rounded-full bg-outback-gold px-6 py-2 text-sm font-bold text-deep-bark transition-colors hover:bg-outback-orange hover:text-white"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

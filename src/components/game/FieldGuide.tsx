import { useState } from "react";
import { useBirdStore } from "../../stores/useBirdStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import type { BirdSpecies } from "../../types/bird";
import BirdDetail from "./BirdDetail";

interface Props {
  onBack: () => void;
}

export default function FieldGuide({ onBack }: Props) {
  const birds = useBirdStore((s) => s.birds);
  const discoveredBirdIds = useCollectionStore((s) => s.discoveredBirdIds);
  const [selectedBird, setSelectedBird] = useState<BirdSpecies | null>(null);

  return (
    <div className="min-h-screen bg-sand-100 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="rounded-full bg-sand-200 px-4 py-2 text-sm font-semibold text-bark-700 hover:bg-sand-300"
          >
            ← Back
          </button>
          <h2 className="font-serif text-2xl font-bold text-bark-900">
            Field Guide
          </h2>
          <p className="text-sm text-bark-400">
            {discoveredBirdIds.length}/40 discovered
          </p>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-sand-300">
          <div
            className="h-full rounded-full bg-outback-gold transition-all"
            style={{
              width: `${(discoveredBirdIds.length / 40) * 100}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {birds.map((bird) => {
            const isDiscovered = discoveredBirdIds.includes(bird.id);
            return (
              <button
                key={bird.id}
                onClick={() => isDiscovered && setSelectedBird(bird)}
                className={`flex flex-col items-center overflow-hidden rounded-xl border-2 p-2 transition-transform ${
                  isDiscovered
                    ? "border-outback-gold bg-white shadow-sm hover:scale-105"
                    : "cursor-default border-dashed border-sand-300 bg-sand-200"
                }`}
                disabled={!isDiscovered}
              >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg">
                  {isDiscovered ? (
                    <img
                      src={bird.imageUrl}
                      alt={bird.commonName}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="text-2xl opacity-20">🐦</span>
                  )}
                </div>
                <p
                  className={`mt-1 text-center text-[10px] font-semibold leading-tight ${
                    isDiscovered ? "text-bark-900" : "text-bark-400"
                  }`}
                >
                  {isDiscovered ? bird.commonName : "???"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedBird && (
        <BirdDetail bird={selectedBird} onClose={() => setSelectedBird(null)} />
      )}
    </div>
  );
}

import type { BirdSpecies } from "../../types/bird";
import ConservationBadge from "../birds/ConservationBadge";
import HabitatTag from "../birds/HabitatTag";
import { REGION_NAMES } from "../../lib/constants";

interface Props {
  bird: BirdSpecies;
  onClose: () => void;
}

export default function BirdDetail({ bird, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-sand-200 text-bark-700 hover:bg-sand-300"
          aria-label="Close detail view"
        >
          ✕
        </button>

        <div className="h-48 overflow-hidden rounded-2xl bg-sand-200">
          <img
            src={bird.imageUrl}
            alt={bird.commonName}
            className="h-full w-full object-cover object-top"
          />
        </div>

        <div className="mt-4">
          <h2 className="font-serif text-2xl font-bold text-bark-900">
            {bird.commonName}
          </h2>
          <p className="text-sm italic text-bark-400">{bird.scientificName}</p>
          <p className="text-xs text-bark-400">
            {bird.family} · {bird.order}
          </p>
        </div>

        <div className="mt-3">
          <ConservationBadge status={bird.conservationStatus} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-bark-700">
          {bird.description}
        </p>

        <div className="mt-4 rounded-xl bg-sand-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-400">
            Fun Fact
          </p>
          <p className="mt-1 text-sm text-bark-700">{bird.funFact}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-sand-100 p-3">
            <p className="font-mono text-lg font-bold text-eucalyptus-500">
              {bird.population.current.toLocaleString()}
            </p>
            <p className="text-xs text-bark-400">
              Population ({bird.population.lastSurveyYear})
            </p>
          </div>
          <div className="rounded-xl bg-sand-100 p-3">
            <p className="font-mono text-lg font-bold text-eucalyptus-500">
              {bird.size.lengthCm} cm
            </p>
            <p className="text-xs text-bark-400">Length</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-400">
            Diet
          </p>
          <p className="mt-1 text-sm text-bark-700">{bird.diet}</p>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-400">
            Habitats
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {bird.habitats.map((h) => (
              <HabitatTag key={h} habitat={h} />
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-bark-400">
            Regions
          </p>
          <p className="mt-1 text-sm text-bark-700">
            {bird.regions.map((r) => REGION_NAMES[r]).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
}

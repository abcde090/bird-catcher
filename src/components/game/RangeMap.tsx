import type { BirdSpecies } from "../../types/bird";
import AustraliaMap from "./AustraliaMap";

interface RangeMapProps {
  bird: BirdSpecies;
  highlightColor: string;
  size?: number;
}

/**
 * Shows the bird's distribution. If a Wikipedia-sourced range map is
 * available (fetched via scripts/fetch-range-maps.py and cached under
 * /birds/maps/), render that. Otherwise fall back to the stylized
 * AustraliaMap driven by the bird's hand-curated `regions` list.
 */
export default function RangeMap({
  bird,
  highlightColor,
  size = 240,
}: RangeMapProps) {
  if (bird.rangeMapUrl) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 4,
          overflow: "hidden",
          background: "rgba(138, 94, 32, 0.06)",
          border: "1px solid rgba(138, 94, 32, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={bird.rangeMapUrl}
          alt={`${bird.name} distribution map`}
          loading="lazy"
          draggable={false}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
            userSelect: "none",
          }}
        />
      </div>
    );
  }

  return (
    <AustraliaMap
      regions={bird.regions}
      highlightColor={highlightColor}
      size={size}
    />
  );
}

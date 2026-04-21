import type { AustralianStateId } from "../../types/bird";

interface AustraliaMapProps {
  regions: AustralianStateId[];
  highlightColor: string;
  size?: number;
}

const STATE_LABELS: Record<AustralianStateId, string> = {
  wa: "WA",
  nt: "NT",
  sa: "SA",
  qld: "QLD",
  nsw: "NSW",
  act: "ACT",
  vic: "VIC",
  tas: "TAS",
};

// Centroid positions as a percentage of the map image bounds, tuned to the
// /maps/australia-states.svg silhouette. Adjust if the SVG is ever swapped.
const STATE_CENTROID: Record<AustralianStateId, { x: number; y: number }> = {
  wa: { x: 24, y: 52 },
  nt: { x: 48, y: 30 },
  sa: { x: 52, y: 62 },
  qld: { x: 74, y: 32 },
  nsw: { x: 80, y: 58 },
  act: { x: 85, y: 64 },
  vic: { x: 76, y: 72 },
  tas: { x: 77, y: 92 },
};

export default function AustraliaMap({
  regions,
  highlightColor,
  size = 240,
}: AustraliaMapProps) {
  const active = new Set(regions);
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size * 0.92,
        background: "rgba(138, 94, 32, 0.06)",
        border: "1px solid rgba(138, 94, 32, 0.25)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <img
        src="/maps/australia-states.svg"
        alt="Australia"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: 0.55,
          filter: "brightness(0.85)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
      {/* Tint the silhouette states that aren't highlighted so actives pop. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(253, 246, 232, 0.08) 100%)`,
          pointerEvents: "none",
        }}
      />
      {(Object.keys(STATE_CENTROID) as AustralianStateId[]).map((id) => {
        const highlighted = active.has(id);
        if (!highlighted) return null;
        const pos = STATE_CENTROID[id];
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: highlightColor,
                border: "2px solid var(--paper)",
                boxShadow: `0 0 0 2px ${highlightColor}55, 0 2px 6px rgba(0,0,0,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "var(--paper)",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              {STATE_LABELS[id]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type { AustralianStateId } from "../../types/bird";

interface AustraliaMapProps {
  regions: AustralianStateId[];
  highlightColor: string;
  size?: number;
}

// Highly stylized polygon approximations of Australian state/territory shapes.
// ViewBox 0 0 100 100 — WA far west, QLD far northeast, TAS island in south.
// Not geographically precise — tuned for recognizability at small sizes.
const STATE_PATHS: Record<AustralianStateId, string> = {
  wa: "M 4 12 L 38 12 L 38 40 L 39 70 L 22 76 L 12 72 L 4 58 L 2 38 Z",
  nt: "M 38 12 L 62 10 L 62 40 L 38 40 Z",
  sa: "M 38 40 L 62 40 L 65 72 L 55 82 L 39 82 L 39 70 Z",
  qld: "M 62 10 L 96 10 L 96 44 L 72 48 L 62 40 Z",
  nsw: "M 65 48 L 96 44 L 96 68 L 78 72 L 65 72 Z",
  act: "M 86 68 L 90 68 L 90 72 L 86 72 Z", // Inside NSW
  vic: "M 65 72 L 92 68 L 92 82 L 78 86 L 65 82 Z",
  tas: "M 75 92 L 89 92 L 89 100 L 75 100 Z",
};

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

// Approximate label centroids (for showing state codes on highlight)
const STATE_LABEL_POS: Record<AustralianStateId, { x: number; y: number }> = {
  wa: { x: 20, y: 45 },
  nt: { x: 50, y: 26 },
  sa: { x: 50, y: 58 },
  qld: { x: 78, y: 28 },
  nsw: { x: 80, y: 60 },
  act: { x: 95, y: 71 },
  vic: { x: 78, y: 77 },
  tas: { x: 82, y: 97 },
};

const ALL_STATES: AustralianStateId[] = [
  "wa",
  "nt",
  "sa",
  "qld",
  "nsw",
  "act",
  "vic",
  "tas",
];

export default function AustraliaMap({
  regions,
  highlightColor,
  size = 240,
}: AustraliaMapProps) {
  const active = new Set(regions);

  return (
    <svg
      viewBox="0 0 100 105"
      width={size}
      height={size * 1.05}
      style={{ display: "block" }}
    >
      {/* Ocean / backdrop */}
      <rect width="100" height="105" fill="rgba(138, 94, 32, 0.04)" rx="2" />

      {/* State polygons */}
      {ALL_STATES.map((id) => {
        const highlighted = active.has(id);
        // ACT gets a ring treatment instead of a fill so it doesn't vanish inside NSW
        if (id === "act") {
          return (
            <g key={id}>
              <circle
                cx={STATE_LABEL_POS.act.x - 7}
                cy={STATE_LABEL_POS.act.y - 3}
                r="2"
                fill={highlighted ? highlightColor : "transparent"}
                stroke={highlighted ? highlightColor : "rgba(138,94,32,0.5)"}
                strokeWidth="0.8"
              />
              {highlighted && (
                <text
                  x={STATE_LABEL_POS.act.x}
                  y={STATE_LABEL_POS.act.y + 0.5}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize="3"
                  fill="var(--ink)"
                  fontWeight="600"
                >
                  ACT
                </text>
              )}
            </g>
          );
        }
        return (
          <g key={id}>
            <path
              d={STATE_PATHS[id]}
              fill={highlighted ? highlightColor : "rgba(138, 94, 32, 0.1)"}
              stroke={highlighted ? "var(--ink)" : "rgba(138, 94, 32, 0.4)"}
              strokeWidth={highlighted ? "0.7" : "0.5"}
              strokeLinejoin="round"
            />
            {highlighted && (
              <text
                x={STATE_LABEL_POS[id].x}
                y={STATE_LABEL_POS[id].y}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace"
                fontSize="4"
                fill="var(--paper)"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {STATE_LABELS[id]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

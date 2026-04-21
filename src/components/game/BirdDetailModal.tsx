import { useEffect } from "react";
import type { BirdSpecies } from "../../types/bird";
import { RARITY } from "../../lib/game-config";
import RangeMap from "./RangeMap";
import BirdImage from "./BirdImage";

interface BirdDetailModalProps {
  bird: BirdSpecies;
  onClose: () => void;
}

export default function BirdDetailModal({
  bird,
  onClose,
}: BirdDetailModalProps) {
  const rarity = RARITY[bird.status];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 12, 4, 0.65)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fade-in 0.25s ease-out",
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          padding: "28px 32px",
          animation: "card-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            border: "1.5px solid rgba(58, 40, 24, 0.4)",
            borderRadius: "50%",
            background: "transparent",
            color: "var(--ink)",
            fontFamily: "'Fraunces', serif",
            fontSize: 18,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          ×
        </button>

        {/* Header: photo + names */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <BirdImage bird={bird} size={140} facing={1} ring={rarity.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="label"
              style={{
                color: rarity.color,
                fontSize: 10,
                marginBottom: 6,
              }}
            >
              {rarity.label}
            </div>
            <h2
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 32,
                fontWeight: 500,
                color: "var(--ink)",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {bird.name}
            </h2>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontSize: 15,
                color: "var(--ink-muted)",
                marginTop: 2,
              }}
            >
              {bird.scientific}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ink-muted)",
                marginTop: 8,
              }}
            >
              {bird.category}
            </div>
          </div>
        </div>

        {/* Body: 2-column — map + stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 24,
            alignItems: "start",
            marginTop: 16,
          }}
        >
          {/* Distribution map */}
          <div>
            <div className="label" style={{ marginBottom: 8 }}>
              Distribution
            </div>
            <RangeMap bird={bird} highlightColor={rarity.color} size={240} />
            {!bird.rangeMapUrl && (
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontStyle: "italic",
                  fontSize: 11,
                  color: "var(--ink-muted)",
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {bird.regions.length > 0
                  ? "Approximate range (detailed map unavailable)"
                  : "Range data unknown"}
              </div>
            )}
          </div>

          {/* Stats column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <StatRow label="Population" value={bird.population} />
            <StatRow label="Size" value={`${bird.size} cm`} />

            <div>
              <div className="label" style={{ marginBottom: 6 }}>
                Habitats
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {bird.habitats.map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      borderRadius: 2,
                      background: "rgba(138, 94, 32, 0.1)",
                      border: "1px solid rgba(138, 94, 32, 0.25)",
                      color: "var(--ink)",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="label" style={{ marginBottom: 6 }}>
                Diet
              </div>
              <div
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 14,
                  color: "var(--ink)",
                  lineHeight: 1.4,
                }}
              >
                {bird.diet}
              </div>
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div
          style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px dashed ${rarity.color}55`,
            fontFamily: "'Fraunces', serif",
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.5,
            color: "var(--ink)",
          }}
        >
          "{bird.funFact}"
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 20,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

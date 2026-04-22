import { useEffect } from "react";
import type { BirdSpecies } from "../../types/bird";
import { RARITY } from "../../lib/game-config";
import BirdImage from "./BirdImage";

interface CardRevealProps {
  bird: BirdSpecies;
  onClose: () => void;
}

export default function CardReveal({ bird, onClose }: CardRevealProps) {
  const rarity = RARITY[bird.status];

  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="card-reveal"
      onClick={onClose}
      style={{
        position: "absolute",
        top: 88,
        right: 16,
        zIndex: 60,
        width: 280,
        animation: "toast-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      <div
        className="card-reveal-panel"
        style={{
          padding: "14px 16px 16px",
          background: "linear-gradient(160deg, #fdf6e8ee, #f0e2c4ee)",
          backdropFilter: "blur(6px)",
          border: `1.5px solid ${rarity.color}`,
          borderRadius: 4,
          boxShadow: `0 0 24px ${rarity.ring}66, 0 12px 32px rgba(0,0,0,0.35)`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            padding: "3px 10px",
            background: rarity.color,
            color: "#fdf6e8",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 600,
            borderRadius: "3px 0 3px 0",
          }}
        >
          ✦ New · {rarity.label}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <BirdImage bird={bird} size={68} facing={1} ring={rarity.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 17,
                fontWeight: 500,
                margin: "0 0 1px",
                color: "#2a1a0a",
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
              }}
            >
              {bird.name}
            </h3>
            <div
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontSize: 11,
                color: "#6a4a2a",
                lineHeight: 1.2,
              }}
            >
              {bird.scientific}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                letterSpacing: "0.2em",
                color: rarity.color,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              +50 discovery bonus
            </div>
          </div>
        </div>

        <div
          className="card-reveal-fact"
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: `1px dashed ${rarity.color}44`,
            fontSize: 11,
            color: "#3a2a1a",
            fontFamily: "'Fraunces', serif",
            lineHeight: 1.4,
            fontStyle: "italic",
          }}
        >
          "{bird.funFact}"
        </div>
      </div>
    </div>
  );
}

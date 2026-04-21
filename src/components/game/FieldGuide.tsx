import { useState } from "react";
import { useBirdStore } from "../../stores/useBirdStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { useGameStore } from "../../stores/useGameStore";
import { RARITY } from "../../lib/game-config";
import type { BirdSpecies, ConservationStatus } from "../../types/bird";
import BirdImage from "./BirdImage";
import BirdDetailModal from "./BirdDetailModal";

type Filter = "all" | ConservationStatus;

const FILTER_OPTIONS: Array<[Filter, string]> = [
  ["all", "All"],
  ["least_concern", "Common"],
  ["near_threatened", "Uncommon"],
  ["vulnerable", "Rare"],
  ["endangered", "Epic"],
  ["critically_endangered", "Legendary"],
];

export default function FieldGuide() {
  const birds = useBirdStore((s) => s.birds);
  const discovered = useCollectionStore((s) => s.discovered);
  const setScreen = useGameStore((s) => s.setScreen);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<BirdSpecies | null>(null);

  const filtered =
    filter === "all" ? birds : birds.filter((b) => b.status === filter);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(180deg, #f0e2c4, #e8d8b4)",
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px" }}>
        <button
          onClick={() => setScreen("title")}
          className="btn btn-outline"
          style={{ marginBottom: 32 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div
          style={{
            borderBottom: "1px solid rgba(138,94,32,0.3)",
            paddingBottom: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.4em",
              color: "#8a5e20",
              textTransform: "uppercase",
            }}
          >
            Vol. I
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 72,
              fontWeight: 400,
              margin: "4px 0 0",
              letterSpacing: "-0.03em",
              color: "#2a1a0a",
              fontStyle: "italic",
            }}
          >
            Field Journal
          </h1>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              color: "#6a4a2a",
              marginTop: 8,
              fontSize: 16,
            }}
          >
            {discovered.size} of {birds.length} species catalogued · keep
            watching the skies.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {FILTER_OPTIONS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={"chip " + (filter === k ? "chip-active" : "")}
            >
              {l}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((b) => (
            <JournalCard
              key={b.id}
              bird={b}
              known={discovered.has(b.id)}
              onOpen={() => setSelected(b)}
            />
          ))}
        </div>
      </div>

      {selected && (
        <BirdDetailModal bird={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

interface JournalCardProps {
  bird: BirdSpecies;
  known: boolean;
  onOpen: () => void;
}

function JournalCard({ bird, known, onOpen }: JournalCardProps) {
  const rarity = RARITY[bird.status];

  const baseStyle: React.CSSProperties = {
    padding: 18,
    background: known ? "#fdf6e8" : "#e8dabe",
    border: `1.5px solid ${known ? rarity.color + "66" : "rgba(138, 94, 32, 0.25)"}`,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
    textAlign: "left",
    width: "100%",
    cursor: known ? "pointer" : "default",
    fontFamily: "inherit",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  const content = (
    <>
      <div
        style={{
          width: "100%",
          height: 140,
          background: "rgba(138,94,32,0.08)",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          filter: known ? "none" : "grayscale(1) brightness(0.55)",
          opacity: known ? 1 : 0.6,
          position: "relative",
        }}
      >
        <BirdImage
          bird={bird}
          size={120}
          facing={1}
          ring={known ? rarity.color : undefined}
        />
        {!known && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(42, 26, 10, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fde8b8",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.2em",
          color: known ? rarity.color : "var(--ink-muted)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {rarity.label}
      </div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 18,
          fontWeight: 500,
          color: known ? "var(--ink)" : "var(--ink-muted)",
          marginTop: 2,
          fontStyle: known ? "normal" : "italic",
        }}
      >
        {bird.name}
      </div>
      {known ? (
        <>
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontSize: 12,
              color: "#6a4a2a",
            }}
          >
            {bird.scientific}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#3a2a1a",
              lineHeight: 1.5,
            }}
          >
            {bird.funFact}
          </div>
        </>
      ) : (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            marginTop: 10,
            opacity: 0.7,
          }}
        >
          Not yet catalogued
        </div>
      )}
    </>
  );

  if (known) {
    return (
      <button
        type="button"
        onClick={onOpen}
        style={baseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(58, 40, 24, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "";
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={baseStyle}>{content}</div>;
}

import { useCollectionStore } from "../../stores/useCollectionStore";
import { useGameStore } from "../../stores/useGameStore";
import { RARITY } from "../../lib/game-config";
import BirdImage from "./BirdImage";

export default function ResultsScreen() {
  const score = useGameStore((s) => s.score);
  const catches = useGameStore((s) => s.catches);
  const newDiscoveries = useGameStore((s) => s.newDiscoveries);
  const startRound = useGameStore((s) => s.startRound);
  const setScreen = useGameStore((s) => s.setScreen);
  const highScore = useCollectionStore((s) => s.highScore);

  const isNewHigh = score > 0 && score === highScore;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, #1a1a2e, #0a0a1a)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 47.3) % 100;
          const y = (i * 29.1) % 100;
          const s = 0.5 + ((i * 7) % 3) * 0.4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: s,
                height: s,
                background: "#fff9e0",
                borderRadius: "50%",
                boxShadow: "0 0 3px #fff9e0",
              }}
            />
          );
        })}
      </div>

      <div
        className="panel"
        style={{
          width: 620,
          maxWidth: "90vw",
          padding: "40px 48px",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: "0.4em",
            color: "var(--ink-muted)",
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          ◈ Round Complete ◈
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: isNewHigh ? 32 : 40,
            fontWeight: 500,
            color: "var(--ink)",
            textAlign: "center",
            margin: "12px 0 4px",
            letterSpacing: "-0.02em",
          }}
        >
          {isNewHigh ? "A new personal best" : "Final Tally"}
        </h2>
        {isNewHigh && (
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              color: "#c85530",
              marginBottom: 8,
            }}
          >
            Your sharpest field day yet.
          </div>
        )}

        <div
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 96,
            fontWeight: 600,
            color: "var(--ink)",
            textAlign: "center",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            margin: "12px 0",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score.toLocaleString()}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            margin: "24px 0",
          }}
        >
          <Stat label="Caught" value={catches.length} />
          <Stat label="New species" value={newDiscoveries} />
          <Stat label="Personal best" value={highScore.toLocaleString()} />
        </div>

        {catches.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>
              Today's catch
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                maxHeight: 140,
                overflowY: "auto",
              }}
            >
              {catches.slice(0, 20).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px 4px 4px",
                    background: "rgba(138,94,32,0.08)",
                    border: "1px solid rgba(138,94,32,0.2)",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "'Fraunces', serif",
                    color: "var(--ink)",
                  }}
                >
                  <BirdImage
                    bird={c}
                    size={22}
                    facing={1}
                    ring={RARITY[c.status].color}
                  />
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={startRound}>
            Play Again
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setScreen("guide")}
          >
            Journal
          </button>
          <button
            className="btn btn-outline"
            onClick={() => setScreen("title")}
          >
            Title
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 4px",
        background: "rgba(138,94,32,0.06)",
        borderRadius: 4,
        border: "1px solid rgba(138,94,32,0.15)",
      }}
    >
      <div className="label">{label}</div>
      <div
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 28,
          fontWeight: 500,
          color: "var(--ink)",
          marginTop: 4,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

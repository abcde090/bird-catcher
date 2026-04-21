import { useBirdStore } from "../../stores/useBirdStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { useGameStore } from "../../stores/useGameStore";
import { MAX_MISSES, getComboMult, getPhase } from "../../lib/game-config";
import type { PhaseId } from "../../types/game";

export default function GameHUD() {
  const score = useGameStore((s) => s.score);
  const time = useGameStore((s) => s.timeRemaining);
  const misses = useGameStore((s) => s.misses);
  const combo = useGameStore((s) => s.combo);
  const highScore = useCollectionStore((s) => s.highScore);
  const discovered = useCollectionStore((s) => s.discovered);
  const totalBirds = useBirdStore((s) => s.birds.length);

  const phase = getPhase(time);
  const mm = Math.floor(time / 60);
  const ss = Math.floor(time % 60);
  const timeStr = `${mm}:${ss.toString().padStart(2, "0")}`;
  const mult = getComboMult(combo);
  const critical = misses >= MAX_MISSES - 1;
  const lowTime = time < 15;

  return (
    <>
      <div
        className="hud-top"
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none",
          zIndex: 50,
        }}
      >
        {/* Score plate */}
        <div className="panel" style={{ padding: "14px 22px", minWidth: 220 }}>
          <div className="label">Score</div>
          <div
            className="hud-score-value"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 42,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {score.toLocaleString()}
          </div>
          <div
            className="label hud-best"
            style={{ marginTop: 4, opacity: 0.7, fontSize: 10 }}
          >
            Best ·{" "}
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center — phase + time */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            className="panel"
            style={{
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <PhaseGlyph id={phase.id} />
            <div>
              <div
                className="label hud-chapter-label"
                style={{ fontSize: 9, opacity: 0.7 }}
              >
                Chapter
              </div>
              <div
                className="hud-chapter-value"
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--ink)",
                  lineHeight: 1,
                }}
              >
                {phase.label}
              </div>
            </div>
          </div>
          <div
            className={"panel " + (lowTime ? "timer-low" : "")}
            style={{ padding: "8px 22px", minWidth: 140, textAlign: "center" }}
          >
            <div className="label" style={{ fontSize: 9 }}>
              Time
            </div>
            <div
              className="hud-time-value"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 28,
                fontWeight: 600,
                color: lowTime ? "#c4452a" : "var(--ink)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {timeStr}
            </div>
          </div>
        </div>

        {/* Misses + discoveries */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <div className="panel" style={{ padding: "14px 22px" }}>
            <div className="label" style={{ textAlign: "right" }}>
              Missed
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {Array.from({ length: MAX_MISSES }).map((_, i) => (
                <div
                  key={i}
                  className="hud-miss-dot"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "1.5px solid var(--ink-muted)",
                    background:
                      i < misses
                        ? critical && i === misses - 1
                          ? "#c4452a"
                          : "var(--ink)"
                        : "transparent",
                    boxShadow:
                      i < misses ? "inset 0 1px 2px rgba(0,0,0,0.3)" : "none",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="panel" style={{ padding: "8px 14px" }}>
            <div
              className="hud-discovered"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "var(--ink)",
              }}
            >
              <span style={{ opacity: 0.6 }}>Discovered</span> {discovered.size}
              /{totalBirds}
            </div>
          </div>
        </div>
      </div>

      {/* Combo display center */}
      {combo >= 2 && (
        <div
          key={combo}
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 40,
            textAlign: "center",
            animation: "combo-pulse 0.6s ease-out",
          }}
        >
          <div
            className="combo-display"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 72,
              fontWeight: 600,
              color: mult >= 3 ? "#c4452a" : "#8a5e20",
              textShadow:
                "0 4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(228, 168, 80, 0.6)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            ×{mult}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.3em",
              color: "#fff",
              textTransform: "uppercase",
              marginTop: 4,
              textShadow: "0 2px 8px rgba(0,0,0,0.7)",
            }}
          >
            {combo} Streak
          </div>
        </div>
      )}
    </>
  );
}

interface PhaseGlyphProps {
  id: PhaseId;
}

export function PhaseGlyph({ id }: PhaseGlyphProps) {
  const common = { width: 28, height: 28 };
  if (id === "dawn")
    return (
      <svg {...common} viewBox="0 0 32 32">
        <circle cx="16" cy="22" r="7" fill="#f5a85a" />
        <line
          x1="16"
          y1="10"
          x2="16"
          y2="6"
          stroke="#f5a85a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="18"
          x2="4"
          y2="16"
          stroke="#f5a85a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="25"
          y1="18"
          x2="28"
          y2="16"
          stroke="#f5a85a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="4"
          y1="26"
          x2="28"
          y2="26"
          stroke="#6a4a2b"
          strokeWidth="1.5"
        />
      </svg>
    );
  if (id === "noon")
    return (
      <svg {...common} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="6" fill="#f5c850" />
        <g stroke="#e8a83a" strokeWidth="1.8" strokeLinecap="round">
          <line x1="16" y1="4" x2="16" y2="7" />
          <line x1="16" y1="25" x2="16" y2="28" />
          <line x1="4" y1="16" x2="7" y2="16" />
          <line x1="25" y1="16" x2="28" y2="16" />
          <line x1="7" y1="7" x2="9" y2="9" />
          <line x1="23" y1="23" x2="25" y2="25" />
          <line x1="25" y1="7" x2="23" y2="9" />
          <line x1="9" y1="23" x2="7" y2="25" />
        </g>
      </svg>
    );
  if (id === "dusk")
    return (
      <svg {...common} viewBox="0 0 32 32">
        <path d="M2 24 L30 24" stroke="#6a2840" strokeWidth="1.5" />
        <circle cx="16" cy="24" r="8" fill="#e8603a" />
        <path d="M8 24 L24 24" stroke="#fff" strokeWidth="0.5" opacity="0.4" />
      </svg>
    );
  return (
    <svg {...common} viewBox="0 0 32 32">
      <path
        d="M22 6 C14 6, 8 12, 8 20 C8 26, 14 30, 20 28 C14 26, 12 20, 16 14 C18 10, 22 8, 26 10 C26 8, 24 6, 22 6 Z"
        fill="#e8d4a0"
      />
      <circle cx="24" cy="10" r="0.6" fill="#e8d4a0" />
      <circle cx="6" cy="14" r="0.5" fill="#e8d4a0" />
      <circle cx="10" cy="6" r="0.4" fill="#e8d4a0" />
    </svg>
  );
}

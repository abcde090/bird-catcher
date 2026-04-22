import { useState } from "react";
import { useBirdStore } from "../../stores/useBirdStore";
import { useCollectionStore } from "../../stores/useCollectionStore";
import { useGameStore } from "../../stores/useGameStore";
import BirdImage from "./BirdImage";

interface DriftBird {
  i: number;
  bird: ReturnType<typeof useBirdStore.getState>["birds"][number];
  top: number;
  dur: number;
  delay: number;
  scale: number;
  dir: 1 | -1;
}

export default function TitleScreen() {
  const birds = useBirdStore((s) => s.birds);
  const highScore = useCollectionStore((s) => s.highScore);
  const discovered = useCollectionStore((s) => s.discovered);
  const startRound = useGameStore((s) => s.startRound);
  const setScreen = useGameStore((s) => s.setScreen);

  const [drift] = useState<DriftBird[]>(() =>
    birds.length === 0
      ? []
      : Array.from({ length: 8 }).map((_, i) => ({
          i,
          bird: birds[Math.floor(Math.random() * birds.length)],
          top: 15 + Math.random() * 60,
          dur: 14 + Math.random() * 10,
          delay: -Math.random() * 20,
          scale: 0.4 + Math.random() * 0.4,
          dir: Math.random() > 0.5 ? 1 : -1,
        })),
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, #f5d6a0 0%, #f0a86a 30%, #d8785a 55%, #8a4a5a 80%, #3a2838 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "35%",
          transform: "translate(-50%,-50%)",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #fde8b8 0%, #f5a85a 40%, transparent 70%)",
          boxShadow: "0 0 200px #f5a85a",
        }}
      />

      {drift.map((b) => (
        <div
          key={b.i}
          style={{
            position: "absolute",
            top: `${b.top}%`,
            left: b.dir > 0 ? "-100px" : "calc(100% + 100px)",
            animation: `title-drift-${b.dir > 0 ? "r" : "l"} ${b.dur}s linear infinite`,
            animationDelay: `${b.delay}s`,
            transform: `scale(${b.scale})`,
            opacity: 0.7,
          }}
        >
          <BirdImage bird={b.bird} size={72} facing={b.dir} />
        </div>
      ))}

      <svg
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        className="title-mountain"
        style={{
          position: "absolute",
          bottom: "18%",
          width: "100%",
          height: "28%",
          opacity: 0.9,
        }}
      >
        <path
          d="M0 200 L0 130 L100 60 L200 120 L320 70 L440 130 L560 50 L700 125 L840 80 L980 130 L1100 90 L1200 115 L1200 200 Z"
          fill="#1a0e1a"
        />
      </svg>
      <div
        className="title-ground"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "18%",
          background: "linear-gradient(to bottom, #0a0510, #000)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 40,
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "90vw" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.4em",
              color: "#fde8b8",
              textTransform: "uppercase",
              marginBottom: 16,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            An Australian Field Study
          </div>
          <h1
            className="title-heading"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(44px, 10vw, 112px)",
              fontWeight: 400,
              color: "#fff4e0",
              margin: 0,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              whiteSpace: "nowrap",
              fontVariationSettings: "'opsz' 144, 'SOFT' 100",
              textShadow:
                "0 6px 40px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.1)",
            }}
          >
            Birds at
          </h1>
          <h1
            className="title-heading"
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: "clamp(44px, 10vw, 112px)",
              fontWeight: 300,
              color: "#fde8b8",
              margin: 0,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              fontStyle: "italic",
              whiteSpace: "nowrap",
              fontVariationSettings: "'opsz' 144",
              textShadow: "0 6px 40px rgba(0,0,0,0.5)",
            }}
          >
            Golden Hour
          </h1>
          <div
            style={{
              marginTop: 20,
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              color: "#fff4e0cc",
              fontSize: 18,
              maxWidth: 520,
              margin: "20px auto 0",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            Catch native birds as they cross the sky. Study them. Fill the
            journal before dusk fades to night.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button className="btn btn-primary" onClick={startRound}>
            <span>Begin Round</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn btn-ghost" onClick={() => setScreen("guide")}>
            Field Journal
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 40,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "#fff4e0cc",
            textTransform: "uppercase",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          <div>
            <span style={{ opacity: 0.6 }}>Best</span>{" "}
            {highScore.toLocaleString()}
          </div>
          <div style={{ opacity: 0.3 }}>·</div>
          <div>
            <span style={{ opacity: 0.6 }}>Discovered</span> {discovered.size}/
            {birds.length}
          </div>
        </div>
      </div>
    </div>
  );
}

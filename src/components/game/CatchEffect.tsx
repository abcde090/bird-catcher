import { useGameStore } from "../../stores/useGameStore";

export default function CatchEffect() {
  const catchEffects = useGameStore((s) => s.catchEffects);
  return (
    <>
      {catchEffects.map((fx) => (
        <div
          key={fx.id}
          style={{
            position: "absolute",
            left: fx.x,
            top: fx.y,
            pointerEvents: "none",
            transform: "translate(-50%,-50%)",
            animation: "catch-pop 0.8s ease-out forwards",
            zIndex: 30,
          }}
        >
          <div
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 32,
              fontWeight: 600,
              color: "#fff",
              textShadow: `0 0 12px ${fx.color}, 0 3px 8px rgba(0,0,0,0.6)`,
            }}
          >
            +{fx.points}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.15em",
              color: "#fff",
              textAlign: "center",
              marginTop: 2,
              textTransform: "uppercase",
              textShadow: "0 2px 4px rgba(0,0,0,0.7)",
            }}
          >
            {fx.name}
          </div>
        </div>
      ))}
    </>
  );
}

import type { FlyingBird as FlyingBirdType } from "../../types/game";
import { RARITY } from "../../lib/game-config";
import BirdImage from "./BirdImage";

interface FlyingBirdProps {
  bird: FlyingBirdType;
}

export default function FlyingBird({ bird }: FlyingBirdProps) {
  const rarity = RARITY[bird.species.status];
  const size = 80 * rarity.sizeScale;
  // Intentional impure read: halo intensifies during the bite window, re-read
  // each render since the game loop updates bird positions every tick.
  // eslint-disable-next-line react-hooks/purity
  const nowS = performance.now() / 1000;
  const isBiting =
    bird.species.status === "critically_endangered" &&
    nowS >= bird.biteStart &&
    nowS <= bird.biteEnd;
  return (
    <div
      style={{
        position: "absolute",
        left: bird.x - size / 2,
        top: bird.y - size / 2,
        width: size,
        height: size,
        transform: `rotate(${bird.wobble}deg)`,
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: isBiting ? -22 : -12,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rarity.ring}${isBiting ? "cc" : "55"} 0%, transparent 70%)`,
          animation:
            rarity.label !== "Common"
              ? `bird-glow ${isBiting ? "0.4s" : "1.5s"} ease-in-out infinite alternate`
              : undefined,
        }}
      />
      <div
        style={{ animation: "bird-flap 0.25s ease-in-out infinite alternate" }}
      >
        <BirdImage
          bird={bird.species}
          size={size}
          facing={bird.direction}
          ring={rarity.ring}
        />
      </div>
    </div>
  );
}

import type { FlyingBird as FlyingBirdType } from "../../types/game";
import { RARITY } from "../../lib/game-config";
import BirdImage from "./BirdImage";

interface FlyingBirdProps {
  bird: FlyingBirdType;
  onCatch: (id: string, x: number, y: number) => void;
}

export default function FlyingBird({ bird, onCatch }: FlyingBirdProps) {
  const rarity = RARITY[bird.species.status];
  const size = 80 * rarity.sizeScale;
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onCatch(bird.id, e.clientX, e.clientY);
      }}
      style={{
        position: "absolute",
        left: bird.x - size / 2,
        top: bird.y - size / 2,
        width: size,
        height: size,
        cursor: "crosshair",
        transform: `rotate(${bird.wobble}deg)`,
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rarity.ring}55 0%, transparent 70%)`,
          animation:
            rarity.label !== "Common"
              ? "bird-glow 1.5s ease-in-out infinite alternate"
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

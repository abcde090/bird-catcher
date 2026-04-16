import type { FlyingBird as FlyingBirdType } from "../../types/game";
import { RARITY_CONFIG } from "../../lib/game-config";

interface Props {
  bird: FlyingBirdType;
  onClick: (birdId: string, x: number, y: number) => void;
}

export default function FlyingBird({ bird, onClick }: Props) {
  const rarity = RARITY_CONFIG[bird.species.conservationStatus];
  const size = rarity.size;
  const rotation = bird.direction === 1 ? 8 : -8;

  // Scale down slightly on mobile
  const displaySize = window.innerWidth < 768 ? Math.round(size * 0.8) : size;

  return (
    <button
      className="absolute cursor-pointer border-none bg-transparent p-0"
      style={{
        transform: `translate(${bird.x - displaySize / 2}px, ${bird.y - displaySize / 2}px) rotate(${rotation}deg)`,
        width: displaySize,
        height: displaySize,
        willChange: "transform",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(bird.id, e.clientX, e.clientY);
      }}
      aria-label={`Catch ${bird.species.commonName}`}
    >
      <img
        src={bird.species.imageUrl}
        alt={bird.species.commonName}
        className="h-full w-full rounded-full object-cover ring-2 ring-white/30"
        style={{
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
        draggable={false}
      />
    </button>
  );
}

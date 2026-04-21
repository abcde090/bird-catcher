import type { BirdSpecies } from "../../types/bird";

interface BirdImageProps {
  bird: BirdSpecies;
  size: number;
  facing: 1 | -1;
  ring?: string;
}

export default function BirdImage({ bird, size, facing, ring }: BirdImageProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #e8d4a8, #d4b888)",
        border: ring
          ? `2px solid ${ring}`
          : "1.5px solid rgba(138, 94, 32, 0.5)",
        boxShadow:
          "0 4px 10px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(253,232,184,0.15)",
        display: "block",
      }}
    >
      <img
        src={bird.imageUrl}
        alt={bird.name}
        width={size}
        height={size}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          transform: facing < 0 ? "scaleX(-1)" : "none",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

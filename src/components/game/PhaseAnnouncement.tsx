import { useEffect, useState, useRef } from "react";
import type { DayPhase } from "../../types/game";
import { PHASE_CONFIG } from "../../lib/game-config";

interface Props {
  phase: DayPhase;
}

export default function PhaseAnnouncement({ phase }: Props) {
  const [visible, setVisible] = useState(false);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (phase !== prevPhaseRef.current) {
      prevPhaseRef.current = phase;
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (!visible) return null;

  const config = PHASE_CONFIG[phase];

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="animate-phase-announce text-center">
        <span className="text-6xl">{config.emoji}</span>
        <h2 className="mt-2 font-serif text-6xl font-bold uppercase tracking-wider text-white drop-shadow-lg md:text-8xl">
          {config.label}
        </h2>
      </div>
    </div>
  );
}

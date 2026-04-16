import { useEffect, useState, useRef } from "react";
import { getComboMultiplier } from "../../lib/game-config";

interface Props {
  combo: number;
}

export default function ComboIndicator({ combo }: Props) {
  const [showBurst, setShowBurst] = useState(false);
  const prevComboRef = useRef(0);

  const multiplier = getComboMultiplier(combo);
  const prevMultiplier = getComboMultiplier(prevComboRef.current);

  useEffect(() => {
    if (multiplier > prevMultiplier && multiplier >= 2) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), 800);
      prevComboRef.current = combo;
      return () => clearTimeout(timer);
    }
    prevComboRef.current = combo;
  }, [combo, multiplier, prevMultiplier]);

  if (!showBurst || multiplier < 2) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-25 flex items-center justify-center">
      <div className="animate-combo-burst text-center">
        <p className="font-mono text-7xl font-black text-outback-gold drop-shadow-lg md:text-9xl">
          x{multiplier}
        </p>
        <p className="text-lg font-bold uppercase tracking-widest text-white drop-shadow-lg">
          Combo!
        </p>
      </div>
    </div>
  );
}

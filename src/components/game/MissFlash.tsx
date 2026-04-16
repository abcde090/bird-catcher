import { useEffect, useState, useRef } from "react";

interface Props {
  misses: number;
}

export default function MissFlash({ misses }: Props) {
  const [flash, setFlash] = useState(false);
  const prevMissesRef = useRef(misses);

  useEffect(() => {
    if (misses > prevMissesRef.current) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      prevMissesRef.current = misses;
      return () => clearTimeout(timer);
    }
    prevMissesRef.current = misses;
  }, [misses]);

  if (!flash) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 animate-screen-shake">
      <div className="absolute inset-0 border-4 border-red-500/60" />
      <div className="absolute inset-0 bg-red-500/10" />
    </div>
  );
}

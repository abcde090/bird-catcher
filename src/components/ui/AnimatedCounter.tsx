import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  label: string;
}

export default function AnimatedCounter({ value, label }: Props) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1500;
    startRef.current = 0;

    const animate = (timestamp: number) => {
      if (startRef.current === 0) {
        startRef.current = timestamp;
      }
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <div className="text-center">
      <p className="font-mono text-4xl font-bold text-eucalyptus-500">
        {display.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-bark-700">{label}</p>
    </div>
  );
}

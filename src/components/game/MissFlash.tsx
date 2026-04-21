interface MissFlashProps {
  trigger: number;
}

export default function MissFlash({ trigger }: MissFlashProps) {
  if (!trigger) return null;
  return (
    <div
      key={trigger}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        pointerEvents: "none",
        boxShadow: "inset 0 0 120px 30px rgba(196,69,42,0.5)",
        animation: "miss-flash 0.4s ease-out forwards",
      }}
    />
  );
}

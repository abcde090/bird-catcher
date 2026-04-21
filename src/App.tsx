import { useEffect } from "react";
import { useBirdStore } from "./stores/useBirdStore";
import { useGameStore } from "./stores/useGameStore";
import { useImagePreloader } from "./hooks/useImagePreloader";
import TitleScreen from "./components/game/TitleScreen";
import GameScreen from "./components/game/GameScreen";
import ResultsScreen from "./components/game/ResultsScreen";
import FieldGuide from "./components/game/FieldGuide";

export default function App() {
  const fetchBirds = useBirdStore((s) => s.fetchBirds);
  const birds = useBirdStore((s) => s.birds);
  const isLoading = useBirdStore((s) => s.isLoading);
  const screen = useGameStore((s) => s.screen);
  const { loaded: imagesLoaded } = useImagePreloader(birds);

  useEffect(() => {
    fetchBirds();
  }, [fetchBirds]);

  if (isLoading || !imagesLoaded) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a2e",
          color: "#fde8b8",
          fontFamily: "'Fraunces', serif",
          fontStyle: "italic",
          letterSpacing: "0.05em",
        }}
      >
        Loading field guide…
      </div>
    );
  }

  switch (screen) {
    case "title":
      return <TitleScreen />;
    case "guide":
      return <FieldGuide />;
    case "playing":
      return <GameScreen />;
    case "results":
      return <ResultsScreen />;
    default:
      return null;
  }
}

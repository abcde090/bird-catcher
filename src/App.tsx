import { useEffect, useCallback } from "react";
import { useBirdStore } from "./stores/useBirdStore";
import { useGameStore } from "./stores/useGameStore";
import { useImagePreloader } from "./hooks/useImagePreloader";
import TitleScreen from "./components/game/TitleScreen";
import GameScreen from "./components/game/GameScreen";
import ResultsScreen from "./components/game/ResultsScreen";
import FieldGuide from "./components/game/FieldGuide";

function App() {
  const fetchBirds = useBirdStore((s) => s.fetchBirds);
  const birds = useBirdStore((s) => s.birds);
  const isLoading = useBirdStore((s) => s.isLoading);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const startNewRound = useGameStore((s) => s.startNewRound);

  const { loaded: imagesLoaded } = useImagePreloader(birds);

  useEffect(() => {
    fetchBirds();
  }, [fetchBirds]);

  const handlePlay = useCallback(() => {
    startNewRound();
  }, [startNewRound]);

  const handleFieldGuide = useCallback(() => {
    setScreen("field-guide");
  }, [setScreen]);

  const handleBackToTitle = useCallback(() => {
    setScreen("title");
  }, [setScreen]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-sky">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-outback-gold border-t-transparent" />
      </div>
    );
  }

  switch (screen) {
    case "title":
      return (
        <TitleScreen
          onPlay={handlePlay}
          onFieldGuide={handleFieldGuide}
          imagesLoaded={imagesLoaded}
        />
      );
    case "playing":
    case "card-reveal":
      return <GameScreen />;
    case "results":
      return (
        <ResultsScreen
          onPlayAgain={handlePlay}
          onFieldGuide={handleFieldGuide}
        />
      );
    case "field-guide":
      return <FieldGuide onBack={handleBackToTitle} />;
    default:
      return null;
  }
}

export default App;

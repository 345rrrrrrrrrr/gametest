import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Loader } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { useGameState } from "./lib/stores/useGameState";
import { Controls, GamePhase } from "./types/game";
import "@fontsource/inter";

// UI Components
import GameMenu from "./components/ui/GameMenu";
import LevelSelectMenu from "./components/ui/LevelSelectMenu";
import GameModeMenu from "./components/ui/GameModeMenu";
import SettingsMenu from "./components/ui/SettingsMenu";
import PauseMenu from "./components/ui/PauseMenu";
import GameOverMenu from "./components/ui/GameOverMenu";

// Game Scene
import GameScene from "./components/game/GameScene";
import HUD from "./components/ui/HUD";

// Define control keys for the game
const keyboardControls = [
  { name: Controls.FORWARD, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.BACKWARD, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.LEFT, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.RIGHT, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.JUMP, keys: ["Space"] },
  { name: Controls.BOOST, keys: ["ShiftLeft", "ShiftRight"] },
  { name: Controls.INTERACT, keys: ["KeyE"] },
  { name: Controls.CAMERA_LEFT, keys: ["KeyQ"] },
  { name: Controls.CAMERA_RIGHT, keys: ["KeyE"] },
  { name: Controls.CAMERA_UP, keys: ["KeyR"] },
  { name: Controls.CAMERA_DOWN, keys: ["KeyF"] },
  { name: Controls.CAMERA_RESET, keys: ["KeyC"] },
  { name: Controls.PAUSE, keys: ["Escape"] }
];

// Sound Manager Component
const SoundManager = () => {
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();

  useEffect(() => {
    // Initialize audio elements
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    const hitSoundEffect = new Audio('/sounds/hit.mp3');
    const successSoundEffect = new Audio('/sounds/success.mp3');

    setBackgroundMusic(bgMusic);
    setHitSound(hitSoundEffect);
    setSuccessSound(successSoundEffect);

    console.log("Sound effects initialized");

    // Cleanup on unmount
    return () => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return null;
};

// Main App component
function App() {
  const gamePhase = useGameState(state => state.phase);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log("Game ready - Loading complete");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white">
      <KeyboardControls map={keyboardControls}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            {/* Game UI layer */}
            {gamePhase === GamePhase.MENU && <GameMenu />}
            {gamePhase === GamePhase.LEVEL_SELECT && <LevelSelectMenu />}
            {gamePhase === GamePhase.GAME_MODE_SELECT && <GameModeMenu />}
            {gamePhase === GamePhase.SETTINGS && <SettingsMenu />}
            
            {/* Game Canvas layer - only show when playing */}
            {(gamePhase === GamePhase.PLAYING || 
              gamePhase === GamePhase.PAUSED || 
              gamePhase === GamePhase.GAME_OVER ||
              gamePhase === GamePhase.LEVEL_COMPLETE) && (
              <>
                <Canvas
                  shadows
                  camera={{
                    position: [0, 10, 20],
                    fov: 60,
                    near: 0.1,
                    far: 1000
                  }}
                  gl={{
                    antialias: true,
                    powerPreference: "default"
                  }}
                >
                  <color attach="background" args={["#111111"]} />
                  <Suspense fallback={null}>
                    <GameScene />
                  </Suspense>
                </Canvas>
                
                {/* HUD overlay */}
                <HUD />
                
                {/* Game Pause Menu */}
                {gamePhase === GamePhase.PAUSED && <PauseMenu />}
                
                {/* Game Over Menu */}
                {gamePhase === GamePhase.GAME_OVER && <GameOverMenu />}
              </>
            )}
            
            {/* Sound Manager */}
            <SoundManager />
          </>
        )}
      </KeyboardControls>
    </div>
  );
}

export default App;

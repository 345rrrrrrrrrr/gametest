import { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import "@fontsource/inter";

// Import our game components
import PhysicsWorld from "./components/game/PhysicsWorld";
import Lighting from "./components/game/Lighting";
import MenuScreen from "./components/game/UI/MenuScreen";
import GameUI from "./components/game/UI/GameUI";
import LevelSelector from "./components/game/UI/LevelSelector";
import ControlPanel from "./components/game/UI/ControlPanel";

// Define control keys for the game
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  jump = 'jump',
  action = 'action',
  boost = 'boost',
  camera = 'camera',
}

// Define key mappings
const keyMap = [
  { name: Controls.forward, keys: ["KeyW", "ArrowUp"] },
  { name: Controls.backward, keys: ["KeyS", "ArrowDown"] },
  { name: Controls.leftward, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.rightward, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.jump, keys: ["Space"] },
  { name: Controls.action, keys: ["KeyE"] },
  { name: Controls.boost, keys: ["ShiftLeft", "ShiftRight"] },
  { name: Controls.camera, keys: ["KeyC"] },
];

// Main App component
function App() {
  const { phase } = useGame();
  const [showCanvas, setShowCanvas] = useState(false);
  const [ready, setReady] = useState(false);
  const audioStore = useAudio();

  // Initialize audio elements
  useEffect(() => {
    // Create and set up audio elements
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    
    const hitSound = new Audio("/sounds/hit.mp3");
    hitSound.volume = 0.3;
    
    const successSound = new Audio("/sounds/success.mp3");
    successSound.volume = 0.5;
    
    // Set the audio elements in the store
    audioStore.setBackgroundMusic(bgMusic);
    audioStore.setHitSound(hitSound);
    audioStore.setSuccessSound(successSound);
    
    console.log("Audio elements initialized");
    setReady(true);
  }, []);

  // Show the canvas once everything is loaded
  useEffect(() => {
    if (ready) {
      setShowCanvas(true);
      console.log("Canvas ready to render");
    }
  }, [ready]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      {showCanvas && (
        <KeyboardControls map={keyMap}>
          {phase === "ready" && <MenuScreen />}
          
          {phase === "level_select" && <LevelSelector />}
          
          {phase === "playing" && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 5, 15],
                  fov: 60,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  toneMapping: 3, // ACESFilmicToneMapping
                  outputEncoding: 3 // sRGBEncoding
                }}
              >
                <color attach="background" args={["#050505"]} />
                
                {/* Main lighting for the scene */}
                <Lighting />
                
                {/* Game environment with physics */}
                <Suspense fallback={null}>
                  <Physics
                    gravity={[0, -9.81, 0]}
                    interpolate={true}
                    timeStep={1/60}
                  >
                    <PhysicsWorld />
                  </Physics>
                </Suspense>
              </Canvas>
              
              {/* Game UI overlay */}
              <GameUI />
              
              {/* Control panel */}
              <ControlPanel />
            </>
          )}
          
          {phase === "ended" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
              <div className="bg-gray-800 p-8 rounded-lg text-center">
                <h1 className="text-3xl font-bold mb-4">Game Over</h1>
                <button 
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                  onClick={() => useGame.getState().restart()}
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;

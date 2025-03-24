import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/lib/stores/useAudio';
import { useGameState } from '@/lib/stores/useGameState';
import { GamePhase } from '@/types/game';
import { 
  Play, 
  Settings, 
  Trophy,
  Volume2, 
  VolumeX,
  HelpCircle,
  Github
} from 'lucide-react';

const GameMenu = () => {
  const { setPhase } = useGameState();
  const { isMuted, toggleMute, backgroundMusic } = useAudio();
  
  // Modal state
  const [showCredits, setShowCredits] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Start background music when menu is shown
  useEffect(() => {
    if (backgroundMusic) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.volume = 0.3;
      
      // Try to play the music (browsers may block autoplay)
      const playPromise = backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Autoplay prevented:", error);
        });
      }
    }
  }, [backgroundMusic]);
  
  const handleStartGame = () => {
    setPhase(GamePhase.GAME_MODE_SELECT);
  };
  
  const handleLevelSelect = () => {
    setPhase(GamePhase.LEVEL_SELECT);
  };
  
  const handleSettings = () => {
    setPhase(GamePhase.SETTINGS);
  };
  
  return (
    <div className="fixed inset-0 game-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Game title with animated glow */}
        <h1 className="game-title">PHYSICS SANDBOX</h1>
        
        <div className="glass-panel neon-border p-8">
          <div className="flex flex-col gap-4">
            <Button onClick={handleStartGame} className="menu-button">
              <Play className="mr-2" size={20} />
              Play
            </Button>
            
            <Button onClick={handleLevelSelect} className="menu-button">
              <Trophy className="mr-2" size={20} />
              Levels
            </Button>
            
            <Button onClick={handleSettings} className="menu-button">
              <Settings className="mr-2" size={20} />
              Settings
            </Button>
            
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowHelp(true)}
                className="bg-gray-800/70 hover:bg-gray-700/70"
              >
                <HelpCircle size={20} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCredits(true)}
                className="bg-gray-800/70 hover:bg-gray-700/70"
              >
                <Github size={20} />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                className="bg-gray-800/70 hover:bg-gray-700/70"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4 text-gray-400 text-sm">
          v1.0.0 - Use WASD to move, mouse to interact, Space to jump
        </div>
      </div>
      
      {/* Help Modal */}
      {showHelp && (
        <div className="overlay" onClick={() => setShowHelp(false)}>
          <div className="menu-container" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Controls:</h3>
                <ul className="list-disc pl-6">
                  <li>Click and drag balls to throw them</li>
                  <li>WASD or Arrow Keys to move camera</li>
                  <li>Space to create new balls</li>
                  <li>Esc to pause the game</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold">Game Modes:</h3>
                <ul className="list-disc pl-6">
                  <li><span className="font-semibold">Sandbox:</span> Play freely, no objectives</li>
                  <li><span className="font-semibold">Time Trial:</span> Complete objectives before time runs out</li>
                  <li><span className="font-semibold">Puzzle:</span> Solve physics puzzles</li>
                  <li><span className="font-semibold">Destruction:</span> Break as many objects as possible</li>
                </ul>
              </div>
            </div>
            <Button className="mt-6 w-full" onClick={() => setShowHelp(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
      
      {/* Credits Modal */}
      {showCredits && (
        <div className="overlay" onClick={() => setShowCredits(false)}>
          <div className="menu-container" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Credits</h2>
            <div className="space-y-4">
              <p>
                Physics Sandbox Game developed with React Three Fiber, Three.js, and custom physics.
              </p>
              <p>
                Sound effects obtained from various free sound libraries.
              </p>
              <p>
                Special thanks to the Three.js, React Three Fiber, and Zustand communities.
              </p>
            </div>
            <Button className="mt-6 w-full" onClick={() => setShowCredits(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameMenu;

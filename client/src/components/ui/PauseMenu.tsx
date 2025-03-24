import { useGameState } from '@/lib/stores/useGameState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { GamePhase } from '@/types/game';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  RotateCcw, 
  Home, 
  Settings,
  Volume2, 
  VolumeX
} from 'lucide-react';
import { useAudio } from '@/lib/stores/useAudio';

const PauseMenu = () => {
  const { setPhase } = useGameState();
  const { score, timeLeft } = useScoreState();
  const { currentLevel } = useLevelState();
  const { isMuted, toggleMute } = useAudio();
  
  const handleResume = () => {
    setPhase(GamePhase.PLAYING);
  };
  
  const handleRestart = () => {
    // Reset the level and start over
    setPhase(GamePhase.PLAYING);
  };
  
  const handleSettings = () => {
    setPhase(GamePhase.SETTINGS);
  };
  
  const handleMainMenu = () => {
    if (window.confirm('Are you sure you want to return to the main menu? Any unsaved progress will be lost.')) {
      setPhase(GamePhase.MENU);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel max-w-md w-full mx-4 p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Paused</h2>
        
        {currentLevel && (
          <div className="mb-6 text-center">
            <h3 className="text-xl mb-2">{currentLevel.name}</h3>
            <div className="flex justify-center gap-8 text-gray-300">
              <div>
                <div className="text-sm">Score</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              
              {timeLeft > 0 && (
                <div>
                  <div className="text-sm">Time</div>
                  <div className="text-xl font-bold">
                    {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
            onClick={handleResume}
          >
            <Play size={20} />
            Resume Game
          </Button>
          
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white"
            onClick={handleRestart}
          >
            <RotateCcw size={20} />
            Restart Level
          </Button>
          
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white"
            onClick={handleSettings}
          >
            <Settings size={20} />
            Settings
          </Button>
          
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 text-white"
            onClick={handleMainMenu}
          >
            <Home size={20} />
            Main Menu
          </Button>
          
          <div className="flex justify-center mt-4">
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
    </div>
  );
};

export default PauseMenu;

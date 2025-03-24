import { useGameState } from '@/lib/stores/useGameState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { GamePhase, GameMode } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Clock, 
  Shapes, 
  Bomb, 
  Puzzle, 
  Trophy
} from 'lucide-react';

const GameModeMenu = () => {
  const { setPhase, setMode } = useGameState();
  const { currentLevel } = useLevelState();
  
  const handleBackToLevelSelect = () => {
    setPhase(GamePhase.LEVEL_SELECT);
  };
  
  const handleSelectMode = (mode: GameMode) => {
    setMode(mode);
    setPhase(GamePhase.PLAYING);
  };
  
  // Check if current level supports selected game mode
  const isModeSupported = (mode: GameMode): boolean => {
    return currentLevel?.supportedGameModes.includes(mode) || false;
  };
  
  return (
    <div className="fixed inset-0 game-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="outline"
              onClick={handleBackToLevelSelect}
              className="bg-gray-800/70 hover:bg-gray-700/70"
            >
              <ChevronLeft className="mr-2" size={20} />
              Back
            </Button>
            
            <h2 className="text-2xl font-bold text-center">Select Game Mode</h2>
            
            <div className="w-[90px]"></div> {/* Empty div for flex spacing */}
          </div>
          
          {currentLevel && (
            <div className="mb-8 text-center">
              <h3 className="text-xl mb-1">{currentLevel.name}</h3>
              <div className="flex justify-center items-center gap-1 text-yellow-500">
                {Array.from({ length: currentLevel.difficulty }).map((_, i) => (
                  <Trophy key={i} size={14} />
                ))}
              </div>
              <p className="mt-2 text-gray-300">{currentLevel.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sandbox Mode */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                isModeSupported(GameMode.SANDBOX) 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                  : 'bg-gray-900/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => isModeSupported(GameMode.SANDBOX) && handleSelectMode(GameMode.SANDBOX)}
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Shapes size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Sandbox Mode</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Play freely with no time limits or objectives. Experiment with physics and have fun!
                  </p>
                  {!isModeSupported(GameMode.SANDBOX) && (
                    <div className="text-red-400 text-xs font-semibold">
                      Not available for this level
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Time Trial Mode */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                isModeSupported(GameMode.TIME_TRIAL) 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                  : 'bg-gray-900/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => isModeSupported(GameMode.TIME_TRIAL) && handleSelectMode(GameMode.TIME_TRIAL)}
            >
              <div className="flex items-start gap-4">
                <div className="bg-green-600 p-3 rounded-lg">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Time Trial</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Race against the clock! Complete objectives before time runs out.
                  </p>
                  {!isModeSupported(GameMode.TIME_TRIAL) && (
                    <div className="text-red-400 text-xs font-semibold">
                      Not available for this level
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Puzzle Mode */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                isModeSupported(GameMode.PUZZLE) 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                  : 'bg-gray-900/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => isModeSupported(GameMode.PUZZLE) && handleSelectMode(GameMode.PUZZLE)}
            >
              <div className="flex items-start gap-4">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Puzzle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Puzzle Mode</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Solve complex physics puzzles and complete all objectives to win.
                  </p>
                  {!isModeSupported(GameMode.PUZZLE) && (
                    <div className="text-red-400 text-xs font-semibold">
                      Not available for this level
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Destruction Mode */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:scale-105 ${
                isModeSupported(GameMode.DESTRUCTION) 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80' 
                  : 'bg-gray-900/50 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => isModeSupported(GameMode.DESTRUCTION) && handleSelectMode(GameMode.DESTRUCTION)}
            >
              <div className="flex items-start gap-4">
                <div className="bg-red-600 p-3 rounded-lg">
                  <Bomb size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Destruction Mode</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Destroy as many objects as possible and rack up a high score!
                  </p>
                  {!isModeSupported(GameMode.DESTRUCTION) && (
                    <div className="text-red-400 text-xs font-semibold">
                      Not available for this level
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="text-center mt-6 text-sm text-gray-400">
          Select a game mode to begin playing. Each mode offers a different experience!
        </div>
      </div>
    </div>
  );
};

export default GameModeMenu;

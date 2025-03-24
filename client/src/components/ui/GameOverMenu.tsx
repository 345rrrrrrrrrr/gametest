import { useGameState } from '@/lib/stores/useGameState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { GamePhase, GameMode } from '@/types/game';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  Home, 
  ChevronRight,
  Star, 
  Trophy,
  Award,
  Clock
} from 'lucide-react';

const GameOverMenu = () => {
  const { setPhase, mode } = useGameState();
  const { score, combo, timeLeft, distanceTraveled, obstaclesDestroyed, powerUpsCollected } = useScoreState();
  const { currentLevel, currentLevelIndex } = useLevelState();
  
  // Calculate stars based on score compared to thresholds in level data
  const getStars = (): number => {
    if (!currentLevel) return 0;
    
    const { scoreThresholds } = currentLevel;
    if (score >= scoreThresholds.gold) return 3;
    if (score >= scoreThresholds.silver) return 2;
    if (score >= scoreThresholds.bronze) return 1;
    return 0;
  };
  
  const stars = getStars();
  
  // Determine if level was completed successfully
  const isLevelCompleted = stars > 0 || mode === GameMode.SANDBOX;
  
  // Title and message based on completion status
  const title = isLevelCompleted ? "Level Complete!" : "Game Over";
  const message = isLevelCompleted 
    ? "Congratulations! You've completed this level."
    : "Better luck next time. Keep practicing!";
  
  const handleRestart = () => {
    setPhase(GamePhase.PLAYING);
  };
  
  const handleNextLevel = () => {
    setPhase(GamePhase.LEVEL_SELECT);
  };
  
  const handleMainMenu = () => {
    setPhase(GamePhase.MENU);
  };
  
  // Generate stats display based on game mode
  const renderStats = () => {
    switch (mode) {
      case GameMode.TIME_TRIAL:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Time Left</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                <Clock size={16} className="text-blue-400" />
                {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Score</div>
              <div className="text-xl font-bold">{score}</div>
            </div>
          </div>
        );
        
      case GameMode.DESTRUCTION:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Obstacles Destroyed</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                <Bomb size={16} className="text-red-400" />
                {obstaclesDestroyed}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Max Combo</div>
              <div className="text-xl font-bold">{combo}x</div>
            </div>
          </div>
        );
        
      case GameMode.PUZZLE:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Power-ups Collected</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                <Zap size={16} className="text-yellow-400" />
                {powerUpsCollected}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Score</div>
              <div className="text-xl font-bold">{score}</div>
            </div>
          </div>
        );
        
      default: // Sandbox
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Distance Traveled</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                <Route size={16} className="text-green-400" />
                {Math.round(distanceTraveled)}m
              </div>
            </div>
            <div className="text-center p-3 bg-gray-800/60 rounded-lg">
              <div className="text-sm text-gray-300">Score</div>
              <div className="text-xl font-bold">{score}</div>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel max-w-md w-full mx-4 p-8">
        <h2 className="text-3xl font-bold text-center mb-2">{title}</h2>
        <p className="text-center text-gray-300 mb-6">{message}</p>
        
        {isLevelCompleted && (
          <div className="flex justify-center mb-6">
            {[1, 2, 3].map((i) => (
              <Star 
                key={i}
                size={40} 
                className={`${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} mx-2 transition-all ${i <= stars ? 'scale-110' : 'scale-100'}`} 
              />
            ))}
          </div>
        )}
        
        <div className="mb-8 space-y-6">
          {renderStats()}
          
          <div className="text-center p-4 bg-gray-800/60 rounded-lg">
            <div className="text-sm text-gray-300">Final Score</div>
            <div className="text-3xl font-bold">{score}</div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
            onClick={handleRestart}
          >
            <RotateCcw size={20} />
            Play Again
          </Button>
          
          {isLevelCompleted && (
            <Button 
              className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white"
              onClick={handleNextLevel}
            >
              Next Level
              <ChevronRight size={20} />
            </Button>
          )}
          
          <Button 
            className="w-full py-3 px-6 font-semibold flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white"
            onClick={handleMainMenu}
          >
            <Home size={20} />
            Main Menu
          </Button>
        </div>
      </div>
    </div>
  );
};

// Icons for stats
const Zap = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const Bomb = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="14" r="8"/>
    <path d="m16 6-4 4-4-4"/>
    <path d="m8 2 4 4 4-4"/>
  </svg>
);

const Route = ({ size, className }: { size: number, className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>
);

export default GameOverMenu;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGameState } from '@/lib/stores/useGameState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { GamePhase } from '@/types/game';
import { levels } from '@/lib/levels/levelDefinitions';
import { 
  ChevronLeft, 
  Lock, 
  Star, 
  Trophy, 
  Clock
} from 'lucide-react';

const LevelSelectMenu = () => {
  const { setPhase } = useGameState();
  const { setCurrentLevelIndex } = useLevelState();
  const [currentWorld, setCurrentWorld] = useState(0);
  
  // Calculate progress based on unlocked levels (in a real game, this would come from save data)
  const unlockedLevels = 5; // Example: First 5 levels are unlocked
  
  // Group levels by world (10 levels per world)
  const worldCount = Math.ceil(levels.length / 10);
  const worldLevels = Array.from({ length: worldCount }, (_, i) => 
    levels.slice(i * 10, (i + 1) * 10)
  );
  
  const handleBackToMenu = () => {
    setPhase(GamePhase.MENU);
  };
  
  const handleSelectLevel = (levelIndex: number) => {
    // Check if level is unlocked
    if (levelIndex < unlockedLevels) {
      setCurrentLevelIndex(levelIndex);
      setPhase(GamePhase.GAME_MODE_SELECT);
    }
  };
  
  const handlePrevWorld = () => {
    if (currentWorld > 0) {
      setCurrentWorld(currentWorld - 1);
    }
  };
  
  const handleNextWorld = () => {
    if (currentWorld < worldCount - 1) {
      setCurrentWorld(currentWorld + 1);
    }
  };
  
  return (
    <div className="fixed inset-0 game-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="glass-panel p-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleBackToMenu}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gray-800/70 hover:bg-gray-700/70 py-2 px-4"
              style={{cursor: 'pointer'}}
            >
              <ChevronLeft className="mr-2" size={20} />
              Back
            </button>
            
            <h2 className="text-2xl font-bold text-center">
              World {currentWorld + 1}: {worldNames[currentWorld] || "Unknown"}
            </h2>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrevWorld}
                disabled={currentWorld === 0}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gray-800/70 hover:bg-gray-700/70 disabled:opacity-50 h-9 w-9"
                style={{cursor: currentWorld === 0 ? 'default' : 'pointer'}}
              >
                &lt;
              </button>
              
              <button
                onClick={handleNextWorld}
                disabled={currentWorld === worldCount - 1}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gray-800/70 hover:bg-gray-700/70 disabled:opacity-50 h-9 w-9"
                style={{cursor: currentWorld === worldCount - 1 ? 'default' : 'pointer'}}
              >
                &gt;
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {worldLevels[currentWorld]?.map((level, index) => {
              const globalIndex = currentWorld * 10 + index;
              const isUnlocked = globalIndex < unlockedLevels;
              
              return (
                <Card 
                  key={globalIndex}
                  className={`p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${
                    isUnlocked 
                      ? 'bg-gray-800/80 hover:bg-gray-700/80 hover:scale-105' 
                      : 'bg-gray-900/50 opacity-70'
                  }`}
                  onClick={() => handleSelectLevel(globalIndex)}
                >
                  <div className="relative w-full aspect-square flex items-center justify-center mb-2 rounded-md overflow-hidden">
                    {isUnlocked ? (
                      <div className="w-16 h-16 flex items-center justify-center text-4xl font-bold">
                        {globalIndex + 1}
                      </div>
                    ) : (
                      <Lock size={32} className="opacity-70" />
                    )}
                  </div>
                  
                  <div className="font-semibold text-sm line-clamp-1">
                    {level.name}
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs text-gray-300">
                    <div className="flex">
                      {Array.from({ length: level.difficulty }).map((_, i) => (
                        <Star key={i} size={12} className="fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    
                    {isUnlocked && level.settings.timeLimit && (
                      <div className="ml-2 flex items-center">
                        <Clock size={12} className="mr-1" />
                        {Math.floor(level.settings.timeLimit / 60)}:{String(level.settings.timeLimit % 60).padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-between mt-6 px-4">
          <div className="text-sm text-gray-400">
            Unlocked: {unlockedLevels}/{levels.length} levels
          </div>
          
          <div className="flex items-center text-sm text-gray-400">
            <Trophy size={16} className="mr-1 text-yellow-500" />
            Total Score: 12,500
          </div>
        </div>
      </div>
    </div>
  );
};

// Sample world names
const worldNames = [
  "Tutorial Plains",
  "Gravity Hills",
  "Momentum Valley",
  "Obstacle Mountains",
  "Challenge Peaks"
];

export default LevelSelectMenu;

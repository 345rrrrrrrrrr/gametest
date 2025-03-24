import { useState, useEffect } from 'react';
import { useLevel } from '../../../lib/stores/useLevel';
import { useGame } from '../../../lib/stores/useGame';
import { useScore } from '../../../lib/stores/useScore';

interface LevelInfo {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  unlocked: boolean;
  completed: boolean;
  bestScore?: number;
  bestTime?: number;
  image?: string;
}

const LevelSelector = () => {
  const level = useLevel();
  const game = useGame();
  const score = useScore();
  
  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Initialize with predefined levels
  useEffect(() => {
    const levelsData: LevelInfo[] = [
      {
        id: 1,
        name: "Sandbox Arena",
        difficulty: "easy",
        description: "An open sandbox to experiment with physics and objects. No objectives, just fun!",
        unlocked: true,
        completed: true,
        bestScore: 0,
        bestTime: 0
      },
      {
        id: 2,
        name: "Obstacle Course",
        difficulty: "easy",
        description: "Navigate through a series of obstacles using physics interactions.",
        unlocked: true,
        completed: false
      },
      {
        id: 3,
        name: "Tower Collapse",
        difficulty: "medium",
        description: "Use the minimum number of balls to collapse the entire tower structure.",
        unlocked: true,
        completed: false
      },
      {
        id: 4,
        name: "Domino Effect",
        difficulty: "medium",
        description: "Set up a chain reaction that triggers a sequence of events.",
        unlocked: true,
        completed: false
      },
      {
        id: 5,
        name: "Gravity Wells",
        difficulty: "hard",
        description: "Navigate through areas with changing gravity fields and avoid obstacles.",
        unlocked: false,
        completed: false
      },
      {
        id: 6,
        name: "Pendulum Maze",
        difficulty: "hard",
        description: "Find your way through swinging pendulums that create a dynamic maze.",
        unlocked: false,
        completed: false
      },
      {
        id: 7,
        name: "Power-Up Frenzy",
        difficulty: "medium",
        description: "Use various power-ups to navigate through challenges and reach the goal.",
        unlocked: false,
        completed: false
      },
      {
        id: 8,
        name: "Destruction Derby",
        difficulty: "expert",
        description: "Cause maximum destruction with limited resources in this physics playground.",
        unlocked: false,
        completed: false
      },
      {
        id: 9,
        name: "Time Trial Circuit",
        difficulty: "expert",
        description: "Race against the clock through a complex obstacle course with precision.",
        unlocked: false,
        completed: false
      }
    ];
    
    setLevels(levelsData);
    setSelectedLevel(levelsData[0]);
  }, []);
  
  const startLevel = (levelId: number) => {
    setLoading(true);
    
    // Reset scores
    score.reset();
    
    // Set current level
    level.setCurrentLevel(levelId);
    
    // Artificial delay for loading effect
    setTimeout(() => {
      game.start();
      setLoading(false);
    }, 600);
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'hard': return 'bg-orange-600';
      case 'expert': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };
  
  return (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Level Selection</h2>
          <button 
            onClick={() => game.restart()}
            className="text-gray-300 hover:text-white"
          >
            Back to Menu
          </button>
        </div>
        
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white p-10">
            <h3 className="text-xl mb-4">Loading Level {selectedLevel?.id}: {selectedLevel?.name}</h3>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: '100%' }}></div>
            </div>
            <p className="mt-4 text-gray-400">Preparing physics environment...</p>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Level grid */}
            <div className="w-2/3 p-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                {levels.map(lvl => (
                  <button
                    key={lvl.id}
                    className={`p-4 rounded-lg text-left transition-all ${
                      lvl.unlocked 
                        ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' 
                        : 'bg-gray-800 opacity-60 cursor-not-allowed'
                    } ${selectedLevel?.id === lvl.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => lvl.unlocked && setSelectedLevel(lvl)}
                    disabled={!lvl.unlocked}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-white font-semibold">{lvl.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(lvl.difficulty)}`}>
                        {lvl.difficulty}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full ${lvl.completed ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                        <span className="text-xs text-gray-300 ml-2">
                          {lvl.completed ? 'Completed' : 'Not Completed'}
                        </span>
                      </div>
                      
                      {lvl.bestScore !== undefined && (
                        <p className="text-xs text-gray-400 mt-1">
                          Best Score: {lvl.bestScore.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    {!lvl.unlocked && (
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                          <path d="M19 11H5V21H19V11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 9V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Locked
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Level details */}
            {selectedLevel && (
              <div className="w-1/3 bg-gray-750 border-l border-gray-700 p-6 overflow-y-auto">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Level {selectedLevel.id}: {selectedLevel.name}
                </h3>
                
                <div className={`inline-block px-2 py-1 rounded text-xs text-white mb-4 ${getDifficultyColor(selectedLevel.difficulty)}`}>
                  {selectedLevel.difficulty.charAt(0).toUpperCase() + selectedLevel.difficulty.slice(1)} Difficulty
                </div>
                
                <p className="text-gray-300 mb-6">
                  {selectedLevel.description}
                </p>
                
                {selectedLevel.completed && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-2">Your Stats</h4>
                    <div className="bg-gray-700 rounded-lg p-3">
                      {selectedLevel.bestScore !== undefined && (
                        <p className="text-sm text-gray-300">Best Score: {selectedLevel.bestScore.toLocaleString()}</p>
                      )}
                      {selectedLevel.bestTime !== undefined && (
                        <p className="text-sm text-gray-300">Best Time: {Math.floor(selectedLevel.bestTime / 60)}:{(selectedLevel.bestTime % 60).toString().padStart(2, '0')}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-white mb-2">Level Features</h4>
                  <ul className="text-sm text-gray-300">
                    <li className="flex items-center mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      {selectedLevel.id % 3 === 0 ? 'Special power-ups' : 'Standard physics objects'}
                    </li>
                    <li className="flex items-center mb-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      {selectedLevel.id % 2 === 0 ? 'Time challenges' : 'Free exploration'}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                      {selectedLevel.difficulty === 'hard' || selectedLevel.difficulty === 'expert' ? 'Advanced physics mechanics' : 'Basic physics concepts'}
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => startLevel(selectedLevel.id)}
                  disabled={!selectedLevel.unlocked}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                    selectedLevel.unlocked 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedLevel.unlocked ? 'Start Level' : 'Level Locked'}
                </button>
                
                {!selectedLevel.unlocked && (
                  <p className="text-sm text-gray-400 mt-2 text-center">
                    Complete previous levels to unlock
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelSelector;

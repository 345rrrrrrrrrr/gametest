import { useState, useEffect } from 'react';
import { usePhysics } from '../../../lib/stores/usePhysics';
import { useScore } from '../../../lib/stores/useScore';
import { useGame } from '../../../lib/stores/useGame';
import { useLevel } from '../../../lib/stores/useLevel';
import ScoreDisplay from './ScoreDisplay';

const GameUI = () => {
  const physics = usePhysics();
  const score = useScore();
  const game = useGame();
  const level = useLevel();
  
  const [fps, setFps] = useState(0);
  const [objectCount, setObjectCount] = useState({ balls: 0, obstacles: 0, powerUps: 0 });
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  
  // Track FPS and object counts
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateStats = () => {
      // Update FPS
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
        
        // Update object counts
        setObjectCount({
          balls: physics.getBalls().length,
          obstacles: physics.getObstacles().length,
          powerUps: physics.getPowerUps().length
        });
        
        // Update active effects
        setActiveEffects(physics.getActiveEffects());
      }
      
      // Update game timer
      if (game.phase === 'playing') {
        setGameTime(prev => prev + 1/60);
      }
      
      requestAnimationFrame(updateStats);
    };
    
    const statsId = requestAnimationFrame(updateStats);
    
    // Pause menu toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPauseMenu(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      cancelAnimationFrame(statsId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [physics, game.phase]);
  
  // Format time as mm:ss
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <>
      {/* Top bar with score and level info */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-4 text-white">
        <div className="bg-gray-800 bg-opacity-75 p-3 rounded-lg">
          <h3 className="text-lg font-bold">Level {level.currentLevel}</h3>
          <p className="text-sm">{level.currentLevelData.name || 'Custom Level'}</p>
          <p className="text-sm mt-1">Time: {formatTime(gameTime)}</p>
        </div>
        
        <ScoreDisplay />
        
        <div className="bg-gray-800 bg-opacity-75 p-3 rounded-lg">
          <p className="text-sm">FPS: {fps}</p>
          <p className="text-sm">Balls: {objectCount.balls}</p>
          <p className="text-sm">Obstacles: {objectCount.obstacles}</p>
        </div>
      </div>
      
      {/* Active effects display */}
      {activeEffects.length > 0 && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-75 py-2 px-4 rounded-lg text-white">
          <p className="text-center font-bold">Active Effects</p>
          <div className="flex gap-2 justify-center mt-1">
            {activeEffects.map(effect => (
              <span 
                key={effect} 
                className="inline-block py-1 px-2 bg-blue-700 rounded text-xs"
              >
                {effect}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Objective display */}
      <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-75 p-3 rounded-lg text-white">
        <h3 className="text-sm font-bold">Objective</h3>
        <p className="text-xs">{level.currentLevelData.objective || 'Experiment with physics!'}</p>
        <div className="mt-2">
          <div className="h-1 bg-gray-700 rounded-full w-32">
            <div 
              className="h-1 bg-green-500 rounded-full"
              style={{ width: `${level.progress}%` }}
            ></div>
          </div>
          <p className="text-xs mt-1">Progress: {Math.round(level.progress)}%</p>
        </div>
      </div>
      
      {/* Pause menu */}
      {showPauseMenu && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-80">
            <h2 className="text-2xl font-bold mb-4 text-center">Game Paused</h2>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowPauseMenu(false)}
                className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
              >
                Resume Game
              </button>
              
              <button
                onClick={() => level.reloadLevel()}
                className="w-full bg-gray-600 py-2 rounded hover:bg-gray-700"
              >
                Restart Level
              </button>
              
              <button
                onClick={() => {
                  game.restart();
                  setShowPauseMenu(false);
                }}
                className="w-full bg-red-600 py-2 rounded hover:bg-red-700"
              >
                Quit to Menu
              </button>
            </div>
            
            <div className="mt-4 text-xs text-center text-gray-400">
              Press ESC to resume
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameUI;

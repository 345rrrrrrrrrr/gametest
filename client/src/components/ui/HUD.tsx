import { useState, useEffect } from 'react';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useGameState } from '@/lib/stores/useGameState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { GameMode } from '@/types/game';
import { 
  Clock, 
  Target, 
  Zap, 
  LayoutGrid, 
  Flame,
  ArrowUpCircle,
  XCircle
} from 'lucide-react';

const HUD = () => {
  const { score, combo, timeLeft } = useScoreState();
  const { mode } = useGameState();
  const { balls, activeBallIndex } = usePlayerState();
  
  // For power-up indicators
  const activeBall = balls[activeBallIndex];
  const activePowerUps = activeBall?.activePowerUps || [];
  
  // Combo animation
  const [showComboAnimation, setShowComboAnimation] = useState(false);
  const [previousCombo, setPreviousCombo] = useState(1);
  
  // Animate combo when it increases
  useEffect(() => {
    if (combo > previousCombo) {
      setShowComboAnimation(true);
      const timer = setTimeout(() => {
        setShowComboAnimation(false);
      }, 1000);
      
      setPreviousCombo(combo);
      return () => clearTimeout(timer);
    }
  }, [combo, previousCombo]);
  
  // Format time left as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Score Display */}
      <div className="absolute top-5 left-5 hud-panel">
        <div className="glass-panel py-2 px-4 flex items-center gap-2">
          <Target size={20} className="text-blue-400" />
          <span className="text-xl font-bold">{score}</span>
          
          {combo > 1 && (
            <div className={`ml-2 py-1 px-2 bg-blue-600/70 rounded-md text-white text-sm font-bold flex items-center ${showComboAnimation ? 'scale-110' : ''}`} style={{ transition: 'transform 0.2s' }}>
              <Flame size={14} className="mr-1" />
              {combo}x
            </div>
          )}
        </div>
      </div>
      
      {/* Time Left (for time trial mode) */}
      {mode === GameMode.TIME_TRIAL && (
        <div className="absolute top-5 right-5 hud-panel">
          <div className="glass-panel py-2 px-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-400" />
            <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      )}
      
      {/* Ball Count */}
      <div className="absolute bottom-5 left-5 hud-panel">
        <div className="glass-panel py-2 px-4 flex items-center gap-2">
          <LayoutGrid size={20} className="text-purple-400" />
          <span className="text-lg font-bold">{balls.length} Balls</span>
        </div>
      </div>
      
      {/* Active Power-ups */}
      {activePowerUps.length > 0 && (
        <div className="absolute bottom-5 right-5 hud-panel">
          <div className="glass-panel p-2 flex items-center gap-3">
            {activePowerUps.map((powerUp, index) => {
              // Calculate remaining time percentage
              const timePercentage = (powerUp.remainingTime / powerUp.duration) * 100;
              
              // Choose icon based on power-up type
              let icon;
              let color;
              
              switch (powerUp.type) {
                case 'speed_boost':
                  icon = <Zap size={20} />;
                  color = 'bg-yellow-500';
                  break;
                case 'gravity_flip':
                  icon = <ArrowUpCircle size={20} />;
                  color = 'bg-purple-500';
                  break;
                case 'ball_multiplier':
                  icon = <LayoutGrid size={20} />;
                  color = 'bg-green-500';
                  break;
                case 'size_increase':
                  icon = <Maximize size={20} />;
                  color = 'bg-orange-500';
                  break;
                case 'ghost':
                  icon = <Ghost size={20} />;
                  color = 'bg-blue-300';
                  break;
                default:
                  icon = <Zap size={20} />;
                  color = 'bg-blue-500';
              }
              
              return (
                <div key={index} className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800">
                    {icon}
                  </div>
                  
                  {/* Circular progress bar */}
                  <svg className="absolute inset-0 w-10 h-10 -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="18"
                      strokeWidth="3"
                      stroke={color}
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 18}`}
                      strokeDashoffset={`${2 * Math.PI * 18 * (1 - timePercentage / 100)}`}
                      className="transition-all duration-300"
                    />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Objectives (for puzzle and time trial modes) */}
      {(mode === GameMode.PUZZLE || mode === GameMode.TIME_TRIAL) && (
        <div className="absolute top-20 left-5 hud-panel">
          <div className="glass-panel py-2 px-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Target size={16} className="text-green-400" />
              Objectives
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Checkbox size={14} className="text-green-400" />
                <span>Collect 3 power-ups</span>
              </li>
              <li className="flex items-center gap-2">
                <Checkbox size={14} className="text-gray-400" />
                <span>Destroy all red targets</span>
              </li>
              <li className="flex items-center gap-2">
                <Checkbox size={14} className="text-gray-400" />
                <span>Reach the goal area</span>
              </li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Game Controls Help */}
      <div className="absolute bottom-20 right-5 hud-panel">
        <div className="glass-panel py-2 px-4 text-xs text-gray-300">
          <div className="mb-1 flex items-center">
            <span className="inline-block w-16">Click + Drag</span>
            <span>Throw Ball</span>
          </div>
          <div className="mb-1 flex items-center">
            <span className="inline-block w-16">Space</span>
            <span>Create Ball</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-16">Esc</span>
            <span>Pause Game</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom checkbox component
const Checkbox = ({ size, className }: { size: number, className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// Custom maximize component
const Maximize = ({ size, className }: { size: number, className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

// Custom ghost component
const Ghost = ({ size, className }: { size: number, className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 10h.01" />
    <path d="M15 10h.01" />
    <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z" />
  </svg>
);

export default HUD;

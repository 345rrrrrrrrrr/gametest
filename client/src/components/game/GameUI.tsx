import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UI_COLORS, TRANSITION_DURATION } from '@/lib/constants';
import { useGameState } from '@/lib/stores/useGameState';
import { useUIState } from '@/lib/stores/useUIState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { GamePhase, GameMode } from '@/types/game';
import HUD from '@/components/ui/HUD';
import PauseMenu from '@/components/ui/PauseMenu';
import GameOverMenu from '@/components/ui/GameOverMenu';

const GameUI = () => {
  const gamePhase = useGameState(state => state.phase);
  const gameMode = useGameState(state => state.mode);
  const showUI = useUIState(state => state.showUI);
  const showHUD = useUIState(state => state.showHUD);
  const showMenu = useUIState(state => state.showMenu);
  const score = useScoreState(state => state.score);
  const timeLeft = useScoreState(state => state.timeLeft);
  
  // Message system for game events
  const [message, setMessage] = useState('');
  const [messageVisible, setMessageVisible] = useState(false);
  
  const showMessage = (text: string, duration: number = 3000) => {
    setMessage(text);
    setMessageVisible(true);
    
    setTimeout(() => {
      setMessageVisible(false);
    }, duration);
  };
  
  // Handle game phase changes
  useEffect(() => {
    switch (gamePhase) {
      case GamePhase.PLAYING:
        showMessage('Level started!');
        break;
      case GamePhase.PAUSED:
        showMessage('Game paused');
        break;
      case GamePhase.LEVEL_COMPLETE:
        showMessage('Level completed!');
        break;
      case GamePhase.GAME_OVER:
        showMessage('Game over!');
        break;
      default:
        break;
    }
  }, [gamePhase]);
  
  // Don't show UI if disabled
  if (!showUI) return null;
  
  return createPortal(
    <>
      {/* Main HUD */}
      {showHUD && gamePhase === GamePhase.PLAYING && <HUD />}
      
      {/* Game pause menu */}
      {gamePhase === GamePhase.PAUSED && showMenu && <PauseMenu />}
      
      {/* Game over menu */}
      {gamePhase === GamePhase.GAME_OVER && showMenu && <GameOverMenu />}
      
      {/* Game message system */}
      <div 
        className={`fixed top-1/4 left-1/2 transform -translate-x-1/2 
                   glass-panel px-6 py-3 text-center text-white text-xl
                   transition-opacity duration-300 pointer-events-none
                   ${messageVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {message}
      </div>
      
      {/* Mode-specific UI elements */}
      {gameMode === GameMode.TIME_TRIAL && gamePhase === GamePhase.PLAYING && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 glass-panel px-4 py-2">
          <div className="text-center">
            <div className="text-lg font-bold">Time Left</div>
            <div className="text-2xl">{Math.ceil(timeLeft)}s</div>
          </div>
        </div>
      )}
      
      {/* Score indicator for certain modes */}
      {(gameMode === GameMode.DESTRUCTION || gameMode === GameMode.PUZZLE) && 
       gamePhase === GamePhase.PLAYING && (
        <div className="fixed top-5 right-5 glass-panel px-4 py-2">
          <div className="text-center">
            <div className="text-lg font-bold">Score</div>
            <div className="text-2xl">{score}</div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default GameUI;

// Missing import
import { useState } from 'react';

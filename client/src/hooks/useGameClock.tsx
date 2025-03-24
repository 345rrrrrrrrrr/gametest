import { useRef, useCallback } from 'react';
import { useGameState } from '@/lib/stores/useGameState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { GameMode, GamePhase } from '@/types/game';

export const useGameClock = () => {
  // References to track time
  const gameTime = useRef(0);
  const lastUpdate = useRef(0);
  const timeScale = useRef(1.0); // For slow-motion effects
  
  // Get game state
  const { phase, mode } = useGameState();
  const { timeLeft, setTimeLeft } = useScoreState();
  
  // Tick function to be called every frame
  const tick = useCallback((delta: number) => {
    // Only update when game is playing
    if (phase !== GamePhase.PLAYING) return;
    
    // Apply timeScale for slow-motion effects
    const scaledDelta = delta * timeScale.current;
    
    // Update game time
    gameTime.current += scaledDelta;
    lastUpdate.current = Date.now();
    
    // Time Trial mode has a countdown
    if (mode === GameMode.TIME_TRIAL && timeLeft > 0) {
      setTimeLeft(timeLeft - scaledDelta);
    }
  }, [phase, mode, timeLeft, setTimeLeft]);
  
  // Set time scale (e.g., for slow-motion power-up)
  const setTimeScale = useCallback((scale: number) => {
    timeScale.current = Math.max(0.1, Math.min(2.0, scale));
  }, []);
  
  // Reset the game clock
  const resetClock = useCallback(() => {
    gameTime.current = 0;
    lastUpdate.current = Date.now();
    timeScale.current = 1.0;
  }, []);
  
  // Get elapsed time since start
  const getElapsedTime = useCallback(() => {
    return gameTime.current;
  }, []);
  
  // Get time since last update
  const getTimeSinceLastUpdate = useCallback(() => {
    return (Date.now() - lastUpdate.current) / 1000;
  }, []);
  
  // Get current time scale
  const getTimeScale = useCallback(() => {
    return timeScale.current;
  }, []);
  
  return {
    tick,
    setTimeScale,
    resetClock,
    getElapsedTime,
    getTimeSinceLastUpdate,
    getTimeScale
  };
};

export default useGameClock;

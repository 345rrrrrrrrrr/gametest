import * as THREE from 'three';
import { GamePhase } from '@/types/game';
import { LevelData } from '@/types/level';

// Interface for Time Trial game mode
export interface TimeTrialState {
  timeRemaining: number;
  checkpoints: THREE.Vector3[];
  checkpointsReached: number[];
  bestLapTime: number | null;
  currentLapStartTime: number | null;
  laps: number;
  targetLaps: number;
}

/**
 * Initialize the Time Trial game mode for a level
 */
export function initTimeTrialMode(level: LevelData): TimeTrialState {
  // Create checkpoints based on the level
  const checkpoints: THREE.Vector3[] = [];
  
  // Use collectibles as checkpoints if available
  if (level.collectibles && level.collectibles.positions.length > 0) {
    checkpoints.push(...level.collectibles.positions);
  } else {
    // Otherwise create some default checkpoints
    const radius = 20;
    const count = 5;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      checkpoints.push(new THREE.Vector3(x, 0.5, z));
    }
  }
  
  // Initialize the game state
  return {
    timeRemaining: level.settings.timeLimit || 120,
    checkpoints,
    checkpointsReached: [],
    bestLapTime: null,
    currentLapStartTime: null,
    laps: 0,
    targetLaps: 3
  };
}

/**
 * Update the Time Trial game mode state
 */
export function updateTimeTrialMode(
  state: TimeTrialState,
  deltaTime: number,
  ballPositions: THREE.Vector3[],
  setGamePhase: (phase: GamePhase) => void
): TimeTrialState {
  // Update time remaining
  const timeRemaining = state.timeRemaining - deltaTime;
  
  // Check if time has run out
  if (timeRemaining <= 0) {
    setGamePhase(GamePhase.GAME_OVER);
    return { ...state, timeRemaining: 0 };
  }
  
  // Start the lap timer if not already started
  let currentLapStartTime = state.currentLapStartTime;
  if (currentLapStartTime === null) {
    currentLapStartTime = Date.now();
  }
  
  // Check for checkpoints reached
  const checkpointsReached = [...state.checkpointsReached];
  let allBalls = ballPositions;
  
  // Check if any ball has reached a checkpoint
  state.checkpoints.forEach((checkpoint, index) => {
    // Skip if already reached in this lap
    if (checkpointsReached.includes(index)) return;
    
    // Check if any ball is close to this checkpoint
    const ballReachedCheckpoint = allBalls.some(position => {
      const distance = position.distanceTo(checkpoint);
      return distance < 2; // 2 units radius for checkpoint
    });
    
    if (ballReachedCheckpoint) {
      checkpointsReached.push(index);
    }
  });
  
  // Check if all checkpoints have been reached (lap complete)
  let laps = state.laps;
  let bestLapTime = state.bestLapTime;
  
  if (checkpointsReached.length === state.checkpoints.length) {
    // Complete a lap
    laps++;
    
    // Calculate lap time
    const lapTime = (Date.now() - (currentLapStartTime || 0)) / 1000;
    
    // Update best lap time
    if (bestLapTime === null || lapTime < bestLapTime) {
      bestLapTime = lapTime;
    }
    
    // Reset for next lap
    checkpointsReached.length = 0;
    currentLapStartTime = Date.now();
    
    // Add some time bonus for completing a lap
    timeRemaining += 30;
    
    // Check if target laps reached
    if (laps >= state.targetLaps) {
      setGamePhase(GamePhase.LEVEL_COMPLETE);
    }
  }
  
  return {
    ...state,
    timeRemaining,
    checkpointsReached,
    bestLapTime,
    currentLapStartTime,
    laps
  };
}

/**
 * Calculate the score for Time Trial mode
 */
export function calculateTimeTrialScore(state: TimeTrialState): number {
  // Base score from laps
  const lapScore = state.laps * 1000;
  
  // Bonus for best lap time (faster = better)
  const timeBonus = state.bestLapTime
    ? Math.max(0, 5000 - state.bestLapTime * 50)
    : 0;
  
  // Bonus for remaining time
  const timeRemainingBonus = state.timeRemaining * 10;
  
  return Math.floor(lapScore + timeBonus + timeRemainingBonus);
}

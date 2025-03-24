import * as THREE from 'three';
import { GamePhase } from '@/types/game';
import { LevelData } from '@/types/level';

// Interface for Destruction game mode
export interface DestructionState {
  timeRemaining: number;
  objectsDestroyed: number;
  destroyedObjects: Set<string>;
  combo: number;
  maxCombo: number;
  lastDestroyTime: number | null;
  comboTimeWindow: number;
  explosionScale: number;
  goalReached: boolean;
}

/**
 * Initialize the Destruction game mode for a level
 */
export function initDestructionMode(level: LevelData): DestructionState {
  return {
    timeRemaining: level.settings.timeLimit || 60,
    objectsDestroyed: 0,
    destroyedObjects: new Set<string>(),
    combo: 1,
    maxCombo: 1,
    lastDestroyTime: null,
    comboTimeWindow: 2.5, // seconds
    explosionScale: 1.0,
    goalReached: false
  };
}

/**
 * Update the Destruction game mode state
 */
export function updateDestructionMode(
  state: DestructionState,
  deltaTime: number,
  setGamePhase: (phase: GamePhase) => void
): DestructionState {
  // Update time remaining
  const timeRemaining = state.timeRemaining - deltaTime;
  
  // Check if time has run out
  if (timeRemaining <= 0) {
    // Game over when time runs out
    setGamePhase(GamePhase.GAME_OVER);
    return { ...state, timeRemaining: 0 };
  }
  
  // Check combo timeout
  let combo = state.combo;
  if (state.lastDestroyTime !== null) {
    const timeSinceDestroy = (Date.now() - state.lastDestroyTime) / 1000;
    if (timeSinceDestroy > state.comboTimeWindow) {
      // Reset combo if too much time has passed
      combo = 1;
    }
  }
  
  return {
    ...state,
    timeRemaining,
    combo
  };
}

/**
 * Register an object as destroyed
 */
export function registerObjectDestroyed(
  state: DestructionState,
  objectId: string,
  objectValue: number = 100
): DestructionState {
  // Skip if already counted
  if (state.destroyedObjects.has(objectId)) {
    return state;
  }
  
  // Add to destroyed set
  const destroyedObjects = new Set(state.destroyedObjects);
  destroyedObjects.add(objectId);
  
  // Increment counter
  const objectsDestroyed = state.objectsDestroyed + 1;
  
  // Check for chain destruction (combo)
  const now = Date.now();
  let combo = state.combo;
  let maxCombo = state.maxCombo;
  
  if (state.lastDestroyTime !== null) {
    const timeSinceDestroy = (now - state.lastDestroyTime) / 1000;
    if (timeSinceDestroy <= state.comboTimeWindow) {
      // Increment combo
      combo += 1;
      if (combo > maxCombo) {
        maxCombo = combo;
      }
    } else {
      // Reset combo
      combo = 1;
    }
  }
  
  // Calculate explosion scale based on combo
  const explosionScale = Math.min(3.0, 1.0 + (combo - 1) * 0.2);
  
  // Check if goal has been reached (based on level objective)
  // This would need to be adapted based on the specific level
  const goalReached = objectsDestroyed >= 20;
  
  return {
    ...state,
    objectsDestroyed,
    destroyedObjects,
    combo,
    maxCombo,
    lastDestroyTime: now,
    explosionScale,
    goalReached
  };
}

/**
 * Calculate bonus time for a destruction
 */
export function calculateTimeBonus(state: DestructionState): number {
  // Base time bonus
  const baseBonus = 1;
  
  // Combo multiplier (higher combo = more time)
  const comboMultiplier = Math.min(5, state.combo * 0.5);
  
  return baseBonus * comboMultiplier;
}

/**
 * Calculate the score for a destruction
 */
export function calculateDestructionScore(
  objectValue: number,
  combo: number,
  speedMultiplier: number = 1
): number {
  // Base score from object value
  const baseScore = objectValue;
  
  // Combo multiplier
  const comboMultiplier = combo;
  
  // Speed bonus (faster impacts = higher score)
  const speedBonus = Math.max(1, speedMultiplier);
  
  return Math.floor(baseScore * comboMultiplier * speedBonus);
}

/**
 * Calculate the total score for Destruction mode
 */
export function calculateTotalDestructionScore(state: DestructionState): number {
  // Base score from objects destroyed
  const destructionScore = state.objectsDestroyed * 100;
  
  // Combo bonus
  const comboBonus = state.maxCombo * 200;
  
  // Time remaining bonus
  const timeBonus = state.timeRemaining * 10;
  
  // Goal bonus
  const goalBonus = state.goalReached ? 2000 : 0;
  
  return Math.floor(destructionScore + comboBonus + timeBonus + goalBonus);
}

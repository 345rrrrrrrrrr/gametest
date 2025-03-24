import * as THREE from 'three';
import { GamePhase } from '@/types/game';
import { LevelData, LevelObjective } from '@/types/level';

// Interface for Puzzle game mode
export interface PuzzleState {
  objectives: LevelObjective[];
  timeRemaining: number | null; // null if no time limit
  collectiblesCollected: string[];
  triggerActivated: Record<string, boolean>;
  sequencesCompleted: Record<string, boolean>;
  puzzleCompleted: boolean;
}

/**
 * Initialize the Puzzle game mode for a level
 */
export function initPuzzleMode(level: LevelData): PuzzleState {
  return {
    objectives: level.objectives.map(obj => ({
      ...obj,
      progressCurrent: 0
    })),
    timeRemaining: level.settings.timeLimit || null,
    collectiblesCollected: [],
    triggerActivated: {},
    sequencesCompleted: {},
    puzzleCompleted: false
  };
}

/**
 * Update the Puzzle game mode state
 */
export function updatePuzzleMode(
  state: PuzzleState,
  deltaTime: number,
  ballPositions: THREE.Vector3[],
  triggers: Record<string, THREE.Vector3>,
  setGamePhase: (phase: GamePhase) => void
): PuzzleState {
  // Update time if time limit exists
  let timeRemaining = state.timeRemaining;
  if (timeRemaining !== null) {
    timeRemaining -= deltaTime;
    
    // Check for time out
    if (timeRemaining <= 0) {
      setGamePhase(GamePhase.GAME_OVER);
      return { ...state, timeRemaining: 0 };
    }
  }
  
  // Check if all required objectives are complete
  const allRequiredObjectivesComplete = state.objectives
    .filter(obj => !obj.optional)
    .every(obj => obj.progressCurrent >= obj.target);
  
  // Set puzzle as completed if all required objectives are done
  let puzzleCompleted = allRequiredObjectivesComplete;
  
  // If puzzle is complete, move to level complete phase
  if (puzzleCompleted && !state.puzzleCompleted) {
    setGamePhase(GamePhase.LEVEL_COMPLETE);
  }
  
  // Check for triggers
  const triggerActivated = { ...state.triggerActivated };
  
  Object.entries(triggers).forEach(([triggerId, triggerPosition]) => {
    // Skip if already activated (unless it's a repeatable trigger)
    if (triggerActivated[triggerId]) return;
    
    // Check if any ball is within the trigger area
    const isTriggered = ballPositions.some(ballPos => {
      const distance = ballPos.distanceTo(triggerPosition);
      return distance < 2; // 2 units activation radius
    });
    
    if (isTriggered) {
      triggerActivated[triggerId] = true;
      
      // Update any objectives related to triggers
      // This would need to be expanded based on the specific puzzle mechanics
    }
  });
  
  return {
    ...state,
    timeRemaining,
    triggerActivated,
    puzzleCompleted
  };
}

/**
 * Update objective progress
 */
export function updateObjectiveProgress(
  state: PuzzleState,
  objectiveId: string,
  increment: number = 1
): PuzzleState {
  const objectives = state.objectives.map(obj => {
    if (obj.id === objectiveId) {
      const newProgress = Math.min(obj.target, obj.progressCurrent + increment);
      return { ...obj, progressCurrent: newProgress };
    }
    return obj;
  });
  
  return { ...state, objectives };
}

/**
 * Check if all objectives of a certain type are completed
 */
export function areObjectivesOfTypeCompleted(
  state: PuzzleState,
  type: string,
  includeOptional: boolean = false
): boolean {
  const relevantObjectives = state.objectives.filter(
    obj => obj.type === type && (includeOptional || !obj.optional)
  );
  
  return relevantObjectives.every(obj => obj.progressCurrent >= obj.target);
}

/**
 * Calculate the score for Puzzle mode
 */
export function calculatePuzzleScore(state: PuzzleState): number {
  // Base score for completing required objectives
  const requiredObjectivesScore = state.objectives
    .filter(obj => !obj.optional)
    .reduce((score, obj) => {
      const completion = Math.min(1, obj.progressCurrent / obj.target);
      return score + (completion * 1000);
    }, 0);
  
  // Bonus score for optional objectives
  const optionalObjectivesScore = state.objectives
    .filter(obj => obj.optional)
    .reduce((score, obj) => {
      const completion = Math.min(1, obj.progressCurrent / obj.target);
      return score + (completion * 500);
    }, 0);
  
  // Time bonus if there was a time limit
  const timeBonus = state.timeRemaining !== null
    ? Math.max(0, state.timeRemaining) * 10
    : 0;
  
  // Completion bonus
  const completionBonus = state.puzzleCompleted ? 2000 : 0;
  
  return Math.floor(
    requiredObjectivesScore + 
    optionalObjectivesScore + 
    timeBonus + 
    completionBonus
  );
}

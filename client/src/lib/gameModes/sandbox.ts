import * as THREE from 'three';
import { GamePhase } from '@/types/game';
import { LevelData } from '@/types/level';

// Interface for Sandbox game mode
export interface SandboxState {
  ballCount: number;
  activeBallIndex: number;
  gravity: number;
  windEnabled: boolean;
  windDirection: THREE.Vector3;
  windStrength: number;
  magnetEnabled: boolean;
  magnetStrength: number;
  spawnedObstacles: {
    id: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    type: string;
    color: string;
  }[];
  isPlaying: boolean;
}

/**
 * Initialize the Sandbox game mode
 */
export function initSandboxMode(level: LevelData): SandboxState {
  return {
    ballCount: 0,
    activeBallIndex: -1,
    gravity: level.settings.gravity,
    windEnabled: false,
    windDirection: level.settings.windDirection.clone(),
    windStrength: level.settings.windStrength,
    magnetEnabled: false,
    magnetStrength: 0,
    spawnedObstacles: [],
    isPlaying: true
  };
}

/**
 * Update the Sandbox game mode state
 */
export function updateSandboxMode(
  state: SandboxState,
  deltaTime: number,
  totalBalls: number,
  activeIndex: number
): SandboxState {
  // Update ball count
  const ballCount = totalBalls;
  
  // Update active ball index
  const activeBallIndex = activeIndex;
  
  return {
    ...state,
    ballCount,
    activeBallIndex
  };
}

/**
 * Add an obstacle to the sandbox
 */
export function addObstacle(
  state: SandboxState,
  position: THREE.Vector3,
  type: string,
  color: string = '#58a5f0',
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
  rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
): SandboxState {
  const id = `obstacle_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  const newObstacle = {
    id,
    position: position.clone(),
    rotation: rotation.clone(),
    scale: scale.clone(),
    type,
    color
  };
  
  return {
    ...state,
    spawnedObstacles: [...state.spawnedObstacles, newObstacle]
  };
}

/**
 * Remove an obstacle from the sandbox
 */
export function removeObstacle(
  state: SandboxState,
  obstacleId: string
): SandboxState {
  return {
    ...state,
    spawnedObstacles: state.spawnedObstacles.filter(
      obstacle => obstacle.id !== obstacleId
    )
  };
}

/**
 * Update physics settings in sandbox
 */
export function updatePhysicsSettings(
  state: SandboxState,
  updates: Partial<SandboxState>
): SandboxState {
  return {
    ...state,
    ...updates
  };
}

/**
 * Toggle wind in sandbox
 */
export function toggleWind(
  state: SandboxState,
  enabled?: boolean
): SandboxState {
  const windEnabled = enabled !== undefined ? enabled : !state.windEnabled;
  
  return {
    ...state,
    windEnabled
  };
}

/**
 * Set wind parameters
 */
export function setWindParameters(
  state: SandboxState,
  direction: THREE.Vector3,
  strength: number
): SandboxState {
  return {
    ...state,
    windDirection: direction.clone(),
    windStrength: strength
  };
}

/**
 * Toggle magnet in sandbox
 */
export function toggleMagnet(
  state: SandboxState,
  enabled?: boolean
): SandboxState {
  const magnetEnabled = enabled !== undefined ? enabled : !state.magnetEnabled;
  
  return {
    ...state,
    magnetEnabled
  };
}

/**
 * Set magnet strength
 */
export function setMagnetStrength(
  state: SandboxState,
  strength: number
): SandboxState {
  return {
    ...state,
    magnetStrength: strength
  };
}

/**
 * Reset sandbox to default state
 */
export function resetSandbox(level: LevelData): SandboxState {
  return initSandboxMode(level);
}

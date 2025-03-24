import { create } from 'zustand';
import * as THREE from 'three';
import { 
  Obstacle, 
  PowerUp, 
  Terrain, 
  Collectible,
  Trigger 
} from '@/types/entities';
import { LevelData } from '@/types/level';

interface LevelState {
  // Level info
  currentLevel: LevelData | null;
  currentLevelIndex: number;
  allLevelsCompleted: boolean;
  
  // Level entities
  obstacles: Obstacle[];
  powerUps: PowerUp[];
  terrain: Terrain | null;
  collectibles: Collectible[];
  triggers: Trigger[];
  boundaries: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  } | null;
  
  // Actions
  setCurrentLevel: (level: LevelData) => void;
  setCurrentLevelIndex: (index: number) => void;
  setObstacles: (obstacles: Obstacle[]) => void;
  setPowerUps: (powerUps: PowerUp[]) => void;
  setTerrain: (terrain: Terrain) => void;
  setCollectibles: (collectibles: Collectible[]) => void;
  setTriggers: (triggers: Trigger[]) => void;
  setBoundaries: (boundaries: { min: THREE.Vector3; max: THREE.Vector3 }) => void;
  
  // Entity management
  addObstacle: (obstacle: Obstacle) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  removeObstacle: (id: string) => void;
  
  addPowerUp: (powerUp: PowerUp) => void;
  updatePowerUp: (id: string, updates: Partial<PowerUp>) => void;
  removePowerUp: (id: string) => void;
  
  addCollectible: (collectible: Collectible) => void;
  updateCollectible: (id: string, updates: Partial<Collectible>) => void;
  removeCollectible: (id: string) => void;
  
  resetLevel: () => void;
}

export const useLevelState = create<LevelState>((set) => ({
  // Initial state
  currentLevel: null,
  currentLevelIndex: -1,
  allLevelsCompleted: false,
  
  obstacles: [],
  powerUps: [],
  terrain: null,
  collectibles: [],
  triggers: [],
  boundaries: null,
  
  // Level management
  setCurrentLevel: (level) => set(() => ({ currentLevel: level })),
  
  setCurrentLevelIndex: (index) => set(() => ({ currentLevelIndex: index })),
  
  // Entity management
  setObstacles: (obstacles) => set(() => ({ obstacles })),
  
  setPowerUps: (powerUps) => set(() => ({ powerUps })),
  
  setTerrain: (terrain) => set(() => ({ terrain })),
  
  setCollectibles: (collectibles) => set(() => ({ collectibles })),
  
  setTriggers: (triggers) => set(() => ({ triggers })),
  
  setBoundaries: (boundaries) => set(() => ({ boundaries })),
  
  // Obstacle management
  addObstacle: (obstacle) => set((state) => ({
    obstacles: [...state.obstacles, obstacle]
  })),
  
  updateObstacle: (id, updates) => set((state) => ({
    obstacles: state.obstacles.map(
      obstacle => obstacle.id === id 
        ? { ...obstacle, ...updates } 
        : obstacle
    )
  })),
  
  removeObstacle: (id) => set((state) => ({
    obstacles: state.obstacles.filter(obstacle => obstacle.id !== id)
  })),
  
  // Power-up management
  addPowerUp: (powerUp) => set((state) => ({
    powerUps: [...state.powerUps, powerUp]
  })),
  
  updatePowerUp: (id, updates) => set((state) => ({
    powerUps: state.powerUps.map(
      powerUp => powerUp.id === id
        ? { ...powerUp, ...updates }
        : powerUp
    )
  })),
  
  removePowerUp: (id) => set((state) => ({
    powerUps: state.powerUps.filter(powerUp => powerUp.id !== id)
  })),
  
  // Collectible management
  addCollectible: (collectible) => set((state) => ({
    collectibles: [...state.collectibles, collectible]
  })),
  
  updateCollectible: (id, updates) => set((state) => ({
    collectibles: state.collectibles.map(
      collectible => collectible.id === id
        ? { ...collectible, ...updates }
        : collectible
    )
  })),
  
  removeCollectible: (id) => set((state) => ({
    collectibles: state.collectibles.filter(collectible => collectible.id !== id)
  })),
  
  // Level actions
  resetLevel: () => set((state) => {
    // Reset the level to its initial state but maintain which level we're on
    const currentLevel = state.currentLevel;
    const currentLevelIndex = state.currentLevelIndex;
    
    return {
      currentLevel,
      currentLevelIndex,
      obstacles: [],
      powerUps: [],
      terrain: null,
      collectibles: [],
      triggers: [],
      boundaries: null
    };
  })
}));

export default useLevelState;

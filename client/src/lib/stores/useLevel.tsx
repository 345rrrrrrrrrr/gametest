import { create } from 'zustand';
import * as THREE from 'three';
import { usePhysics } from './usePhysics';
import { useScore } from './useScore';
import { LevelSystem, LevelData } from '../game/LevelSystem';

interface LevelState {
  // Level data
  currentLevel: number;
  currentLevelData: LevelData;
  maxLevel: number;
  progress: number;
  
  // Level system
  levelSystem: LevelSystem;
  
  // Loading state
  isLoading: boolean;
  
  // Methods
  initialize: () => void;
  loadLevel: (levelNumber: number) => void;
  setCurrentLevel: (levelNumber: number) => void;
  nextLevel: () => void;
  prevLevel: () => void;
  reloadLevel: () => void;
  updateProgress: (value: number) => void;
  
  // Level creation/editing
  createCustomLevel: (levelData: Partial<LevelData>) => void;
  saveCurrentLevel: () => void;
}

// This creates a minimal default level object
const createDefaultLevel = (): LevelData => ({
  id: 0,
  name: 'Default Level',
  description: 'A new empty level',
  difficulty: 'easy',
  objective: 'Experiment with physics!',
  gameMode: 'sandbox',
  terrain: [
    {
      type: 'flat',
      position: [0, 0, 0],
      scale: [50, 1, 50],
      color: '#4a9c2b'
    }
  ],
  balls: [
    {
      id: 'player-ball',
      position: [0, 5, 0],
      radius: 1,
      mass: 1,
      color: '#3498db'
    }
  ],
  obstacles: [],
  powerUps: [],
  spawnPoints: [],
  goalPoints: [],
  boundaries: { minX: -25, maxX: 25, minY: -10, maxY: 25, minZ: -25, maxZ: 25 },
  winCondition: 'none',
  timeLimit: 0,
  scoreTarget: 0,
  environmentType: 'day'
});

export const useLevel = create<LevelState>((set, get) => ({
  // Initial state
  currentLevel: 1,
  currentLevelData: createDefaultLevel(),
  maxLevel: 9, // Update based on available levels
  progress: 0,
  
  levelSystem: new LevelSystem(),
  isLoading: false,
  
  // Initialize level system
  initialize: () => {
    const levelSystem = new LevelSystem();
    levelSystem.initializeLevels();
    
    set({
      levelSystem,
      currentLevel: 1,
      currentLevelData: levelSystem.getLevel(1) || createDefaultLevel()
    });
  },
  
  // Load a specific level
  loadLevel: (levelNumber) => {
    set({ isLoading: true });
    
    // Delay to allow for transitions/loading screen
    setTimeout(() => {
      const levelSystem = get().levelSystem;
      const levelData = levelSystem.getLevel(levelNumber);
      
      if (!levelData) {
        console.error(`Level ${levelNumber} not found`);
        set({ isLoading: false });
        return;
      }
      
      // Reset physics and score for new level
      const physics = usePhysics.getState();
      const score = useScore.getState();
      
      physics.cleanup();
      physics.initialize();
      score.reset();
      
      // Set environment based on level data
      if (levelData.environmentType) {
        // Could also update lighting, skybox, etc.
      }
      
      console.log(`Loading level: ${levelData.name}`);
      
      // Add terrain
      if (levelData.terrain) {
        console.log(`Adding ${levelData.terrain.length} terrain elements`);
      }
      
      // Add obstacles
      if (levelData.obstacles) {
        console.log(`Adding ${levelData.obstacles.length} obstacles`);
        levelData.obstacles.forEach(obstacle => {
          physics.createObstacle(obstacle);
        });
      }
      
      // Add balls
      if (levelData.balls) {
        console.log(`Adding ${levelData.balls.length} balls`);
        levelData.balls.forEach(ball => {
          physics.createBall(ball);
        });
      }
      
      // Add power-ups
      if (levelData.powerUps) {
        console.log(`Adding ${levelData.powerUps.length} power-ups`);
        levelData.powerUps.forEach(powerUp => {
          physics.createPowerUp(powerUp);
        });
      }
      
      // Update boundaries
      if (levelData.boundaries) {
        // TODO: Apply boundaries to physics system
      }
      
      // Set level-specific physics parameters
      if (levelData.physics) {
        if (levelData.physics.gravity !== undefined) {
          physics.setGravity(levelData.physics.gravity);
        }
        if (levelData.physics.bounciness !== undefined) {
          physics.setBounciness(levelData.physics.bounciness);
        }
        if (levelData.physics.friction !== undefined) {
          physics.setFriction(levelData.physics.friction);
        }
        if (levelData.physics.windForce !== undefined) {
          physics.setWindForce(levelData.physics.windForce);
        }
        if (levelData.physics.windDirection !== undefined) {
          physics.setWindDirection(levelData.physics.windDirection);
        }
      }
      
      set({
        currentLevelData: levelData,
        isLoading: false,
        progress: 0
      });
      
      console.log(`Level ${levelNumber} loaded successfully`);
    }, 100);
  },
  
  // Set current level and load it
  setCurrentLevel: (levelNumber) => {
    set({ currentLevel: levelNumber });
    get().loadLevel(levelNumber);
  },
  
  // Move to next level
  nextLevel: () => {
    const { currentLevel, maxLevel } = get();
    const nextLevel = Math.min(currentLevel + 1, maxLevel);
    
    set({ currentLevel: nextLevel });
    get().loadLevel(nextLevel);
  },
  
  // Move to previous level
  prevLevel: () => {
    const { currentLevel } = get();
    const prevLevel = Math.max(currentLevel - 1, 1);
    
    set({ currentLevel: prevLevel });
    get().loadLevel(prevLevel);
  },
  
  // Reload current level
  reloadLevel: () => {
    get().loadLevel(get().currentLevel);
  },
  
  // Update level progress (0-100)
  updateProgress: (value) => {
    set({ progress: Math.max(0, Math.min(100, value)) });
  },
  
  // Create a custom level
  createCustomLevel: (levelData) => {
    const customLevel: LevelData = {
      ...createDefaultLevel(),
      ...levelData,
      id: get().levelSystem.getCustomLevelId()
    };
    
    // Add to level system
    const levelSystem = get().levelSystem;
    levelSystem.addCustomLevel(customLevel);
    
    // Set as current level
    set({
      levelSystem,
      currentLevel: customLevel.id,
      currentLevelData: customLevel
    });
    
    // Load the new level
    get().loadLevel(customLevel.id);
  },
  
  // Save the current level (for level editor)
  saveCurrentLevel: () => {
    const { currentLevelData, levelSystem } = get();
    
    // Update the level in level system
    levelSystem.updateLevel(currentLevelData);
    
    console.log(`Level ${currentLevelData.id} saved`);
  }
}));

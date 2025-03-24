import * as THREE from 'three';
import { GameMode } from './GameModes';

// Level terrain section types
export type TerrainType = 'flat' | 'hills' | 'ramps' | 'water' | 'lava' | 'ice';

// Level environment types
export type EnvironmentType = 'day' | 'sunset' | 'night' | 'space' | 'underwater';

// Level difficulty ratings
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// Win condition types
export type WinCondition = 'score' | 'time' | 'collect' | 'survive' | 'destination' | 'objective' | 'none';

// Terrain section definition
export interface TerrainSection {
  type: TerrainType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  color?: string;
  textureRepeat?: [number, number];
}

// Ball definition for level data
export interface LevelBall {
  id: string;
  position: [number, number, number];
  radius?: number;
  mass?: number;
  velocity?: [number, number, number];
  color?: string;
  metallic?: boolean;
  emissive?: boolean;
  bounciness?: number;
  friction?: number;
  special?: string;
}

// Obstacle definition for level data
export interface LevelObstacle {
  id: string;
  type: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  material?: string;
  movable?: boolean;
  mass?: number;
  interactable?: boolean;
  behavior?: string;
  breakable?: boolean;
  health?: number;
  pathPoints?: Array<[number, number, number]>;
  speed?: number;
}

// Power-up definition for level data
export interface LevelPowerUp {
  id?: string;
  type: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  duration?: number;
  strength?: number;
  color?: string;
  active?: boolean;
}

// Level boundaries
export interface LevelBoundaries {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// Physics settings
export interface PhysicsSettings {
  gravity: number;
  bounciness: number;
  friction: number;
  windForce: number;
  windDirection: number;
}

// Complete level data structure
export interface LevelData {
  id: number;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  objective: string;
  gameMode: string;
  terrain: TerrainSection[];
  balls: LevelBall[];
  obstacles: LevelObstacle[];
  powerUps: LevelPowerUp[];
  spawnPoints: Array<[number, number, number]>;
  goalPoints?: Array<[number, number, number]>;
  boundaries: LevelBoundaries;
  winCondition: string;
  timeLimit?: number;
  scoreTarget?: number;
  environmentType: EnvironmentType;
  physics?: PhysicsSettings;
  skybox?: string;
  backgroundMusic?: string;
  specialEffects?: string[];
  unlockCriteria?: {
    previousLevel?: boolean;
    minScore?: number;
    collectibles?: number;
  };
}

// Level progress tracking
export interface LevelProgress {
  levelId: number;
  completed: boolean;
  highScore: number;
  bestTime?: number;
  starsEarned: number;
  collectiblesFound: number[];
  attempts: number;
  unlocked: boolean;
  lastPlayed: number;
}

// Main LevelSystem class for handling level data and progression
export class LevelSystem {
  private levels: Map<number, LevelData>;
  private customLevels: Map<number, LevelData>;
  private nextCustomId: number;
  private progress: Map<number, LevelProgress>;
  
  constructor() {
    this.levels = new Map();
    this.customLevels = new Map();
    this.nextCustomId = 1000; // Start custom IDs at 1000
    this.progress = new Map();
    
    // Initialize with default progress data
    this.loadProgressFromStorage();
  }
  
  // Initialize predefined levels
  public initializeLevels(): void {
    this.addLevel(this.createSandboxLevel());
    this.addLevel(this.createObstacleCourseLevel());
    this.addLevel(this.createTowerCollapseLevel());
    this.addLevel(this.createDominoEffectLevel());
    this.addLevel(this.createGravityWellsLevel());
    this.addLevel(this.createPendulumMazeLevel());
    this.addLevel(this.createPowerUpFrenzyLevel());
    this.addLevel(this.createDestructionDerbyLevel());
    this.addLevel(this.createTimeTrialCircuitLevel());
    
    console.log("Level system initialized with 9 predefined levels");
  }
  
  // Add a level to the system
  public addLevel(level: LevelData): void {
    this.levels.set(level.id, level);
    
    // Initialize progress if not exists
    if (!this.progress.has(level.id)) {
      this.progress.set(level.id, {
        levelId: level.id,
        completed: false,
        highScore: 0,
        bestTime: undefined,
        starsEarned: 0,
        collectiblesFound: [],
        attempts: 0,
        unlocked: level.id === 1, // First level is always unlocked
        lastPlayed: 0
      });
    }
  }
  
  // Get a level by its ID
  public getLevel(id: number): LevelData | undefined {
    // First check predefined levels
    if (this.levels.has(id)) {
      return this.levels.get(id);
    }
    
    // Then check custom levels
    return this.customLevels.get(id);
  }
  
  // Get all available levels
  public getAllLevels(): LevelData[] {
    // Combine predefined and custom levels
    return [...Array.from(this.levels.values()), ...Array.from(this.customLevels.values())];
  }
  
  // Get available levels for a specific game mode
  public getLevelsForGameMode(gameMode: GameMode): LevelData[] {
    return this.getAllLevels().filter(level => level.gameMode === gameMode);
  }
  
  // Add a custom level
  public addCustomLevel(level: LevelData): number {
    // Assign ID if not provided
    if (!level.id || level.id < 1000) {
      level.id = this.nextCustomId++;
    }
    
    this.customLevels.set(level.id, level);
    
    // Initialize progress
    this.progress.set(level.id, {
      levelId: level.id,
      completed: false,
      highScore: 0,
      bestTime: undefined,
      starsEarned: 0,
      collectiblesFound: [],
      attempts: 0,
      unlocked: true, // Custom levels are always unlocked
      lastPlayed: 0
    });
    
    // Save custom levels to localStorage
    this.saveCustomLevelsToStorage();
    
    return level.id;
  }
  
  // Update an existing level
  public updateLevel(level: LevelData): void {
    if (level.id < 1000) {
      // Update predefined level
      this.levels.set(level.id, level);
    } else {
      // Update custom level
      this.customLevels.set(level.id, level);
      this.saveCustomLevelsToStorage();
    }
  }
  
  // Delete a custom level
  public deleteCustomLevel(id: number): boolean {
    if (id < 1000) {
      console.warn("Cannot delete predefined levels");
      return false;
    }
    
    const deleted = this.customLevels.delete(id);
    if (deleted) {
      this.progress.delete(id);
      this.saveCustomLevelsToStorage();
      this.saveProgressToStorage();
    }
    
    return deleted;
  }
  
  // Get the next unique custom level ID
  public getCustomLevelId(): number {
    return this.nextCustomId++;
  }
  
  // Update level progress
  public updateProgress(levelId: number, updates: Partial<LevelProgress>): void {
    if (!this.progress.has(levelId)) {
      console.warn(`No progress data for level ${levelId}`);
      return;
    }
    
    const currentProgress = this.progress.get(levelId)!;
    
    // Update individual fields
    if (updates.completed !== undefined) {
      currentProgress.completed = updates.completed;
    }
    
    if (updates.highScore !== undefined) {
      currentProgress.highScore = Math.max(currentProgress.highScore, updates.highScore);
    }
    
    if (updates.bestTime !== undefined) {
      currentProgress.bestTime = currentProgress.bestTime === undefined 
        ? updates.bestTime 
        : Math.min(currentProgress.bestTime, updates.bestTime);
    }
    
    if (updates.starsEarned !== undefined) {
      currentProgress.starsEarned = Math.max(currentProgress.starsEarned, updates.starsEarned);
    }
    
    if (updates.collectiblesFound) {
      const newCollectibles = new Set([...currentProgress.collectiblesFound, ...updates.collectiblesFound]);
      currentProgress.collectiblesFound = Array.from(newCollectibles);
    }
    
    if (updates.attempts !== undefined) {
      currentProgress.attempts += updates.attempts;
    }
    
    if (updates.unlocked !== undefined) {
      currentProgress.unlocked = updates.unlocked;
    }
    
    currentProgress.lastPlayed = Date.now();
    
    // Update in map
    this.progress.set(levelId, currentProgress);
    
    // Unlock next level if completed
    if (updates.completed) {
      const nextLevelId = levelId + 1;
      if (this.levels.has(nextLevelId)) {
        const nextProgress = this.progress.get(nextLevelId) || {
          levelId: nextLevelId,
          completed: false,
          highScore: 0,
          bestTime: undefined,
          starsEarned: 0,
          collectiblesFound: [],
          attempts: 0,
          unlocked: false,
          lastPlayed: 0
        };
        
        nextProgress.unlocked = true;
        this.progress.set(nextLevelId, nextProgress);
      }
    }
    
    // Save progress to localStorage
    this.saveProgressToStorage();
  }
  
  // Get progress for a specific level
  public getProgress(levelId: number): LevelProgress | undefined {
    return this.progress.get(levelId);
  }
  
  // Get overall progress summary
  public getOverallProgress(): {
    totalLevels: number;
    completedLevels: number;
    totalStars: number;
    percentComplete: number;
  } {
    const totalLevels = this.levels.size;
    let completedLevels = 0;
    let totalStars = 0;
    
    this.progress.forEach(progress => {
      if (progress.levelId < 1000 && progress.completed) {
        completedLevels++;
      }
      if (progress.levelId < 1000) {
        totalStars += progress.starsEarned;
      }
    });
    
    const percentComplete = totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0;
    
    return {
      totalLevels,
      completedLevels,
      totalStars,
      percentComplete
    };
  }
  
  // Reset progress for a specific level
  public resetProgress(levelId: number): void {
    const isUnlocked = levelId === 1 || 
                       (this.progress.has(levelId) && this.progress.get(levelId)!.unlocked);
    
    this.progress.set(levelId, {
      levelId,
      completed: false,
      highScore: 0,
      bestTime: undefined,
      starsEarned: 0,
      collectiblesFound: [],
      attempts: 0,
      unlocked: isUnlocked,
      lastPlayed: 0
    });
    
    this.saveProgressToStorage();
  }
  
  // Reset all progress
  public resetAllProgress(): void {
    this.progress.clear();
    
    // Initialize with first level unlocked
    this.levels.forEach((level, id) => {
      this.progress.set(id, {
        levelId: id,
        completed: false,
        highScore: 0,
        bestTime: undefined,
        starsEarned: 0,
        collectiblesFound: [],
        attempts: 0,
        unlocked: id === 1, // Only first level is unlocked
        lastPlayed: 0
      });
    });
    
    // Custom levels are always unlocked
    this.customLevels.forEach((level, id) => {
      this.progress.set(id, {
        levelId: id,
        completed: false,
        highScore: 0,
        bestTime: undefined,
        starsEarned: 0,
        collectiblesFound: [],
        attempts: 0,
        unlocked: true,
        lastPlayed: 0
      });
    });
    
    this.saveProgressToStorage();
  }
  
  // Save/load progress from localStorage
  private saveProgressToStorage(): void {
    try {
      const progressData = JSON.stringify(Array.from(this.progress.entries()));
      localStorage.setItem('physics-sandbox-progress', progressData);
    } catch (e) {
      console.error('Failed to save progress to localStorage:', e);
    }
  }
  
  private loadProgressFromStorage(): void {
    try {
      const progressData = localStorage.getItem('physics-sandbox-progress');
      if (progressData) {
        const parsed = JSON.parse(progressData);
        this.progress = new Map(parsed);
      }
    } catch (e) {
      console.error('Failed to load progress from localStorage:', e);
    }
  }
  
  // Save/load custom levels from localStorage
  private saveCustomLevelsToStorage(): void {
    try {
      const levelsData = JSON.stringify(Array.from(this.customLevels.entries()));
      localStorage.setItem('physics-sandbox-custom-levels', levelsData);
    } catch (e) {
      console.error('Failed to save custom levels to localStorage:', e);
    }
  }
  
  private loadCustomLevelsFromStorage(): void {
    try {
      const levelsData = localStorage.getItem('physics-sandbox-custom-levels');
      if (levelsData) {
        const parsed = JSON.parse(levelsData);
        this.customLevels = new Map(parsed);
        
        // Update nextCustomId to be higher than any existing custom level ID
        this.customLevels.forEach((_, id) => {
          this.nextCustomId = Math.max(this.nextCustomId, id + 1);
        });
      }
    } catch (e) {
      console.error('Failed to load custom levels from localStorage:', e);
    }
  }
  
  // Pre-defined level creation methods
  private createSandboxLevel(): LevelData {
    return {
      id: 1,
      name: "Sandbox Arena",
      description: "An open sandbox to experiment with physics and objects. No objectives, just fun!",
      difficulty: "easy",
      objective: "Experiment with physics by creating and manipulating objects",
      gameMode: "sandbox",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [100, 1, 100],
          color: "#4a9c2b",
          textureRepeat: [20, 20]
        },
        {
          type: "ramps",
          position: [20, 1, 20],
          rotation: [0, Math.PI / 4, 0],
          scale: [15, 3, 15],
          color: "#8B4513"
        }
      ],
      balls: [
        {
          id: "main-ball",
          position: [0, 5, 0],
          radius: 1,
          mass: 1,
          color: "#3498db"
        },
        {
          id: "heavy-ball",
          position: [5, 5, 5],
          radius: 2,
          mass: 10,
          color: "#e74c3c"
        },
        {
          id: "light-ball",
          position: [-5, 5, -5],
          radius: 0.7,
          mass: 0.5,
          color: "#2ecc71"
        },
        {
          id: "metal-ball",
          position: [0, 5, 10],
          radius: 1.2,
          mass: 5,
          color: "#95a5a6",
          metallic: true
        },
        {
          id: "bouncy-ball",
          position: [10, 5, 0],
          radius: 0.8,
          mass: 0.8,
          color: "#f39c12",
          bounciness: 1.5
        }
      ],
      obstacles: [
        {
          id: "platform-1",
          type: "platform",
          position: [10, 2, 10],
          scale: [10, 0.5, 10],
          color: "#34495e",
          material: "wood"
        },
        {
          id: "ramp-1",
          type: "ramp",
          position: [-15, 1, -15],
          rotation: [0, Math.PI / 2, 0],
          scale: [8, 2, 4],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "spinner-1",
          type: "spinner",
          position: [0, 1, -15],
          scale: [5, 0.2, 5],
          color: "#9b59b6",
          material: "metal",
          behavior: "rotating",
          speed: 1
        }
      ],
      powerUps: [
        {
          type: "speed",
          position: [8, 1, 8],
          duration: 10,
          strength: 1.5
        },
        {
          type: "jump",
          position: [-8, 1, 8],
          duration: 8,
          strength: 2
        },
        {
          type: "gravity",
          position: [8, 1, -8],
          duration: 12,
          strength: 0.5
        }
      ],
      spawnPoints: [[0, 5, 0], [10, 7, 10], [-10, 5, -10]],
      boundaries: {
        minX: -50,
        maxX: 50,
        minY: -20,
        maxY: 100,
        minZ: -50,
        maxZ: 50
      },
      winCondition: "none",
      environmentType: "day",
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createObstacleCourseLevel(): LevelData {
    return {
      id: 2,
      name: "Obstacle Course",
      description: "Navigate through a series of obstacles using physics interactions.",
      difficulty: "easy",
      objective: "Reach the goal platform at the end of the course",
      gameMode: "challenge",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [120, 1, 20],
          color: "#4a9c2b",
          textureRepeat: [24, 4]
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [-50, 3, 0],
          radius: 1,
          mass: 1,
          color: "#3498db"
        }
      ],
      obstacles: [
        // Starting area
        {
          id: "start-platform",
          type: "platform",
          position: [-50, 0.5, 0],
          scale: [10, 0.5, 10],
          color: "#95a5a6",
          material: "metal"
        },
        // Hurdles
        {
          id: "hurdle-1",
          type: "wall",
          position: [-35, 1, 0],
          scale: [1, 2, 10],
          color: "#e74c3c",
          material: "wood"
        },
        {
          id: "hurdle-2",
          type: "wall",
          position: [-25, 1, 0],
          scale: [1, 3, 10],
          color: "#e74c3c",
          material: "wood"
        },
        {
          id: "hurdle-3",
          type: "wall",
          position: [-15, 1, 0],
          scale: [1, 4, 10],
          color: "#e74c3c",
          material: "wood"
        },
        // Ramp section
        {
          id: "ramp-1",
          type: "ramp",
          position: [-5, 1, 0],
          rotation: [0, 0, 0],
          scale: [10, 3, 10],
          color: "#3498db",
          material: "metal"
        },
        // Moving platform section
        {
          id: "moving-platform-1",
          type: "platform",
          position: [10, 4, 0],
          scale: [6, 0.5, 6],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[10, 4, -5], [10, 4, 5]],
          speed: 2
        },
        {
          id: "moving-platform-2",
          type: "platform",
          position: [20, 4, 0],
          scale: [6, 0.5, 6],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[20, 4, 5], [20, 4, -5]],
          speed: 2
        },
        // Spinning obstacle section
        {
          id: "spinner-1",
          type: "spinner",
          position: [35, 3, 0],
          scale: [5, 0.5, 0.5],
          color: "#e67e22",
          material: "metal",
          behavior: "rotating",
          speed: 3
        },
        // Goal platform
        {
          id: "goal-platform",
          type: "platform",
          position: [50, 1, 0],
          scale: [10, 1, 10],
          color: "#2ecc71",
          material: "metal"
        }
      ],
      powerUps: [
        {
          type: "speed",
          position: [-40, 1, 0],
          duration: 5,
          strength: 1.5
        },
        {
          type: "jump",
          position: [0, 5, 0],
          duration: 5,
          strength: 1.5
        }
      ],
      spawnPoints: [[-50, 3, 0]],
      goalPoints: [[50, 3, 0]],
      boundaries: {
        minX: -60,
        maxX: 60,
        minY: -10,
        maxY: 30,
        minZ: -15,
        maxZ: 15
      },
      winCondition: "destination",
      environmentType: "day",
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createTowerCollapseLevel(): LevelData {
    return {
      id: 3,
      name: "Tower Collapse",
      description: "Use the minimum number of balls to collapse the entire tower structure.",
      difficulty: "medium",
      objective: "Destroy the tower with as few balls as possible",
      gameMode: "destruction",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [60, 1, 60],
          color: "#8B4513",
          textureRepeat: [12, 12]
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [-20, 3, 0],
          radius: 1.5,
          mass: 5,
          color: "#e74c3c"
        }
      ],
      obstacles: [
        // Base platforms
        {
          id: "base-platform",
          type: "platform",
          position: [0, 0.5, 0],
          scale: [20, 0.5, 20],
          color: "#34495e",
          material: "metal"
        },
        // Tower structure - first level
        {
          id: "tower-base-1",
          type: "box",
          position: [0, 1.5, 0],
          scale: [16, 2, 16],
          color: "#95a5a6",
          material: "wood",
          breakable: true,
          health: 200
        },
        // Tower structure - second level
        {
          id: "tower-level-2",
          type: "box",
          position: [0, 4, 0],
          scale: [12, 2, 12],
          color: "#7f8c8d",
          material: "wood",
          breakable: true,
          health: 150
        },
        // Tower structure - third level
        {
          id: "tower-level-3",
          type: "box",
          position: [0, 6.5, 0],
          scale: [8, 2, 8],
          color: "#bdc3c7",
          material: "wood",
          breakable: true,
          health: 100
        },
        // Tower structure - fourth level
        {
          id: "tower-level-4",
          type: "box",
          position: [0, 9, 0],
          scale: [6, 2, 6],
          color: "#ecf0f1",
          material: "wood",
          breakable: true,
          health: 75
        },
        // Tower structure - fifth level (top)
        {
          id: "tower-top",
          type: "box",
          position: [0, 11.5, 0],
          scale: [4, 2, 4],
          color: "#f39c12",
          material: "wood",
          breakable: true,
          health: 50
        }
      ],
      powerUps: [
        {
          type: "explosion",
          position: [-10, 1, 10],
          strength: 5
        },
        {
          type: "size",
          position: [-10, 1, -10],
          duration: 10,
          strength: 2
        }
      ],
      spawnPoints: [[-20, 3, 0]],
      boundaries: {
        minX: -30,
        maxX: 30,
        minY: -10,
        maxY: 30,
        minZ: -30,
        maxZ: 30
      },
      winCondition: "objective",
      scoreTarget: 500,
      environmentType: "sunset",
      physics: {
        gravity: 9.81,
        bounciness: 0.4,
        friction: 0.95,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createDominoEffectLevel(): LevelData {
    return {
      id: 4,
      name: "Domino Effect",
      description: "Set up a chain reaction that triggers a sequence of events.",
      difficulty: "medium",
      objective: "Trigger the final target by creating a chain reaction",
      gameMode: "puzzle",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [80, 1, 40],
          color: "#34495e",
          textureRepeat: [16, 8]
        }
      ],
      balls: [
        {
          id: "trigger-ball",
          position: [-30, 5, 0],
          radius: 1,
          mass: 2,
          color: "#3498db"
        }
      ],
      obstacles: [
        // Starting platform
        {
          id: "start-platform",
          type: "platform",
          position: [-30, 1, 0],
          scale: [5, 1, 5],
          color: "#2ecc71",
          material: "metal"
        },
        // Domino path
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `domino-${i}`,
          type: "wall",
          position: [-25 + i * 2, 1, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 3, 2],
          color: "#e74c3c",
          material: "wood",
          movable: true,
          mass: 1
        })),
        // Ramp to second level
        {
          id: "ramp-1",
          type: "ramp",
          position: [20, 1, 0],
          rotation: [0, Math.PI / 2, 0],
          scale: [8, 2, 5],
          color: "#9b59b6",
          material: "metal"
        },
        // Second level platform
        {
          id: "level-2-platform",
          type: "platform",
          position: [25, 4, 0],
          scale: [10, 0.5, 10],
          color: "#f39c12",
          material: "wood"
        },
        // Ball release mechanism
        {
          id: "ball-release",
          type: "box",
          position: [25, 5, 0],
          scale: [2, 1, 2],
          color: "#95a5a6",
          material: "metal",
          movable: true,
          mass: 5
        },
        // Target ball
        {
          id: "target-ball",
          type: "sphere",
          position: [25, 6, 0],
          scale: [1.5, 1.5, 1.5],
          color: "#e67e22",
          material: "metal",
          movable: true,
          mass: 3
        },
        // Final target
        {
          id: "final-target",
          type: "cylinder",
          position: [35, 1, 0],
          scale: [4, 0.5, 4],
          color: "#27ae60",
          material: "metal",
          interactable: true
        }
      ],
      powerUps: [],
      spawnPoints: [[-30, 5, 0]],
      goalPoints: [[35, 2, 0]],
      boundaries: {
        minX: -40,
        maxX: 40,
        minY: -10,
        maxY: 30,
        minZ: -20,
        maxZ: 20
      },
      winCondition: "objective",
      environmentType: "day",
      physics: {
        gravity: 9.81,
        bounciness: 0.2,
        friction: 0.7,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createGravityWellsLevel(): LevelData {
    return {
      id: 5,
      name: "Gravity Wells",
      description: "Navigate through areas with changing gravity fields and avoid obstacles.",
      difficulty: "hard",
      objective: "Reach the exit by navigating through different gravity zones",
      gameMode: "challenge",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [100, 1, 100],
          color: "#1a1a2e",
          textureRepeat: [20, 20]
        },
        {
          type: "ice",
          position: [20, 0.1, 20],
          scale: [15, 0.1, 15],
          color: "#4361ee"
        },
        {
          type: "ice",
          position: [-20, 0.1, -20],
          scale: [15, 0.1, 15],
          color: "#4361ee"
        },
        {
          type: "lava",
          position: [20, 0.1, -20],
          scale: [15, 0.1, 15],
          color: "#e63946"
        },
        {
          type: "water",
          position: [-20, 0.1, 20],
          scale: [15, 0.1, 15],
          color: "#48cae4"
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [0, 3, 0],
          radius: 1,
          mass: 1,
          color: "#f72585",
          emissive: true
        }
      ],
      obstacles: [
        // Gravity well markers
        {
          id: "gravity-well-1",
          type: "cylinder",
          position: [20, 0.5, 20],
          scale: [3, 0.1, 3],
          color: "#4cc9f0",
          material: "glass",
          emissive: true
        },
        {
          id: "gravity-well-2",
          type: "cylinder",
          position: [-20, 0.5, -20],
          scale: [3, 0.1, 3],
          color: "#4cc9f0",
          material: "glass",
          emissive: true
        },
        {
          id: "anti-gravity-well",
          type: "cylinder",
          position: [20, 0.5, -20],
          scale: [3, 0.1, 3],
          color: "#f72585",
          material: "glass",
          emissive: true
        },
        {
          id: "water-well",
          type: "cylinder",
          position: [-20, 0.5, 20],
          scale: [3, 0.1, 3],
          color: "#48cae4",
          material: "glass",
          emissive: true
        },
        // Obstacles
        {
          id: "obstacle-ring-1",
          type: "cylinder",
          position: [10, 3, 10],
          rotation: [Math.PI/2, 0, 0],
          scale: [5, 0.5, 5],
          color: "#7209b7",
          material: "metal"
        },
        {
          id: "obstacle-ring-2",
          type: "cylinder",
          position: [-10, 3, -10],
          rotation: [Math.PI/2, 0, 0],
          scale: [5, 0.5, 5],
          color: "#7209b7",
          material: "metal"
        },
        // Moving obstacles
        {
          id: "moving-obstacle-1",
          type: "box",
          position: [10, 3, -10],
          scale: [1, 5, 1],
          color: "#f94144",
          material: "metal",
          behavior: "moving",
          pathPoints: [[10, 3, -15], [10, 3, -5]],
          speed: 2
        },
        {
          id: "moving-obstacle-2",
          type: "box",
          position: [-10, 3, 10],
          scale: [1, 5, 1],
          color: "#f94144",
          material: "metal",
          behavior: "moving",
          pathPoints: [[-15, 3, 10], [-5, 3, 10]],
          speed: 2
        },
        // Exit portal
        {
          id: "exit-portal",
          type: "cylinder",
          position: [40, 1, 40],
          scale: [5, 0.1, 5],
          color: "#06d6a0",
          material: "glass",
          emissive: true
        }
      ],
      powerUps: [
        {
          type: "gravity",
          position: [0, 1, 15],
          duration: 10,
          strength: 0.5
        },
        {
          type: "speed",
          position: [15, 1, 0],
          duration: 8,
          strength: 1.5
        },
        {
          type: "jump",
          position: [0, 1, -15],
          duration: 8,
          strength: 2
        }
      ],
      spawnPoints: [[0, 3, 0]],
      goalPoints: [[40, 2, 40]],
      boundaries: {
        minX: -50,
        maxX: 50,
        minY: -20,
        maxY: 50,
        minZ: -50,
        maxZ: 50
      },
      winCondition: "destination",
      environmentType: "night",
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windForce: 0.5,
        windDirection: 45
      },
      specialEffects: ["gravityWells", "portalEffects", "glowingTrails"]
    };
  }
  
  private createPendulumMazeLevel(): LevelData {
    return {
      id: 6,
      name: "Pendulum Maze",
      description: "Find your way through swinging pendulums that create a dynamic maze.",
      difficulty: "hard",
      objective: "Navigate through the pendulum maze to reach the exit",
      gameMode: "challenge",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [70, 1, 70],
          color: "#2c3e50",
          textureRepeat: [14, 14]
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [-25, 3, -25],
          radius: 0.8,
          mass: 1,
          color: "#3498db"
        }
      ],
      obstacles: [
        // Maze walls
        {
          id: "wall-north",
          type: "wall",
          position: [0, 2, -30],
          scale: [60, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "wall-south",
          type: "wall",
          position: [0, 2, 30],
          scale: [60, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "wall-east",
          type: "wall",
          position: [30, 2, 0],
          scale: [1, 4, 60],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "wall-west",
          type: "wall",
          position: [-30, 2, 0],
          scale: [1, 4, 60],
          color: "#7f8c8d",
          material: "metal"
        },
        // Inner maze walls
        {
          id: "inner-wall-1",
          type: "wall",
          position: [-15, 2, -10],
          scale: [30, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-2",
          type: "wall",
          position: [15, 2, 10],
          scale: [30, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-3",
          type: "wall",
          position: [0, 2, -20],
          scale: [1, 4, 20],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-4",
          type: "wall",
          position: [0, 2, 20],
          scale: [1, 4, 20],
          color: "#7f8c8d",
          material: "metal"
        },
        // Pendulums
        {
          id: "pendulum-1",
          type: "box",
          position: [-10, 10, -20],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 1
        },
        {
          id: "pendulum-2",
          type: "box",
          position: [10, 10, -20],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 1.2
        },
        {
          id: "pendulum-3",
          type: "box",
          position: [-20, 10, 0],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 0.8
        },
        {
          id: "pendulum-4",
          type: "box",
          position: [20, 10, 0],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 1.5
        },
        {
          id: "pendulum-5",
          type: "box",
          position: [-10, 10, 20],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 1.1
        },
        {
          id: "pendulum-6",
          type: "box",
          position: [10, 10, 20],
          scale: [1, 10, 1],
          color: "#e74c3c",
          material: "metal",
          behavior: "swinging",
          speed: 0.9
        },
        // Exit platform
        {
          id: "exit-platform",
          type: "platform",
          position: [25, 0.5, 25],
          scale: [5, 0.5, 5],
          color: "#2ecc71",
          material: "metal"
        }
      ],
      powerUps: [
        {
          type: "time",
          position: [-15, 1, 15],
          duration: 5,
          strength: 0.5
        },
        {
          type: "size",
          position: [15, 1, -15],
          duration: 8,
          strength: 0.7
        }
      ],
      spawnPoints: [[-25, 3, -25]],
      goalPoints: [[25, 2, 25]],
      boundaries: {
        minX: -35,
        maxX: 35,
        minY: -10,
        maxY: 30,
        minZ: -35,
        maxZ: 35
      },
      winCondition: "destination",
      timeLimit: 120,
      environmentType: "night",
      physics: {
        gravity: 9.81,
        bounciness: 0.5,
        friction: 0.95,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createPowerUpFrenzyLevel(): LevelData {
    return {
      id: 7,
      name: "Power-Up Frenzy",
      description: "Use various power-ups to navigate through challenges and reach the goal.",
      difficulty: "medium",
      objective: "Collect power-ups and use them to overcome obstacles",
      gameMode: "challenge",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [80, 1, 30],
          color: "#2c3e50",
          textureRepeat: [16, 6]
        },
        {
          type: "water",
          position: [20, 0.1, 0],
          scale: [10, 0.1, 10],
          color: "#3498db"
        },
        {
          type: "ice",
          position: [40, 0.1, 0],
          scale: [10, 0.1, 10],
          color: "#dff9fb"
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [-35, 3, 0],
          radius: 1,
          mass: 1,
          color: "#f39c12"
        }
      ],
      obstacles: [
        // Starting platform
        {
          id: "start-platform",
          type: "platform",
          position: [-35, 0.5, 0],
          scale: [5, 0.5, 5],
          color: "#27ae60",
          material: "metal"
        },
        // Barriers
        {
          id: "barrier-1",
          type: "wall",
          position: [-25, 2, 0],
          scale: [1, 4, 10],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "barrier-2",
          type: "wall",
          position: [-10, 4, 0],
          scale: [1, 8, 10],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "barrier-3",
          type: "wall",
          position: [5, 6, 0],
          scale: [1, 12, 10],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "barrier-4",
          type: "wall",
          position: [30, 10, 0],
          scale: [1, 20, 10],
          color: "#e74c3c",
          material: "metal"
        },
        // Moving platforms
        {
          id: "moving-platform-1",
          type: "platform",
          position: [-17.5, 2, 0],
          scale: [4, 0.5, 4],
          color: "#3498db",
          material: "metal",
          behavior: "moving",
          pathPoints: [[-17.5, 2, -5], [-17.5, 2, 5]],
          speed: 2
        },
        {
          id: "moving-platform-2",
          type: "platform",
          position: [-2.5, 4, 0],
          scale: [4, 0.5, 4],
          color: "#3498db",
          material: "metal",
          behavior: "moving",
          pathPoints: [[-2.5, 4, 5], [-2.5, 4, -5]],
          speed: 2
        },
        // Exit platform
        {
          id: "exit-platform",
          type: "platform",
          position: [35, 0.5, 0],
          scale: [5, 0.5, 5],
          color: "#8e44ad",
          material: "metal"
        }
      ],
      powerUps: [
        // Speed power-ups
        {
          type: "speed",
          position: [-30, 1, 0],
          duration: 5,
          strength: 2
        },
        // Jump power-ups
        {
          type: "jump",
          position: [-17.5, 3.5, 0],
          duration: 5,
          strength: 2
        },
        // Size power-ups
        {
          type: "size",
          position: [-5, 5.5, 0],
          duration: 5,
          strength: 0.5
        },
        // Gravity power-ups
        {
          type: "gravity",
          position: [10, 1, 0],
          duration: 5,
          strength: 0.3
        },
        // Multiplier power-up
        {
          type: "multiplier",
          position: [20, 1, 0],
          duration: 10,
          strength: 2
        },
        // Magnetism power-up
        {
          type: "magnetism",
          position: [25, 1, 0],
          duration: 5,
          strength: 1
        }
      ],
      spawnPoints: [[-35, 3, 0]],
      goalPoints: [[35, 2, 0]],
      boundaries: {
        minX: -40,
        maxX: 40,
        minY: -10,
        maxY: 30,
        minZ: -15,
        maxZ: 15
      },
      winCondition: "destination",
      timeLimit: 180,
      environmentType: "day",
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.95,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createDestructionDerbyLevel(): LevelData {
    return {
      id: 8,
      name: "Destruction Derby",
      description: "Cause maximum destruction with limited resources in this physics playground.",
      difficulty: "expert",
      objective: "Destroy as many structures as possible to score points",
      gameMode: "destruction",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [100, 1, 100],
          color: "#34495e",
          textureRepeat: [20, 20]
        },
        {
          type: "ramps",
          position: [20, 1, 20],
          rotation: [0, Math.PI / 4, 0],
          scale: [10, 2, 10],
          color: "#e67e22"
        },
        {
          type: "ramps",
          position: [-20, 1, -20],
          rotation: [0, -Math.PI / 4, 0],
          scale: [10, 2, 10],
          color: "#e67e22"
        }
      ],
      balls: [
        {
          id: "heavy-ball",
          position: [0, 10, 0],
          radius: 2,
          mass: 10,
          color: "#c0392b",
          metallic: true
        }
      ],
      obstacles: [
        // Tower structures
        // Tower 1
        ...Array.from({ length: 5 }, (_, i) => ({
          id: `tower1-block-${i}`,
          type: "box",
          position: [10, 1 + i * 2, 10],
          scale: [2, 2, 2],
          color: "#bdc3c7",
          material: "wood",
          movable: true,
          mass: 1,
          breakable: true,
          health: 50
        })),
        // Tower 2
        ...Array.from({ length: 6 }, (_, i) => ({
          id: `tower2-block-${i}`,
          type: "box",
          position: [-10, 1 + i * 2, 10],
          scale: [2, 2, 2],
          color: "#95a5a6",
          material: "wood",
          movable: true,
          mass: 1,
          breakable: true,
          health: 50
        })),
        // Tower 3
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `tower3-block-${i}`,
          type: "box",
          position: [10, 1 + i * 2, -10],
          scale: [2, 2, 2],
          color: "#7f8c8d",
          material: "wood",
          movable: true,
          mass: 1,
          breakable: true,
          health: 50
        })),
        // Tower 4
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `tower4-block-${i}`,
          type: "box",
          position: [-10, 1 + i * 2, -10],
          scale: [2, 2, 2],
          color: "#34495e",
          material: "wood",
          movable: true,
          mass: 1,
          breakable: true,
          health: 50
        })),
        // Pyramid structure
        ...Array.from({ length: 4 }, (_, level) => {
          const size = 4 - level;
          return Array.from({ length: size * size }, (_, i) => {
            const row = Math.floor(i / size);
            const col = i % size;
            const offsetX = (size - 1) * 0.5;
            const offsetZ = (size - 1) * 0.5;
            return {
              id: `pyramid-block-${level}-${i}`,
              type: "box",
              position: [
                25 + (col - offsetX) * 2,
                1 + level * 2,
                25 + (row - offsetZ) * 2
              ],
              scale: [1.9, 1.9, 1.9],
              color: "#9b59b6",
              material: "wood",
              movable: true,
              mass: 1,
              breakable: true,
              health: 50
            };
          });
        }).flat(),
        // Domino chain
        ...Array.from({ length: 20 }, (_, i) => ({
          id: `domino-${i}`,
          type: "wall",
          position: [-25 + i * 2, 1, 25],
          rotation: [0, 0, 0],
          scale: [0.5, 3, 1],
          color: "#2ecc71",
          material: "wood",
          movable: true,
          mass: 0.5,
          breakable: true,
          health: 20
        }))
      ],
      powerUps: [
        {
          type: "explosion",
          position: [0, 1, 15],
          strength: 8
        },
        {
          type: "explosion",
          position: [15, 1, 0],
          strength: 8
        },
        {
          type: "explosion",
          position: [0, 1, -15],
          strength: 8
        },
        {
          type: "explosion",
          position: [-15, 1, 0],
          strength: 8
        }
      ],
      spawnPoints: [[0, 10, 0]],
      boundaries: {
        minX: -50,
        maxX: 50,
        minY: -10,
        maxY: 50,
        minZ: -50,
        maxZ: 50
      },
      winCondition: "score",
      scoreTarget: 2000,
      environmentType: "sunset",
      physics: {
        gravity: 9.81,
        bounciness: 0.4,
        friction: 0.9,
        windForce: 0,
        windDirection: 0
      }
    };
  }
  
  private createTimeTrialCircuitLevel(): LevelData {
    return {
      id: 9,
      name: "Time Trial Circuit",
      description: "Race against the clock through a complex obstacle course with precision.",
      difficulty: "expert",
      objective: "Complete the circuit in the shortest time possible",
      gameMode: "race",
      terrain: [
        {
          type: "flat",
          position: [0, 0, 0],
          scale: [150, 1, 150],
          color: "#2c3e50",
          textureRepeat: [30, 30]
        }
      ],
      balls: [
        {
          id: "player-ball",
          position: [0, 2, -60],
          radius: 1,
          mass: 1,
          color: "#3498db"
        }
      ],
      obstacles: [
        // Starting platform
        {
          id: "start-platform",
          type: "platform",
          position: [0, 0.5, -60],
          scale: [10, 0.5, 10],
          color: "#2ecc71",
          material: "metal"
        },
        // Track outer walls
        {
          id: "outer-wall-1",
          type: "wall",
          position: [0, 2, -70],
          scale: [140, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "outer-wall-2",
          type: "wall",
          position: [70, 2, 0],
          scale: [1, 4, 140],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "outer-wall-3",
          type: "wall",
          position: [0, 2, 70],
          scale: [140, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "outer-wall-4",
          type: "wall",
          position: [-70, 2, 0],
          scale: [1, 4, 140],
          color: "#7f8c8d",
          material: "metal"
        },
        // Track inner walls
        {
          id: "inner-wall-1",
          type: "wall",
          position: [0, 2, -40],
          scale: [80, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-2",
          type: "wall",
          position: [40, 2, 0],
          scale: [1, 4, 80],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-3",
          type: "wall",
          position: [0, 2, 40],
          scale: [80, 4, 1],
          color: "#7f8c8d",
          material: "metal"
        },
        {
          id: "inner-wall-4",
          type: "wall",
          position: [-40, 2, 0],
          scale: [1, 4, 80],
          color: "#7f8c8d",
          material: "metal"
        },
        // First turn obstacles
        {
          id: "obstacle-1a",
          type: "box",
          position: [50, 2, -50],
          scale: [5, 4, 5],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "obstacle-1b",
          type: "cylinder",
          position: [30, 2, -55],
          scale: [3, 4, 3],
          color: "#f39c12",
          material: "metal"
        },
        // Second turn obstacles
        {
          id: "obstacle-2a",
          type: "box",
          position: [55, 2, 30],
          scale: [5, 4, 5],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "obstacle-2b",
          type: "cylinder",
          position: [50, 2, 50],
          scale: [3, 4, 3],
          color: "#f39c12",
          material: "metal"
        },
        // Third turn obstacles
        {
          id: "obstacle-3a",
          type: "box",
          position: [-50, 2, 55],
          scale: [5, 4, 5],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "obstacle-3b",
          type: "cylinder",
          position: [-30, 2, 50],
          scale: [3, 4, 3],
          color: "#f39c12",
          material: "metal"
        },
        // Fourth turn obstacles
        {
          id: "obstacle-4a",
          type: "box",
          position: [-55, 2, -30],
          scale: [5, 4, 5],
          color: "#e74c3c",
          material: "metal"
        },
        {
          id: "obstacle-4b",
          type: "cylinder",
          position: [-50, 2, -50],
          scale: [3, 4, 3],
          color: "#f39c12",
          material: "metal"
        },
        // Moving obstacles
        {
          id: "moving-obstacle-1",
          type: "box",
          position: [55, 2, -20],
          scale: [2, 2, 2],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[45, 2, -20], [65, 2, -20]],
          speed: 5
        },
        {
          id: "moving-obstacle-2",
          type: "box",
          position: [20, 2, 55],
          scale: [2, 2, 2],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[20, 2, 45], [20, 2, 65]],
          speed: 5
        },
        {
          id: "moving-obstacle-3",
          type: "box",
          position: [-55, 2, 20],
          scale: [2, 2, 2],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[-45, 2, 20], [-65, 2, 20]],
          speed: 5
        },
        {
          id: "moving-obstacle-4",
          type: "box",
          position: [-20, 2, -55],
          scale: [2, 2, 2],
          color: "#9b59b6",
          material: "metal",
          behavior: "moving",
          pathPoints: [[-20, 2, -45], [-20, 2, -65]],
          speed: 5
        },
        // Spinner obstacles
        {
          id: "spinner-1",
          type: "spinner",
          position: [0, 2, -55],
          scale: [8, 0.5, 0.5],
          color: "#1abc9c",
          material: "metal",
          behavior: "rotating",
          speed: 3
        },
        {
          id: "spinner-2",
          type: "spinner",
          position: [55, 2, 0],
          scale: [8, 0.5, 0.5],
          color: "#1abc9c",
          material: "metal",
          behavior: "rotating",
          speed: 3
        },
        {
          id: "spinner-3",
          type: "spinner",
          position: [0, 2, 55],
          scale: [8, 0.5, 0.5],
          color: "#1abc9c",
          material: "metal",
          behavior: "rotating",
          speed: 3
        },
        {
          id: "spinner-4",
          type: "spinner",
          position: [-55, 2, 0],
          scale: [8, 0.5, 0.5],
          color: "#1abc9c",
          material: "metal",
          behavior: "rotating",
          speed: 3
        },
        // Checkpoint markers
        {
          id: "checkpoint-1",
          type: "cylinder",
          position: [55, 0.5, -55],
          scale: [5, 0.1, 5],
          color: "#3498db",
          material: "glass"
        },
        {
          id: "checkpoint-2",
          type: "cylinder",
          position: [55, 0.5, 55],
          scale: [5, 0.1, 5],
          color: "#3498db",
          material: "glass"
        },
        {
          id: "checkpoint-3",
          type: "cylinder",
          position: [-55, 0.5, 55],
          scale: [5, 0.1, 5],
          color: "#3498db",
          material: "glass"
        },
        {
          id: "finish-line",
          type: "cylinder",
          position: [-55, 0.5, -55],
          scale: [5, 0.1, 5],
          color: "#2ecc71",
          material: "glass"
        }
      ],
      powerUps: [
        {
          type: "speed",
          position: [25, 1, -55],
          duration: 5,
          strength: 2
        },
        {
          type: "speed",
          position: [55, 1, 25],
          duration: 5,
          strength: 2
        },
        {
          type: "speed",
          position: [-25, 1, 55],
          duration: 5,
          strength: 2
        },
        {
          type: "speed",
          position: [-55, 1, -25],
          duration: 5,
          strength: 2
        },
        {
          type: "time",
          position: [0, 1, 0],
          duration: 10,
          strength: 0.5
        }
      ],
      spawnPoints: [[0, 2, -60]],
      goalPoints: [[-55, 2, -55]],
      boundaries: {
        minX: -75,
        maxX: 75,
        minY: -10,
        maxY: 30,
        minZ: -75,
        maxZ: 75
      },
      winCondition: "time",
      timeLimit: 180,
      environmentType: "sunset",
      physics: {
        gravity: 9.81,
        bounciness: 0.6,
        friction: 0.95,
        windForce: 0,
        windDirection: 0
      }
    };
  }
}


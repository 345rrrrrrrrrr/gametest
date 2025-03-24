import { LevelData } from './LevelSystem';

// Game mode types
export type GameMode = 'sandbox' | 'challenge' | 'destruction' | 'puzzle' | 'race' | 'custom';

// Game mode configuration
export interface GameModeConfig {
  id: string;
  name: string;
  description: string;
  scoreSystem: 'points' | 'time' | 'destruction' | 'custom';
  winCondition: 'objective' | 'score' | 'survival' | 'time' | 'none';
  features: string[];
  physics: {
    gravity: number;
    bounciness: number;
    friction: number;
    windEnabled: boolean;
  };
  defaultLevel?: number;
}

// Game mode registry
export class GameModes {
  private modes: Map<string, GameModeConfig>;
  
  constructor() {
    this.modes = new Map();
    this.initializeGameModes();
  }
  
  private initializeGameModes(): void {
    // Sandbox mode
    this.registerGameMode({
      id: 'sandbox',
      name: 'Sandbox',
      description: 'Experiment with physics and create your own scenes',
      scoreSystem: 'points',
      winCondition: 'none',
      features: ['object_creation', 'physics_controls', 'terrain_editing'],
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windEnabled: true
      },
      defaultLevel: 1
    });
    
    // Challenge mode
    this.registerGameMode({
      id: 'challenge',
      name: 'Challenge Mode',
      description: 'Complete objectives across multiple levels',
      scoreSystem: 'points',
      winCondition: 'objective',
      features: ['objectives', 'progression', 'power_ups'],
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windEnabled: false
      },
      defaultLevel: 2
    });
    
    // Destruction mode
    this.registerGameMode({
      id: 'destruction',
      name: 'Destruction Challenge',
      description: 'Cause maximum destruction with limited resources',
      scoreSystem: 'destruction',
      winCondition: 'score',
      features: ['destructible_objects', 'explosions', 'limited_resources'],
      physics: {
        gravity: 9.81,
        bounciness: 0.8,
        friction: 0.95,
        windEnabled: false
      },
      defaultLevel: 3
    });
    
    // Puzzle mode
    this.registerGameMode({
      id: 'puzzle',
      name: 'Physics Puzzles',
      description: 'Solve complex physics-based puzzles',
      scoreSystem: 'points',
      winCondition: 'objective',
      features: ['puzzle_elements', 'switches', 'moving_platforms'],
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windEnabled: false
      },
      defaultLevel: 4
    });
    
    // Race mode
    this.registerGameMode({
      id: 'race',
      name: 'Time Trial',
      description: 'Race against the clock in precision courses',
      scoreSystem: 'time',
      winCondition: 'time',
      features: ['checkpoints', 'speed_boosts', 'countdown'],
      physics: {
        gravity: 9.81,
        bounciness: 0.5,
        friction: 0.9,
        windEnabled: true
      },
      defaultLevel: 5
    });
  }
  
  // Register a new game mode
  public registerGameMode(config: GameModeConfig): void {
    this.modes.set(config.id, config);
  }
  
  // Get a game mode configuration
  public getGameMode(id: string): GameModeConfig | undefined {
    return this.modes.get(id);
  }
  
  // Get all available game modes
  public getAllGameModes(): GameModeConfig[] {
    return Array.from(this.modes.values());
  }
  
  // Apply game mode settings to a level
  public applyGameModeToLevel(gameMode: string, level: LevelData): LevelData {
    const modeConfig = this.getGameMode(gameMode);
    
    if (!modeConfig) {
      console.warn(`Game mode '${gameMode}' not found`);
      return level;
    }
    
    // Create a copy of the level
    const modifiedLevel = { ...level };
    
    // Apply game mode physics
    modifiedLevel.physics = {
      gravity: modeConfig.physics.gravity,
      bounciness: modeConfig.physics.bounciness,
      friction: modeConfig.physics.friction,
      windForce: modeConfig.physics.windEnabled ? 2 : 0,
      windDirection: 0
    };
    
    // Apply game mode features
    modifiedLevel.gameMode = gameMode;
    
    // Set win condition based on game mode
    modifiedLevel.winCondition = modeConfig.winCondition;
    
    return modifiedLevel;
  }
  
  // Create a default level for a specific game mode
  public createDefaultLevelForMode(gameMode: string): LevelData {
    const modeConfig = this.getGameMode(gameMode);
    
    const defaultLevel: LevelData = {
      id: 0,
      name: `${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} Level`,
      description: 'A new level',
      difficulty: 'easy',
      objective: 'Complete the level',
      gameMode: gameMode,
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
      spawnPoints: [[0, 5, 0]],
      goalPoints: [[20, 1, 20]],
      boundaries: { minX: -25, maxX: 25, minY: -10, maxY: 25, minZ: -25, maxZ: 25 },
      winCondition: 'none',
      timeLimit: 0,
      scoreTarget: 0,
      environmentType: 'day',
      physics: {
        gravity: 9.81,
        bounciness: 0.7,
        friction: 0.98,
        windForce: 0,
        windDirection: 0
      }
    };
    
    // Apply game mode settings
    if (modeConfig) {
      defaultLevel.physics = {
        gravity: modeConfig.physics.gravity,
        bounciness: modeConfig.physics.bounciness,
        friction: modeConfig.physics.friction,
        windForce: modeConfig.physics.windEnabled ? 2 : 0,
        windDirection: 0
      };
      
      defaultLevel.winCondition = modeConfig.winCondition;
      
      // Add mode-specific elements
      switch (gameMode) {
        case 'destruction':
          // Add destructible structures
          for (let i = 0; i < 5; i++) {
            defaultLevel.obstacles.push({
              id: `obstacle-${i}`,
              type: 'box',
              position: [Math.random() * 20 - 10, 3, Math.random() * 20 - 10],
              scale: [2, 2, 2],
              color: '#a5a5a5',
              material: 'wood',
              breakable: true,
              behavior: 'static'
            });
          }
          defaultLevel.scoreTarget = 1000;
          break;
          
        case 'race':
          // Add checkpoints
          defaultLevel.obstacles.push({
            id: 'checkpoint-1',
            type: 'cylinder',
            position: [10, 1, 10],
            scale: [3, 0.1, 3],
            color: '#2ecc71',
            material: 'glass',
            behavior: 'static'
          });
          defaultLevel.timeLimit = 60;
          break;
          
        case 'puzzle':
          // Add puzzle elements
          defaultLevel.obstacles.push({
            id: 'button-1',
            type: 'cylinder',
            position: [5, 0.2, 5],
            scale: [1, 0.1, 1],
            color: '#e74c3c',
            material: 'metal',
            behavior: 'static'
          });
          break;
      }
    }
    
    return defaultLevel;
  }
}

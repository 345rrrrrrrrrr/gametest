import * as THREE from 'three';
import { LevelData } from '@/types/level';
import { GameMode, ObstacleType, TerrainType, PowerUpType } from '@/types/game';

const createLevel = (id: number, levelData: Partial<LevelData>): LevelData => {
  // Set default level properties
  return {
    id,
    name: `Level ${id}`,
    description: 'A sandbox physics playground',
    difficulty: 1,
    supportedGameModes: [GameMode.SANDBOX],
    settings: {
      gravity: 9.81,
      windDirection: new THREE.Vector3(0, 0, 0),
      windStrength: 0,
      friction: 0.5,
      bounciness: 0.7,
      fogDensity: 0,
      fogColor: '#aabbcc',
      skyColor: '#88bbff',
      ambientLightIntensity: 0.5,
      directionalLightIntensity: 1.0,
      shadowsEnabled: true
    },
    terrain: {
      type: TerrainType.FLAT,
      width: 100,
      height: 1,
      depth: 100,
      segments: 50,
      scale: 1,
      texture: '/textures/grass.png'
    },
    obstacles: [],
    powerUps: [],
    startPoints: [
      {
        position: new THREE.Vector3(0, 5, 0),
        direction: new THREE.Vector3(0, 0, 0)
      }
    ],
    objectives: [],
    boundaries: {
      min: new THREE.Vector3(-50, 0, -50),
      max: new THREE.Vector3(50, 50, 50)
    },
    timeToComplete: {
      bronze: 180,
      silver: 120,
      gold: 60
    },
    scoreThresholds: {
      bronze: 1000,
      silver: 2500,
      gold: 5000
    },
    ...levelData
  };
};

// Level 1: Tutorial Sandbox
const level1: LevelData = createLevel(1, {
  name: 'Tutorial Sandbox',
  description: 'Learn the basics of physics in this simple playground',
  supportedGameModes: [GameMode.SANDBOX, GameMode.DESTRUCTION],
  obstacles: [
    {
      id: 'obstacle_1',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(5, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      color: '#58a5f0'
    },
    {
      id: 'obstacle_2',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(-5, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      color: '#58a5f0'
    },
    {
      id: 'obstacle_3',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(0, 0.5, 5),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      color: '#58a5f0'
    },
    {
      id: 'obstacle_4',
      type: ObstacleType.SPHERE,
      position: new THREE.Vector3(0, 0.5, -5),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      color: '#f05a5c'
    },
    {
      id: 'obstacle_5',
      type: ObstacleType.BREAKABLE,
      position: new THREE.Vector3(8, 0.5, 8),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      color: '#f05a5c',
      isBreakable: true,
      health: 100
    }
  ],
  powerUps: [
    {
      type: PowerUpType.SPEED_BOOST,
      position: new THREE.Vector3(10, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 10,
      strength: 2,
      radius: 0.5,
      respawnTime: 15
    }
  ]
});

// Level 2: Ramp Challenge
const level2: LevelData = createLevel(2, {
  name: 'Ramp Challenge',
  description: 'Test your skills with slopes and jumps',
  difficulty: 2,
  supportedGameModes: [GameMode.SANDBOX, GameMode.TIME_TRIAL],
  settings: {
    gravity: 9.81,
    bounciness: 0.8
  },
  obstacles: [
    // Create a large ramp
    {
      id: 'ramp_1',
      type: ObstacleType.RAMP,
      position: new THREE.Vector3(0, 0, -10),
      rotation: new THREE.Euler(0, Math.PI, 0),
      scale: new THREE.Vector3(10, 2, 15),
      color: '#5cf068'
    },
    // Create landing pad
    {
      id: 'platform_1',
      type: ObstacleType.PLATFORM,
      position: new THREE.Vector3(0, 0, 15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(10, 0.5, 10),
      color: '#58a5f0'
    },
    // Obstacles on the landing pad
    {
      id: 'obstacle_1',
      type: ObstacleType.BREAKABLE,
      position: new THREE.Vector3(0, 1, 15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 2, 1),
      color: '#f05a5c',
      isBreakable: true,
      health: 50
    }
  ],
  powerUps: [
    {
      type: PowerUpType.SPEED_BOOST,
      position: new THREE.Vector3(0, 1, -15),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 10,
      strength: 2.5,
      radius: 0.5
    },
    {
      type: PowerUpType.GRAVITY_FLIP,
      position: new THREE.Vector3(5, 1, 15),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 5,
      strength: 1,
      radius: 0.5
    }
  ],
  startPoints: [
    {
      position: new THREE.Vector3(0, 1, -20),
      direction: new THREE.Vector3(0, 0, 1)
    }
  ],
  objectives: [
    {
      id: 'obj_1',
      name: 'Reach the platform',
      description: 'Jump from the ramp to the landing pad',
      target: 1,
      progressCurrent: 0,
      type: 'reach_point',
      optional: false
    }
  ],
  collectibles: {
    positions: [
      new THREE.Vector3(-3, 1, 15),
      new THREE.Vector3(0, 1, 15),
      new THREE.Vector3(3, 1, 15),
    ],
    value: 50,
    type: 'coin'
  }
});

// Level 3: Obstacle Course
const level3: LevelData = createLevel(3, {
  name: 'Obstacle Course',
  description: 'Navigate through a challenging obstacle course',
  difficulty: 3,
  supportedGameModes: [GameMode.TIME_TRIAL, GameMode.PUZZLE],
  settings: {
    gravity: 9.81,
    bounciness: 0.7,
    timeLimit: 120
  },
  terrain: {
    type: TerrainType.FLAT,
    width: 100,
    height: 1,
    depth: 100,
    segments: 50,
    scale: 1,
    texture: '/textures/asphalt.png'
  },
  obstacles: [
    // Create a series of walls to navigate around
    {
      id: 'wall_1',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(-15, 2, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 4, 30),
      color: '#666666'
    },
    {
      id: 'wall_2',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(15, 2, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 4, 30),
      color: '#666666'
    },
    {
      id: 'wall_3',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(0, 2, -15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(30, 4, 1),
      color: '#666666'
    },
    {
      id: 'wall_4',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(0, 2, 15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(30, 4, 1),
      color: '#666666'
    },
    // Inner obstacles
    {
      id: 'obstacle_1',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(-8, 1, -8),
      rotation: new THREE.Euler(0, Math.PI / 4, 0),
      scale: new THREE.Vector3(10, 2, 1),
      color: '#58a5f0'
    },
    {
      id: 'obstacle_2',
      type: ObstacleType.CUBE,
      position: new THREE.Vector3(8, 1, 8),
      rotation: new THREE.Euler(0, Math.PI / 4, 0),
      scale: new THREE.Vector3(10, 2, 1),
      color: '#58a5f0'
    },
    {
      id: 'spinner_1',
      type: ObstacleType.SPINNER,
      position: new THREE.Vector3(0, 1, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 10),
      color: '#f05a5c'
    }
  ],
  powerUps: [
    {
      type: PowerUpType.BALL_MULTIPLIER,
      position: new THREE.Vector3(8, 1, -8),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 15,
      strength: 3,
      radius: 0.5
    },
    {
      type: PowerUpType.SLOW_MOTION,
      position: new THREE.Vector3(-8, 1, 8),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 10,
      strength: 0.5,
      radius: 0.5
    }
  ],
  startPoints: [
    {
      position: new THREE.Vector3(-12, 1, -12),
      direction: new THREE.Vector3(1, 0, 1).normalize()
    }
  ],
  collectibles: {
    positions: [
      new THREE.Vector3(-8, 1, 0),
      new THREE.Vector3(0, 1, 8),
      new THREE.Vector3(8, 1, 0),
      new THREE.Vector3(0, 1, -8),
    ],
    value: 100,
    type: 'star'
  },
  objectives: [
    {
      id: 'obj_1',
      name: 'Collect all stars',
      description: 'Find and collect all the stars',
      target: 4,
      progressCurrent: 0,
      type: 'collect',
      optional: false
    },
    {
      id: 'obj_2',
      name: 'Avoid the spinner',
      description: 'Complete the level without hitting the spinner',
      target: 1,
      progressCurrent: 0,
      type: 'time',
      optional: true
    }
  ]
});

// Level 4: Destruction Derby
const level4: LevelData = createLevel(4, {
  name: 'Destruction Derby',
  description: 'Destroy as many objects as possible!',
  difficulty: 2,
  supportedGameModes: [GameMode.DESTRUCTION, GameMode.SANDBOX],
  settings: {
    gravity: 9.81,
    bounciness: 0.8,
    timeLimit: 60
  },
  terrain: {
    type: TerrainType.FLAT,
    width: 100,
    height: 1,
    depth: 100,
    segments: 50,
    scale: 1,
    texture: '/textures/sand.jpg'
  },
  obstacles: Array.from({ length: 40 }).map((_, index) => ({
    id: `breakable_${index}`,
    type: ObstacleType.BREAKABLE,
    position: new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      1,
      (Math.random() - 0.5) * 30
    ),
    rotation: new THREE.Euler(
      0,
      Math.random() * Math.PI * 2,
      0
    ),
    scale: new THREE.Vector3(
      0.5 + Math.random() * 1.5,
      0.5 + Math.random() * 1.5,
      0.5 + Math.random() * 1.5
    ),
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
    isBreakable: true,
    health: 50 + Math.floor(Math.random() * 50)
  })),
  powerUps: [
    {
      type: PowerUpType.EXPLOSIVE,
      position: new THREE.Vector3(0, 1, 0),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 15,
      strength: 2,
      radius: 0.5,
      respawnTime: 10
    },
    {
      type: PowerUpType.SIZE_INCREASE,
      position: new THREE.Vector3(10, 1, 10),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 20,
      strength: 2,
      radius: 0.5,
      respawnTime: 15
    },
    {
      type: PowerUpType.SPEED_BOOST,
      position: new THREE.Vector3(-10, 1, -10),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 10,
      strength: 2,
      radius: 0.5,
      respawnTime: 10
    }
  ],
  startPoints: [
    {
      position: new THREE.Vector3(0, 5, -20),
      direction: new THREE.Vector3(0, 0, 1)
    }
  ],
  objectives: [
    {
      id: 'obj_1',
      name: 'Destruction',
      description: 'Destroy as many objects as possible',
      target: 20,
      progressCurrent: 0,
      type: 'destroy',
      optional: false
    }
  ]
});

// Level 5: Magnetic Madness
const level5: LevelData = createLevel(5, {
  name: 'Magnetic Madness',
  description: 'Navigate through magnetic fields and portals',
  difficulty: 4,
  supportedGameModes: [GameMode.PUZZLE, GameMode.TIME_TRIAL],
  settings: {
    gravity: 9.81,
    bounciness: 0.7,
    timeLimit: 180
  },
  terrain: {
    type: TerrainType.FLAT,
    width: 100,
    height: 1,
    depth: 100,
    segments: 50,
    scale: 1,
    texture: '/textures/asphalt.png'
  },
  obstacles: [
    // Platforms
    {
      id: 'platform_1',
      type: ObstacleType.PLATFORM,
      position: new THREE.Vector3(-15, 2, -15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 0.5, 5),
      color: '#58a5f0'
    },
    {
      id: 'platform_2',
      type: ObstacleType.PLATFORM,
      position: new THREE.Vector3(15, 2, -15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 0.5, 5),
      color: '#58a5f0'
    },
    {
      id: 'platform_3',
      type: ObstacleType.PLATFORM,
      position: new THREE.Vector3(15, 2, 15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 0.5, 5),
      color: '#58a5f0'
    },
    {
      id: 'platform_4',
      type: ObstacleType.PLATFORM,
      position: new THREE.Vector3(-15, 2, 15),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 0.5, 5),
      color: '#58a5f0'
    },
    // Portals
    {
      id: 'portal_1',
      type: ObstacleType.PORTAL,
      position: new THREE.Vector3(-15, 3, -15),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      scale: new THREE.Vector3(2, 2, 2),
      color: '#8844ff'
    },
    {
      id: 'portal_2',
      type: ObstacleType.PORTAL,
      position: new THREE.Vector3(15, 3, 15),
      rotation: new THREE.Euler(Math.PI / 2, 0, 0),
      scale: new THREE.Vector3(2, 2, 2),
      color: '#8844ff'
    },
    // Obstacles
    {
      id: 'obstacle_1',
      type: ObstacleType.CYLINDER,
      position: new THREE.Vector3(0, 2, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(2, 4, 2),
      color: '#f05a5c'
    },
    {
      id: 'obstacle_2',
      type: ObstacleType.BOUNCER,
      position: new THREE.Vector3(0, 0.5, 10),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 1, 1),
      color: '#5cf068'
    },
    {
      id: 'obstacle_3',
      type: ObstacleType.BOUNCER,
      position: new THREE.Vector3(0, 0.5, -10),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(5, 1, 1),
      color: '#5cf068'
    },
    {
      id: 'obstacle_4',
      type: ObstacleType.BOUNCER,
      position: new THREE.Vector3(10, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 5),
      color: '#5cf068'
    },
    {
      id: 'obstacle_5',
      type: ObstacleType.BOUNCER,
      position: new THREE.Vector3(-10, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 5),
      color: '#5cf068'
    }
  ],
  powerUps: [
    {
      type: PowerUpType.MAGNET,
      position: new THREE.Vector3(0, 0.5, 0),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 15,
      strength: 5,
      radius: 0.5,
      respawnTime: 15
    },
    {
      type: PowerUpType.GHOST,
      position: new THREE.Vector3(15, 3, -15),
      rotation: new THREE.Euler(0, 0, 0),
      duration: 10,
      strength: 1,
      radius: 0.5
    }
  ],
  startPoints: [
    {
      position: new THREE.Vector3(-15, 4, -15),
      direction: new THREE.Vector3(1, 0, 1).normalize()
    }
  ],
  collectibles: {
    positions: [
      new THREE.Vector3(-15, 3, 15),
      new THREE.Vector3(15, 3, -15),
      new THREE.Vector3(0, 5, 0),
    ],
    value: 200,
    type: 'gem'
  },
  objectives: [
    {
      id: 'obj_1',
      name: 'Collect all gems',
      description: 'Find and collect all the gems',
      target: 3,
      progressCurrent: 0,
      type: 'collect',
      optional: false
    },
    {
      id: 'obj_2',
      name: 'Use portals',
      description: 'Use the portals to navigate efficiently',
      target: 1,
      progressCurrent: 0,
      type: 'time',
      optional: false
    }
  ]
});

// Export all levels
export const levels: LevelData[] = [
  level1,
  level2,
  level3,
  level4,
  level5
];

export default levels;

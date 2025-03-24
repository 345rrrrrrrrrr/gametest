export enum GamePhase {
  MENU = 'menu',
  LEVEL_SELECT = 'level_select',
  SETTINGS = 'settings',
  GAME_MODE_SELECT = 'game_mode_select',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  LEVEL_COMPLETE = 'level_complete'
}

export enum GameMode {
  SANDBOX = 'sandbox',
  TIME_TRIAL = 'time_trial',
  PUZZLE = 'puzzle',
  DESTRUCTION = 'destruction'
}

export enum PowerUpType {
  SPEED_BOOST = 'speed_boost',
  GRAVITY_FLIP = 'gravity_flip',
  BALL_MULTIPLIER = 'ball_multiplier',
  SIZE_INCREASE = 'size_increase',
  SLOW_MOTION = 'slow_motion',
  EXPLOSIVE = 'explosive',
  MAGNET = 'magnet',
  GHOST = 'ghost'
}

export enum ObstacleType {
  CUBE = 'cube',
  SPHERE = 'sphere',
  PYRAMID = 'pyramid',
  CYLINDER = 'cylinder',
  RAMP = 'ramp',
  PLATFORM = 'platform',
  SPINNER = 'spinner',
  BOUNCER = 'bouncer',
  PORTAL = 'portal',
  TRIGGER = 'trigger',
  BREAKABLE = 'breakable',
  TELEPORTER = 'teleporter'
}

export enum TerrainType {
  FLAT = 'flat',
  HILLS = 'hills',
  WATER = 'water',
  SAND = 'sand',
  ICE = 'ice',
  LAVA = 'lava'
}

export enum Controls {
  FORWARD = 'forward',
  BACKWARD = 'backward',
  LEFT = 'left',
  RIGHT = 'right',
  JUMP = 'jump',
  BOOST = 'boost',
  INTERACT = 'interact',
  CAMERA_LEFT = 'camera_left',
  CAMERA_RIGHT = 'camera_right',
  CAMERA_UP = 'camera_up',
  CAMERA_DOWN = 'camera_down',
  CAMERA_RESET = 'camera_reset',
  PAUSE = 'pause'
}

export interface GameSettings {
  soundVolume: number;
  musicVolume: number;
  particleCount: number;
  shadowQuality: 'low' | 'medium' | 'high';
  effectsQuality: 'low' | 'medium' | 'high';
  cameraShake: boolean;
  showFPS: boolean;
  controlType: 'keyboard' | 'gamepad';
  mouseSensitivity: number;
  invertY: boolean;
  invertX: boolean;
}

export interface GameStats {
  ballsCreated: number;
  obstaclesDestroyed: number;
  powerUpsCollected: number;
  distanceTraveled: number;
  jumpsPerformed: number;
  timeSpentInAir: number;
  highestPoint: number;
  fastestSpeed: number;
  longestChain: number;
  totalPlayTime: number;
}

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  score: number;
  stars: number;
  time: number;
  objectives: {
    id: string;
    completed: boolean;
  }[];
}

export interface PlayerProfile {
  name: string;
  selectedBall: string;
  unlockedBalls: string[];
  unlockedLevels: number[];
  levelProgress: LevelProgress[];
  stats: GameStats;
  settings: GameSettings;
  totalScore: number;
  achievements: {
    id: string;
    unlocked: boolean;
    date?: string;
  }[];
}

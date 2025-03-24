import * as THREE from 'three';
import { Controls, GameSettings } from '../types/game';

// Core game constants
export const GAME_VERSION = '1.0.0';
export const MAX_BALLS = 100;
export const MAX_OBSTACLES = 200;
export const MAX_PARTICLES = 5000;

// Physics constants
export const PHYSICS_STEP = 1 / 60;
export const MAX_SUBSTEPS = 10;
export const GRAVITY = new THREE.Vector3(0, -9.81, 0);
export const DEFAULT_FRICTION = 0.5;
export const DEFAULT_RESTITUTION = 0.7;
export const DEFAULT_MASS = 1;
export const DEFAULT_DAMPING = 0.1;
export const DEFAULT_ANGULAR_DAMPING = 0.1;
export const MAX_VELOCITY = 50;
export const SLEEP_THRESHOLD = 0.01;
export const COLLISION_GROUPS = {
  DEFAULT: 0x0001,
  STATIC: 0x0002,
  DYNAMIC: 0x0004,
  BALL: 0x0008,
  OBSTACLE: 0x0010,
  POWERUP: 0x0020,
  TRIGGER: 0x0040,
  TERRAIN: 0x0080,
  COLLECTIBLE: 0x0100,
  ALL: 0xFFFF
};

// Ball constants
export const DEFAULT_BALL_RADIUS = 0.5;
export const DEFAULT_BALL_COLOR = '#58a5f0';
export const MAX_BALL_RADIUS = 3;
export const MIN_BALL_RADIUS = 0.2;
export const BALL_TRAIL_MAX_POINTS = 100;
export const BALL_TRAIL_WIDTH = 0.1;

// Camera constants
export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 10, 15);
export const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
export const CAMERA_FOLLOW_DAMPING = 0.05;
export const CAMERA_ROTATION_SPEED = 0.005;
export const CAMERA_ZOOM_SPEED = 0.1;
export const CAMERA_MIN_DISTANCE = 5;
export const CAMERA_MAX_DISTANCE = 50;
export const CAMERA_FOV = 60;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 1000;

// Control mappings
export const KEYBOARD_CONTROLS = [
  { name: Controls.FORWARD, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.BACKWARD, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.LEFT, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.RIGHT, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.JUMP, keys: ['Space'] },
  { name: Controls.BOOST, keys: ['ShiftLeft', 'ShiftRight'] },
  { name: Controls.INTERACT, keys: ['KeyE'] },
  { name: Controls.CAMERA_LEFT, keys: ['KeyQ'] },
  { name: Controls.CAMERA_RIGHT, keys: ['KeyE'] },
  { name: Controls.CAMERA_UP, keys: ['KeyR'] },
  { name: Controls.CAMERA_DOWN, keys: ['KeyF'] },
  { name: Controls.CAMERA_RESET, keys: ['KeyC'] },
  { name: Controls.PAUSE, keys: ['Escape'] }
];

// Default settings
export const DEFAULT_SETTINGS: GameSettings = {
  soundVolume: 0.7,
  musicVolume: 0.5,
  particleCount: 1000,
  shadowQuality: 'medium',
  effectsQuality: 'medium',
  cameraShake: true,
  showFPS: false,
  controlType: 'keyboard',
  mouseSensitivity: 0.5,
  invertY: false,
  invertX: false
};

// UI constants
export const TRANSITION_DURATION = 300;
export const TOAST_DURATION = 3000;
export const UI_COLORS = {
  primary: '#0088ff',
  secondary: '#58a5f0',
  accent: '#5cf068',
  warning: '#f05a5c',
  background: 'rgba(30, 30, 30, 0.85)',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  border: '#555555'
};

// Level constants
export const MAX_LEVEL_COUNT = 50;
export const LEVELS_PER_WORLD = 10;
export const MAX_WORLD_COUNT = 5;

// Powerup constants
export const POWERUP_DURATION = 10;
export const POWERUP_RESPAWN_TIME = 15;
export const POWERUP_EFFECT_STRENGTH = {
  [Controls.SPEED_BOOST]: 2.5,
  [Controls.GRAVITY_FLIP]: -1,
  [Controls.BALL_MULTIPLIER]: 3,
  [Controls.SIZE_INCREASE]: 2,
  [Controls.SLOW_MOTION]: 0.5,
  [Controls.EXPLOSIVE]: 1.5,
  [Controls.MAGNET]: 5,
  [Controls.GHOST]: 1
};

// Materials
export const MATERIAL_PROPERTIES = {
  default: { friction: 0.5, restitution: 0.5 },
  metal: { friction: 0.2, restitution: 0.8 },
  rubber: { friction: 0.9, restitution: 0.9 },
  wood: { friction: 0.7, restitution: 0.4 },
  glass: { friction: 0.1, restitution: 0.2 },
  ice: { friction: 0.05, restitution: 0.3 },
  bouncy: { friction: 0.5, restitution: 1.5 },
  sticky: { friction: 0.9, restitution: 0.1 }
};

// Asset paths
export const SOUND_PATHS = {
  background: '/sounds/background.mp3',
  hit: '/sounds/hit.mp3',
  success: '/sounds/success.mp3'
};

export const TEXTURE_PATHS = {
  grass: '/textures/grass.png',
  sand: '/textures/sand.jpg',
  asphalt: '/textures/asphalt.png',
  wood: '/textures/wood.jpg',
  sky: '/textures/sky.png'
};

// Particle constants
export const PARTICLE_COLORS = {
  explosion: ['#ff4500', '#ffa500', '#ffff00'],
  sparkle: ['#ffffff', '#ffffaa', '#aaaaff'],
  smoke: ['#222222', '#444444', '#666666'],
  water: ['#0077ff', '#00aaff', '#00ddff']
};

export const PARTICLE_LIFETIMES = {
  short: [0.2, 0.5],
  medium: [0.5, 1.5],
  long: [1.5, 3.0]
};

// Debug constants
export const DEBUG_ENABLED = false;
export const DEBUG_PHYSICS = false;
export const DEBUG_COLLISIONS = false;
export const DEBUG_PERFORMANCE = false;

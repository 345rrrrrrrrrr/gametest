import { ObstacleType, TerrainType, PowerUpType, GameMode } from './game';
import { PhysicsProperties } from './physics';
import * as THREE from 'three';

export interface LevelObjective {
  id: string;
  name: string;
  description: string;
  target: number;
  progressCurrent: number;
  type: 'collect' | 'destroy' | 'reach_point' | 'time' | 'score' | 'chain';
  optional: boolean;
}

export interface LevelSettings {
  gravity: number;
  windDirection: THREE.Vector3;
  windStrength: number;
  friction: number;
  bounciness: number;
  timeLimit?: number;
  fogDensity: number;
  fogColor: string;
  skyColor: string;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  shadowsEnabled: boolean;
}

export interface PowerUpDefinition {
  type: PowerUpType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  duration: number;
  strength: number;
  radius: number;
  physicsProperties?: Partial<PhysicsProperties>;
  respawnTime?: number;
}

export interface ObstacleDefinition {
  type: ObstacleType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  physicsProperties?: Partial<PhysicsProperties>;
  color?: string;
  isBreakable?: boolean;
  health?: number;
  movementPath?: {
    points: THREE.Vector3[];
    speed: number;
    loop: boolean;
    easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  triggerEffect?: {
    type: 'spawn' | 'destroy' | 'modify' | 'teleport' | 'win';
    targetIds?: string[];
    parameters?: any;
  };
  id: string;
}

export interface StartPoint {
  position: THREE.Vector3;
  direction: THREE.Vector3;
}

export interface TerrainDefinition {
  type: TerrainType;
  heightMap?: string;
  width: number;
  height: number;
  depth: number;
  segments: number;
  scale: number;
  texture: string;
  physicsProperties?: Partial<PhysicsProperties>;
  waterLevel?: number;
}

export interface LevelData {
  id: number;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  supportedGameModes: GameMode[];
  settings: LevelSettings;
  terrain: TerrainDefinition;
  obstacles: ObstacleDefinition[];
  powerUps: PowerUpDefinition[];
  startPoints: StartPoint[];
  objectives: LevelObjective[];
  collectibles?: {
    positions: THREE.Vector3[];
    value: number;
    type: 'star' | 'coin' | 'gem';
  };
  triggers?: {
    id: string;
    position: THREE.Vector3;
    radius: number;
    onEnter: any;
    onExit: any;
  }[];
  boundaries: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
  timeToComplete: {
    bronze: number;
    silver: number;
    gold: number;
  };
  scoreThresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
}

import * as THREE from 'three';
import { PowerUpType, ObstacleType } from './game';
import { PhysicsObject } from './physics';

export interface Entity {
  id: string;
  type: string;
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
  physicsObject?: PhysicsObject;
  parent?: Entity;
  children: Entity[];
  onCollision?: (other: Entity, point: THREE.Vector3, normal: THREE.Vector3) => void;
  update: (dt: number) => void;
  destroy: () => void;
}

export interface Ball extends Entity {
  type: 'ball';
  radius: number;
  color: string;
  velocity: THREE.Vector3;
  mass: number;
  bounciness: number;
  friction: number;
  isHeld: boolean;
  trail: {
    enabled: boolean;
    maxPoints: number;
    width: number;
    color: string;
  };
  activePowerUps: {
    type: PowerUpType;
    remainingTime: number;
    strength: number;
  }[];
  applyForce: (force: THREE.Vector3) => void;
  applyImpulse: (impulse: THREE.Vector3) => void;
  hold: () => void;
  release: (impulse?: THREE.Vector3) => void;
  applyGravity: (dt: number) => void;
  applyFriction: (dt: number) => void;
  applyWind: (windDirection: THREE.Vector3, windStrength: number, dt: number) => void;
  checkCollisions: (obstacles: Entity[]) => void;
}

export interface Obstacle extends Entity {
  type: 'obstacle';
  obstacleType: ObstacleType;
  color: string;
  isBreakable: boolean;
  health: number;
  isStatic: boolean;
  damage: (amount: number) => void;
  onDestroy?: () => void;
}

export interface PowerUp extends Entity {
  type: 'powerup';
  powerUpType: PowerUpType;
  duration: number;
  strength: number;
  radius: number;
  onPickup: (ball: Ball) => void;
  respawnTime?: number;
  respawnCountdown?: number;
  isRespawning: boolean;
}

export interface Terrain extends Entity {
  type: 'terrain';
  width: number;
  height: number;
  depth: number;
  segments: number;
  heightMap?: THREE.Texture;
  texture: THREE.Texture;
  getHeightAt: (x: number, z: number) => number;
}

export interface Collectible extends Entity {
  type: 'collectible';
  collectibleType: 'star' | 'coin' | 'gem';
  value: number;
  collected: boolean;
  onCollect: (ball: Ball) => void;
}

export interface Particle extends Entity {
  type: 'particle';
  lifetime: number;
  remainingLife: number;
  color: THREE.Color;
  size: number;
  startSize: number;
  endSize: number;
  startColor: THREE.Color;
  endColor: THREE.Color;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  dampingFactor: number;
}

export interface Trigger extends Entity {
  type: 'trigger';
  radius: number;
  onEnter: (entity: Entity) => void;
  onExit: (entity: Entity) => void;
  entitiesInside: Set<Entity>;
}

export interface CameraTarget extends Entity {
  type: 'camera_target';
  targetEntities: Entity[];
  offset: THREE.Vector3;
  damping: number;
  lookAt: boolean;
  fov: number;
}

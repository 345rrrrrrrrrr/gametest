import * as THREE from 'three';

export interface PhysicsProperties {
  mass: number;
  friction: number;
  restitution: number; // bounciness
  linearDamping: number;
  angularDamping: number;
  fixedRotation: boolean;
  gravity: number;
  collisionGroup: number;
  collisionMask: number;
  material: string;
  isTrigger: boolean;
  isKinematic: boolean;
}

export const DefaultPhysicsProperties: PhysicsProperties = {
  mass: 1,
  friction: 0.5,
  restitution: 0.5,
  linearDamping: 0.1,
  angularDamping: 0.1,
  fixedRotation: false,
  gravity: 1,
  collisionGroup: 1,
  collisionMask: 0xFFFF,
  material: 'default',
  isTrigger: false,
  isKinematic: false
};

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  rotation: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  forces: THREE.Vector3;
  torque: THREE.Vector3;
  mass: number;
  isStatic: boolean;
  isAwake: boolean;
  colliding: boolean;
  grounded: boolean;
  lastCollision?: CollisionEvent;
}

export interface CollisionEvent {
  bodyA: PhysicsObject;
  bodyB: PhysicsObject;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  impulse: number;
  time: number;
}

export interface RaycastResult {
  hit: boolean;
  point?: THREE.Vector3;
  normal?: THREE.Vector3;
  distance?: number;
  object?: PhysicsObject;
}

export interface PhysicsObject {
  id: string;
  type: 'sphere' | 'box' | 'cylinder' | 'plane' | 'mesh' | 'compound';
  properties: PhysicsProperties;
  state: PhysicsState;
  shape: PhysicsShape;
  userData: any;
  update: (dt: number) => void;
  applyForce: (force: THREE.Vector3, point?: THREE.Vector3) => void;
  applyImpulse: (impulse: THREE.Vector3, point?: THREE.Vector3) => void;
  applyTorque: (torque: THREE.Vector3) => void;
  setPosition: (position: THREE.Vector3) => void;
  setRotation: (rotation: THREE.Quaternion) => void;
  setVelocity: (velocity: THREE.Vector3) => void;
  setAngularVelocity: (angularVelocity: THREE.Vector3) => void;
  getAABB: () => { min: THREE.Vector3, max: THREE.Vector3 };
  getTransform: () => { position: THREE.Vector3, rotation: THREE.Quaternion };
}

export interface PhysicsShape {
  type: 'sphere' | 'box' | 'cylinder' | 'plane' | 'mesh' | 'compound';
  parameters: any;
  getBoundingSphere: () => { center: THREE.Vector3, radius: number };
}

export interface PhysicsWorld {
  objects: Map<string, PhysicsObject>;
  gravity: THREE.Vector3;
  step: (dt: number) => void;
  addObject: (object: PhysicsObject) => void;
  removeObject: (id: string) => void;
  raycast: (from: THREE.Vector3, to: THREE.Vector3) => RaycastResult;
  setGravity: (gravity: THREE.Vector3) => void;
  findCollisions: () => CollisionEvent[];
  resolveCollisions: (collisions: CollisionEvent[]) => void;
  applyForces: () => void;
}

export interface ConstraintOptions {
  type: 'distance' | 'hinge' | 'point-to-point' | 'slider' | 'cone-twist';
  bodyA: PhysicsObject;
  bodyB?: PhysicsObject;
  pivotA?: THREE.Vector3;
  pivotB?: THREE.Vector3;
  axisA?: THREE.Vector3;
  axisB?: THREE.Vector3;
  minDistance?: number;
  maxDistance?: number;
  damping?: number;
  stiffness?: number;
  angularOnly?: boolean;
  collision?: boolean;
}

export interface PhysicsConstraint {
  id: string;
  type: string;
  bodyA: PhysicsObject;
  bodyB?: PhysicsObject;
  options: ConstraintOptions;
  update: () => void;
  applyConstraint: () => void;
  disable: () => void;
  enable: () => void;
  isEnabled: boolean;
}

import { create } from 'zustand';
import * as THREE from 'three';
import { BallPhysics } from '../physics/BallPhysics';
import { CollisionSystem } from '../physics/CollisionSystem';
import { ForceField } from '../physics/ForceField';

// Types
export interface PhysicsBall {
  id: string;
  object: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  mass: number;
  bounciness: number;
  friction: number;
  color: THREE.Color;
  special?: string;
}

export interface PhysicsObstacle {
  id: string;
  type: string;
  object: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  mass: number;
  material: string;
  behavior: string;
  breakable?: boolean;
}

export interface PhysicsTerrain {
  id: string;
  type: string;
  object: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

export interface PhysicsPowerUp {
  id: string;
  type: string;
  object: THREE.Object3D;
  position: THREE.Vector3;
  duration: number;
  strength: number;
  active: boolean;
}

// Store state interface
interface PhysicsState {
  // Physics parameters
  gravity: number;
  bounciness: number;
  friction: number;
  windForce: number;
  windDirection: number;
  timeScale: number;
  
  // Object collections
  balls: PhysicsBall[];
  obstacles: PhysicsObstacle[];
  terrains: PhysicsTerrain[];
  powerUps: PhysicsPowerUp[];
  
  // Effects and forces
  activeEffects: string[];
  impactForce: number;
  
  // Helpers
  ballPhysics: BallPhysics;
  collisionSystem: CollisionSystem;
  forceFields: ForceField[];
  
  // Event callbacks
  collisionCallbacks: ((objA: any, objB: any, point: THREE.Vector3) => void)[];
  impactCallbacks: ((force: number) => void)[];
  particleEmitCallbacks: ((position: THREE.Vector3, velocity: THREE.Vector3, color: THREE.Color, size: number, life: number) => void)[];
  
  // State management
  initialized: boolean;
  
  // Methods
  initialize: () => void;
  cleanup: () => void;
  update: (delta: number, keys: any) => void;
  
  // Ball methods
  addBall: (ball: PhysicsBall) => void;
  removeBall: (id: string) => void;
  getBall: (id: string) => PhysicsBall | undefined;
  getBalls: () => PhysicsBall[];
  getBallVelocity: (id: string) => THREE.Vector3;
  applyForceToBall: (id: string, force: THREE.Vector3) => void;
  applyImpulseToBall: (id: string, impulse: THREE.Vector3) => void;
  applyImpulseToAllBalls: (impulse: THREE.Vector3) => void;
  modifyBallSize: (scale: number, duration: number) => void;
  createBall: (options: any) => void;
  
  // Obstacle methods
  addObstacle: (obstacle: PhysicsObstacle) => void;
  removeObstacle: (id: string) => void;
  getObstacle: (id: string) => PhysicsObstacle | undefined;
  getObstacles: () => PhysicsObstacle[];
  updateObstaclePosition: (id: string, position: THREE.Vector3) => void;
  createObstacle: (options: any) => void;
  
  // Terrain methods
  addTerrain: (terrain: PhysicsTerrain) => void;
  removeTerrain: (id: string) => void;
  
  // Power-up methods
  addPowerUp: (powerUp: PhysicsPowerUp) => void;
  removePowerUp: (id: string) => void;
  getPowerUps: () => PhysicsPowerUp[];
  createPowerUp: (options: any) => void;
  
  // Global effects
  triggerExplosion: (position: THREE.Vector3, radius: number, force: number) => void;
  applyGlobalForce: (effectName: string, strength: number, duration: number) => void;
  modifyGravity: (scale: number, duration: number) => void;
  reverseGravity: (duration: number) => void;
  enableMagnetism: (duration: number) => void;
  modifyTimeScale: (scale: number, duration: number) => void;
  slowMotion: (scale: number, duration: number) => void;
  
  // Physics parameter setters
  setGravity: (value: number) => void;
  setBounciness: (value: number) => void;
  setFriction: (value: number) => void;
  setWindForce: (value: number) => void;
  setWindDirection: (value: number) => void;
  
  // Event registration
  onCollision: (callback: (objA: any, objB: any, point: THREE.Vector3) => void) => void;
  offCollision: (callback: (objA: any, objB: any, point: THREE.Vector3) => void) => void;
  onImpact: (callback: (force: number) => void) => void;
  offImpact: () => void;
  onParticleEmit: (callback: (position: THREE.Vector3, velocity: THREE.Vector3, color: THREE.Color, size: number, life: number) => void) => void;
  offParticleEmit: () => void;
  
  // Utility methods
  getImpactForce: () => number;
  getActiveEffects: () => string[];
  checkWinCondition: () => boolean;
}

export const usePhysics = create<PhysicsState>((set, get) => ({
  // Initial physics parameters
  gravity: 9.81,
  bounciness: 0.7,
  friction: 0.98,
  windForce: 0,
  windDirection: 0,
  timeScale: 1,
  
  // Object collections
  balls: [],
  obstacles: [],
  terrains: [],
  powerUps: [],
  
  // Effects and forces
  activeEffects: [],
  impactForce: 0,
  
  // Helpers
  ballPhysics: new BallPhysics(),
  collisionSystem: new CollisionSystem(),
  forceFields: [],
  
  // Event callbacks
  collisionCallbacks: [],
  impactCallbacks: [],
  particleEmitCallbacks: [],
  
  // State management
  initialized: false,
  
  // Initialize physics system
  initialize: () => {
    console.log("Initializing physics system");
    const ballPhysics = new BallPhysics();
    const collisionSystem = new CollisionSystem();
    
    set({
      ballPhysics,
      collisionSystem,
      initialized: true,
      balls: [],
      obstacles: [],
      terrains: [],
      powerUps: [],
      activeEffects: [],
      forceFields: []
    });
  },
  
  // Clean up physics system
  cleanup: () => {
    console.log("Cleaning up physics system");
    
    set({
      balls: [],
      obstacles: [],
      terrains: [],
      powerUps: [],
      activeEffects: [],
      forceFields: [],
      initialized: false
    });
  },
  
  // Main physics update loop
  update: (delta, keys) => {
    const {
      balls, obstacles, terrains, forceFields,
      gravity, friction, windForce, windDirection, timeScale,
      collisionSystem, ballPhysics, collisionCallbacks
    } = get();
    
    // Apply time scaling
    const scaledDelta = delta * timeScale;
    
    // Update all balls
    balls.forEach(ball => {
      // Apply gravity
      ball.velocity.y -= gravity * scaledDelta;
      
      // Apply wind
      if (windForce !== 0) {
        const windRadians = (windDirection * Math.PI) / 180;
        const windVector = new THREE.Vector3(
          Math.sin(windRadians) * windForce,
          0,
          Math.cos(windRadians) * windForce
        );
        ball.velocity.add(windVector.multiplyScalar(scaledDelta * 0.1));
      }
      
      // Apply force fields
      forceFields.forEach(field => {
        field.applyToObject(ball, scaledDelta);
      });
      
      // Apply friction
      ball.velocity.multiplyScalar(friction);
      
      // Update position
      const movement = ball.velocity.clone().multiplyScalar(scaledDelta);
      ball.position.add(movement);
      
      // Update mesh position
      if (ball.object) {
        ball.object.position.copy(ball.position);
        
        // Store velocity in userData for other components to use
        ball.object.userData.velocity = ball.velocity.clone();
      }
    });
    
    // Check for collisions
    const collisions = collisionSystem.detectCollisions(balls, obstacles, terrains);
    
    // Resolve collisions
    collisions.forEach(collision => {
      ballPhysics.resolveCollision(collision, scaledDelta);
      
      // Trigger collision callbacks
      collisionCallbacks.forEach(callback => {
        callback(collision.objectA, collision.objectB, collision.point);
      });
      
      // Track impact force for effects
      const impactSpeed = collision.relativeVelocity.length();
      if (impactSpeed > 5) {
        set({ impactForce: impactSpeed });
      }
    });
    
    // Check and update active effects
    const now = Date.now();
    const activeEffects = get().activeEffects.filter(effect => {
      const [name, endTime] = effect.split(':');
      return parseInt(endTime) > now;
    });
    
    if (activeEffects.length !== get().activeEffects.length) {
      set({ activeEffects });
    }
    
    // Decay impact force
    if (get().impactForce > 0) {
      set(state => ({ impactForce: state.impactForce * 0.95 }));
    }
  },
  
  // Ball methods
  addBall: (ball) => {
    set(state => ({ balls: [...state.balls, ball] }));
  },
  
  removeBall: (id) => {
    set(state => ({ balls: state.balls.filter(ball => ball.id !== id) }));
  },
  
  getBall: (id) => {
    return get().balls.find(ball => ball.id === id);
  },
  
  getBalls: () => {
    return get().balls;
  },
  
  getBallVelocity: (id) => {
    const ball = get().getBall(id);
    return ball ? ball.velocity : new THREE.Vector3();
  },
  
  applyForceToBall: (id, force) => {
    set(state => ({
      balls: state.balls.map(ball => {
        if (ball.id === id) {
          ball.velocity.add(force.clone().divideScalar(ball.mass));
        }
        return ball;
      })
    }));
  },
  
  applyImpulseToBall: (id, impulse) => {
    set(state => ({
      balls: state.balls.map(ball => {
        if (ball.id === id) {
          ball.velocity.add(impulse.clone());
        }
        return ball;
      })
    }));
  },
  
  applyImpulseToAllBalls: (impulse) => {
    set(state => ({
      balls: state.balls.map(ball => {
        ball.velocity.add(impulse.clone());
        return ball;
      })
    }));
  },
  
  modifyBallSize: (scale, duration) => {
    // Change the size of all balls temporarily
    set(state => ({
      balls: state.balls.map(ball => {
        // Store original radius if not already stored
        if (!ball.object.userData.originalRadius) {
          ball.object.userData.originalRadius = ball.radius;
        }
        
        // Apply new radius
        const newRadius = ball.object.userData.originalRadius * scale;
        ball.radius = newRadius;
        
        // Also scale the mesh
        ball.object.scale.set(scale, scale, scale);
        
        return ball;
      }),
      activeEffects: [
        ...state.activeEffects.filter(e => !e.startsWith('size:')),
        `size:${Date.now() + duration * 1000}`
      ]
    }));
    
    // Restore original size after duration
    setTimeout(() => {
      set(state => ({
        balls: state.balls.map(ball => {
          if (ball.object.userData.originalRadius) {
            ball.radius = ball.object.userData.originalRadius;
            ball.object.scale.set(1, 1, 1);
          }
          return ball;
        }),
        activeEffects: state.activeEffects.filter(e => !e.startsWith('size:'))
      }));
    }, duration * 1000);
  },
  
  createBall: (options) => {
    const id = `ball-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const position = new THREE.Vector3(...(options.position || [0, 5, 0]));
    const velocity = new THREE.Vector3(...(options.velocity || [0, 0, 0]));
    const radius = options.radius || 1;
    const mass = options.mass || 1;
    const color = new THREE.Color(options.color || 0x3498db);
    
    // Create a temporary mesh for storage
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    const ball: PhysicsBall = {
      id,
      object: mesh,
      position,
      velocity,
      radius,
      mass,
      bounciness: options.bounciness || get().bounciness,
      friction: options.friction || get().friction,
      color,
      special: options.special
    };
    
    get().addBall(ball);
    return id;
  },
  
  // Obstacle methods
  addObstacle: (obstacle) => {
    set(state => ({ obstacles: [...state.obstacles, obstacle] }));
  },
  
  removeObstacle: (id) => {
    set(state => ({ obstacles: state.obstacles.filter(obs => obs.id !== id) }));
  },
  
  getObstacle: (id) => {
    return get().obstacles.find(obs => obs.id === id);
  },
  
  getObstacles: () => {
    return get().obstacles;
  },
  
  updateObstaclePosition: (id, position) => {
    set(state => ({
      obstacles: state.obstacles.map(obs => {
        if (obs.id === id) {
          obs.position.copy(position);
        }
        return obs;
      })
    }));
  },
  
  createObstacle: (options) => {
    const id = `obstacle-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const type = options.type || 'box';
    const position = new THREE.Vector3(...(options.position || [0, 0, 0]));
    const rotation = new THREE.Euler(...(options.rotation || [0, 0, 0]));
    const scale = new THREE.Vector3(...(options.scale || [1, 1, 1]));
    const color = options.color || '#f5f5f5';
    
    // Create a temporary mesh for storage
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.copy(scale);
    
    const obstacle: PhysicsObstacle = {
      id,
      type,
      object: mesh,
      position,
      rotation,
      scale,
      mass: options.mass || 0,
      material: options.material || 'wood',
      behavior: options.behavior || 'static',
      breakable: options.breakable || false
    };
    
    get().addObstacle(obstacle);
    return id;
  },
  
  // Terrain methods
  addTerrain: (terrain) => {
    set(state => ({ terrains: [...state.terrains, terrain] }));
  },
  
  removeTerrain: (id) => {
    set(state => ({ terrains: state.terrains.filter(t => t.id !== id) }));
  },
  
  // Power-up methods
  addPowerUp: (powerUp) => {
    set(state => ({ powerUps: [...state.powerUps, powerUp] }));
  },
  
  removePowerUp: (id) => {
    set(state => ({ powerUps: state.powerUps.filter(p => p.id !== id) }));
  },
  
  getPowerUps: () => {
    return get().powerUps;
  },
  
  createPowerUp: (options) => {
    const id = `powerup-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const type = options.type || 'speed';
    const position = new THREE.Vector3(...(options.position || [0, 1, 0]));
    
    // Create a temporary object for storage
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: '#3498db' });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    const powerUp: PhysicsPowerUp = {
      id,
      type,
      object: mesh,
      position,
      duration: options.duration || 10,
      strength: options.strength || 1,
      active: options.active !== undefined ? options.active : true
    };
    
    get().addPowerUp(powerUp);
    return id;
  },
  
  // Global effects
  triggerExplosion: (position, radius, force) => {
    const { balls, obstacles, particleEmitCallbacks } = get();
    
    // Apply forces to nearby balls
    balls.forEach(ball => {
      const distance = ball.position.distanceTo(position);
      
      // Only affect balls within the radius
      if (distance < radius) {
        // Calculate force based on distance (inverse square law)
        const forceMultiplier = 1 - (distance / radius);
        const direction = ball.position.clone().sub(position).normalize();
        const explosionForce = direction.multiplyScalar(force * forceMultiplier);
        
        // Apply impulse to the ball
        ball.velocity.add(explosionForce);
      }
    });
    
    // Generate particles
    if (particleEmitCallbacks.length > 0) {
      // Number of particles based on force and radius
      const particleCount = Math.floor(radius * force * 0.5);
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const upAngle = Math.random() * Math.PI;
        const speed = 2 + Math.random() * (force * 0.5);
        
        const velocity = new THREE.Vector3(
          Math.sin(angle) * Math.sin(upAngle) * speed,
          Math.cos(upAngle) * speed,
          Math.cos(angle) * Math.sin(upAngle) * speed
        );
        
        // Random color from yellow to red
        const color = new THREE.Color(
          1,
          Math.random() * 0.5,
          0
        );
        
        // Random size and lifetime
        const size = 0.1 + Math.random() * 0.3;
        const life = 0.5 + Math.random() * 1.5;
        
        particleEmitCallbacks.forEach(callback => {
          callback(position, velocity, color, size, life);
        });
      }
    }
    
    // Create a force field effect
    const explosionField = new ForceField({
      position: position,
      type: 'radial',
      strength: force * 0.5,
      radius,
      decay: 0.8,
      duration: 1
    });
    
    set(state => ({
      forceFields: [...state.forceFields, explosionField],
      activeEffects: [...state.activeEffects, `explosion:${Date.now() + 1000}`]
    }));
    
    // Set impact force for effects
    set({ impactForce: force * 2 });
    
    // Remove force field after it expires
    setTimeout(() => {
      set(state => ({
        forceFields: state.forceFields.filter(f => f !== explosionField),
        activeEffects: state.activeEffects.filter(e => !e.startsWith('explosion:'))
      }));
    }, 1000);
  },
  
  applyGlobalForce: (effectName, strength, duration) => {
    const now = Date.now();
    const endTime = now + duration * 1000;
    
    // Add to active effects
    set(state => ({
      activeEffects: [
        ...state.activeEffects.filter(e => !e.startsWith(`${effectName}:`)),
        `${effectName}:${endTime}`
      ]
    }));
    
    // Remove after duration
    setTimeout(() => {
      set(state => ({
        activeEffects: state.activeEffects.filter(e => !e.startsWith(`${effectName}:`))
      }));
    }, duration * 1000);
    
    // Handle specific effects
    switch (effectName) {
      case 'speedBoost':
        // Apply an instant velocity boost to all balls
        set(state => ({
          balls: state.balls.map(ball => {
            const currentSpeed = ball.velocity.length();
            if (currentSpeed > 0.1) {
              // Boost in the current direction
              ball.velocity.normalize().multiplyScalar(currentSpeed + strength * 5);
            }
            return ball;
          })
        }));
        break;
        
      case 'jumpBoost':
        // Apply an upward impulse to all balls
        set(state => ({
          balls: state.balls.map(ball => {
            ball.velocity.y += strength * 10;
            return ball;
          })
        }));
        break;
    }
  },
  
  modifyGravity: (scale, duration) => {
    const originalGravity = get().gravity;
    const newGravity = originalGravity * scale;
    
    // Set new gravity
    set({
      gravity: newGravity,
      activeEffects: [
        ...get().activeEffects.filter(e => !e.startsWith('gravity:')),
        `gravity:${Date.now() + duration * 1000}`
      ]
    });
    
    // Restore after duration
    setTimeout(() => {
      set({
        gravity: originalGravity,
        activeEffects: get().activeEffects.filter(e => !e.startsWith('gravity:'))
      });
    }, duration * 1000);
  },
  
  reverseGravity: (duration) => {
    const originalGravity = get().gravity;
    
    // Reverse gravity
    set({
      gravity: -originalGravity,
      activeEffects: [
        ...get().activeEffects.filter(e => !e.startsWith('gravity:')),
        `gravity:${Date.now() + duration * 1000}`
      ]
    });
    
    // Restore after duration
    setTimeout(() => {
      set({
        gravity: originalGravity,
        activeEffects: get().activeEffects.filter(e => !e.startsWith('gravity:'))
      });
    }, duration * 1000);
  },
  
  enableMagnetism: (duration) => {
    // Create a magnetic force field at the center
    const center = new THREE.Vector3(0, 0, 0);
    
    const magneticField = new ForceField({
      position: center,
      type: 'magnetic',
      strength: 5,
      radius: 20,
      decay: 0.5,
      duration
    });
    
    set(state => ({
      forceFields: [...state.forceFields, magneticField],
      activeEffects: [
        ...state.activeEffects.filter(e => !e.startsWith('magnetism:')),
        `magnetism:${Date.now() + duration * 1000}`
      ]
    }));
    
    // Remove force field after it expires
    setTimeout(() => {
      set(state => ({
        forceFields: state.forceFields.filter(f => f !== magneticField),
        activeEffects: state.activeEffects.filter(e => !e.startsWith('magnetism:'))
      }));
    }, duration * 1000);
  },
  
  modifyTimeScale: (scale, duration) => {
    const originalTimeScale = get().timeScale;
    
    // Set new time scale
    set({
      timeScale: scale,
      activeEffects: [
        ...get().activeEffects.filter(e => !e.startsWith('timeScale:')),
        `timeScale:${Date.now() + duration * 1000}`
      ]
    });
    
    // Restore after duration
    setTimeout(() => {
      set({
        timeScale: originalTimeScale,
        activeEffects: get().activeEffects.filter(e => !e.startsWith('timeScale:'))
      });
    }, duration * 1000);
  },
  
  slowMotion: (scale, duration) => {
    get().modifyTimeScale(scale, duration);
  },
  
  // Physics parameter setters
  setGravity: (value) => {
    set({ gravity: value });
  },
  
  setBounciness: (value) => {
    set({ bounciness: value });
  },
  
  setFriction: (value) => {
    set({ friction: value });
  },
  
  setWindForce: (value) => {
    set({ windForce: value });
  },
  
  setWindDirection: (value) => {
    set({ windDirection: value });
  },
  
  // Event registration
  onCollision: (callback) => {
    set(state => ({
      collisionCallbacks: [...state.collisionCallbacks, callback]
    }));
  },
  
  offCollision: (callback) => {
    set(state => ({
      collisionCallbacks: state.collisionCallbacks.filter(cb => cb !== callback)
    }));
  },
  
  onImpact: (callback) => {
    set(state => ({
      impactCallbacks: [...state.impactCallbacks, callback]
    }));
  },
  
  offImpact: () => {
    set({ impactCallbacks: [] });
  },
  
  onParticleEmit: (callback) => {
    set(state => ({
      particleEmitCallbacks: [...state.particleEmitCallbacks, callback]
    }));
  },
  
  offParticleEmit: () => {
    set({ particleEmitCallbacks: [] });
  },
  
  // Utility methods
  getImpactForce: () => {
    return get().impactForce;
  },
  
  getActiveEffects: () => {
    // Return just the effect names without timestamps
    return get().activeEffects.map(effect => effect.split(':')[0]);
  },
  
  checkWinCondition: () => {
    // Can be customized based on game mode/level
    return false;
  }
}));

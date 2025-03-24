import * as THREE from 'three';
import { 
  PhysicsWorld, PhysicsObject, PhysicsProperties, PhysicsState,
  PhysicsShape, CollisionEvent, RaycastResult, PhysicsConstraint
} from '../../types/physics';
import { 
  GRAVITY, DEFAULT_FRICTION, DEFAULT_RESTITUTION,
  DEFAULT_MASS, DEFAULT_DAMPING, MAX_VELOCITY, SLEEP_THRESHOLD
} from '../constants';
import { createBoxShape, createSphereShape, createCylinderShape, createPlaneShape } from './objects';
import { detectCollision, resolveCollision } from './collisions';
import { generateUUID } from '../utils/helpers';

class PhysicsEngine implements PhysicsWorld {
  objects: Map<string, PhysicsObject>;
  gravity: THREE.Vector3;
  constraints: Map<string, PhysicsConstraint>;
  accumulator: number;
  
  constructor() {
    this.objects = new Map();
    this.constraints = new Map();
    this.gravity = GRAVITY.clone();
    this.accumulator = 0;
  }
  
  step(dt: number): void {
    // Apply forces to all objects
    this.applyForces();
    
    // Find and resolve collisions
    const collisions = this.findCollisions();
    this.resolveCollisions(collisions);
    
    // Apply constraints
    this.constraints.forEach(constraint => constraint.applyConstraint());
    
    // Update all physics objects
    this.objects.forEach(obj => obj.update(dt));
  }
  
  addObject(object: PhysicsObject): void {
    this.objects.set(object.id, object);
  }
  
  removeObject(id: string): void {
    this.objects.delete(id);
  }
  
  raycast(from: THREE.Vector3, to: THREE.Vector3): RaycastResult {
    const direction = new THREE.Vector3().subVectors(to, from).normalize();
    const length = from.distanceTo(to);
    
    let closestHit: RaycastResult = { hit: false };
    let closestDistance = Infinity;
    
    this.objects.forEach(obj => {
      // Skip triggers for raycasts
      if (obj.properties.isTrigger) return;
      
      // Get object bounding sphere
      const boundingSphere = obj.shape.getBoundingSphere();
      
      // Ray-sphere intersection test
      const rayToSphere = new THREE.Vector3().subVectors(boundingSphere.center, from);
      const tca = rayToSphere.dot(direction);
      
      if (tca < 0) return; // Sphere is behind ray
      
      const d2 = rayToSphere.dot(rayToSphere) - tca * tca;
      const r2 = boundingSphere.radius * boundingSphere.radius;
      
      if (d2 > r2) return; // Ray misses sphere
      
      const thc = Math.sqrt(r2 - d2);
      const t0 = tca - thc;
      const t1 = tca + thc;
      
      let t = t0;
      if (t0 < 0) {
        t = t1; // If t0 is negative, use t1
        if (t1 < 0) return; // Both t0 and t1 are negative, ray starts inside sphere and points away
      }
      
      if (t > length) return; // Intersection is beyond ray length
      
      if (t < closestDistance) {
        const hitPoint = new THREE.Vector3().copy(from).addScaledVector(direction, t);
        const normal = new THREE.Vector3().subVectors(hitPoint, boundingSphere.center).normalize();
        
        closestHit = {
          hit: true,
          point: hitPoint,
          normal: normal,
          distance: t,
          object: obj
        };
        
        closestDistance = t;
      }
    });
    
    return closestHit;
  }
  
  setGravity(gravity: THREE.Vector3): void {
    this.gravity.copy(gravity);
  }
  
  findCollisions(): CollisionEvent[] {
    const collisions: CollisionEvent[] = [];
    const objectArray = Array.from(this.objects.values());
    
    // Broad phase: simple n^2 for now
    for (let i = 0; i < objectArray.length; i++) {
      const objA = objectArray[i];
      
      // Skip static-static collisions
      if (objA.properties.isKinematic) continue;
      
      for (let j = i + 1; j < objectArray.length; j++) {
        const objB = objectArray[j];
        
        // Skip if both objects are kinematic
        if (objA.properties.isKinematic && objB.properties.isKinematic) continue;
        
        // Check collision masks
        if (!(objA.properties.collisionGroup & objB.properties.collisionMask) || 
            !(objB.properties.collisionGroup & objA.properties.collisionMask)) {
          continue;
        }
        
        // Get bounding spheres for quick rejection test
        const sphereA = objA.shape.getBoundingSphere();
        const sphereB = objB.shape.getBoundingSphere();
        
        const distance = sphereA.center.distanceTo(sphereB.center);
        const radiusSum = sphereA.radius + sphereB.radius;
        
        if (distance > radiusSum) continue;
        
        // Narrow phase: detect actual collision
        const result = detectCollision(objA, objB);
        if (result) {
          collisions.push({
            bodyA: objA,
            bodyB: objB,
            point: result.point,
            normal: result.normal,
            impulse: 0, // Will be calculated during resolution
            time: performance.now()
          });
        }
      }
    }
    
    return collisions;
  }
  
  resolveCollisions(collisions: CollisionEvent[]): void {
    for (const collision of collisions) {
      const { bodyA, bodyB } = collision;
      
      if (bodyA.state.isStatic && bodyB.state.isStatic) continue;
      
      bodyA.state.colliding = true;
      bodyB.state.colliding = true;
      
      bodyA.state.lastCollision = collision;
      bodyB.state.lastCollision = collision;
      
      if (bodyA.properties.isTrigger || bodyB.properties.isTrigger) {
        // Handle trigger logic here
        continue;
      }
      
      // Resolve actual collision with physics
      const impulse = resolveCollision(bodyA, bodyB, collision.point, collision.normal);
      collision.impulse = impulse;
    }
  }
  
  applyForces(): void {
    this.objects.forEach(obj => {
      if (obj.properties.isKinematic || obj.state.isStatic) return;
      
      // Apply gravity
      const gravityForce = new THREE.Vector3()
        .copy(this.gravity)
        .multiplyScalar(obj.properties.mass * obj.properties.gravity);
      
      obj.applyForce(gravityForce);
    });
  }
  
  addConstraint(constraint: PhysicsConstraint): void {
    this.constraints.set(constraint.id, constraint);
  }
  
  removeConstraint(id: string): void {
    this.constraints.delete(id);
  }
  
  createSphereBody(
    radius: number, 
    position: THREE.Vector3, 
    properties?: Partial<PhysicsProperties>
  ): PhysicsObject {
    const mergedProperties = this.mergeWithDefaultProperties(properties);
    const id = generateUUID();
    const shape = createSphereShape(radius);
    
    return this.createBody(id, 'sphere', shape, position, mergedProperties);
  }
  
  createBoxBody(
    size: THREE.Vector3, 
    position: THREE.Vector3, 
    properties?: Partial<PhysicsProperties>
  ): PhysicsObject {
    const mergedProperties = this.mergeWithDefaultProperties(properties);
    const id = generateUUID();
    const shape = createBoxShape(size);
    
    return this.createBody(id, 'box', shape, position, mergedProperties);
  }
  
  createCylinderBody(
    radius: number,
    height: number,
    position: THREE.Vector3,
    properties?: Partial<PhysicsProperties>
  ): PhysicsObject {
    const mergedProperties = this.mergeWithDefaultProperties(properties);
    const id = generateUUID();
    const shape = createCylinderShape(radius, height);
    
    return this.createBody(id, 'cylinder', shape, position, mergedProperties);
  }
  
  createPlaneBody(
    normal: THREE.Vector3,
    position: THREE.Vector3,
    properties?: Partial<PhysicsProperties>
  ): PhysicsObject {
    const mergedProperties = this.mergeWithDefaultProperties({
      isKinematic: true,
      ...properties
    });
    const id = generateUUID();
    const shape = createPlaneShape(normal);
    
    return this.createBody(id, 'plane', shape, position, mergedProperties);
  }
  
  private createBody(
    id: string,
    type: string,
    shape: PhysicsShape,
    position: THREE.Vector3,
    properties: PhysicsProperties
  ): PhysicsObject {
    const state: PhysicsState = {
      position: position.clone(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      angularVelocity: new THREE.Vector3(),
      forces: new THREE.Vector3(),
      torque: new THREE.Vector3(),
      mass: properties.mass,
      isStatic: properties.isKinematic,
      isAwake: true,
      colliding: false,
      grounded: false
    };
    
    const physicsObject: PhysicsObject = {
      id,
      type: type as any,
      properties,
      state,
      shape,
      userData: {},
      
      update(dt: number): void {
        if (this.properties.isKinematic || this.state.isStatic) return;
        
        // Calculate acceleration from forces
        this.state.acceleration.copy(this.state.forces).divideScalar(this.properties.mass);
        
        // Update velocity
        this.state.velocity.addScaledVector(this.state.acceleration, dt);
        
        // Apply linear damping
        this.state.velocity.multiplyScalar(Math.pow(1 - this.properties.linearDamping, dt));
        
        // Clamp velocity
        if (this.state.velocity.length() > MAX_VELOCITY) {
          this.state.velocity.normalize().multiplyScalar(MAX_VELOCITY);
        }
        
        // Update position
        this.state.position.addScaledVector(this.state.velocity, dt);
        
        // Update angular velocity from torque
        const inverseInertia = 1.0; // Simplified inertia for now
        const angularAcceleration = this.state.torque.clone().multiplyScalar(inverseInertia);
        this.state.angularVelocity.addScaledVector(angularAcceleration, dt);
        
        // Apply angular damping
        this.state.angularVelocity.multiplyScalar(Math.pow(1 - this.properties.angularDamping, dt));
        
        // Update rotation
        if (!this.properties.fixedRotation) {
          const rotationChange = new THREE.Quaternion()
            .setFromAxisAngle(this.state.angularVelocity.normalize(), this.state.angularVelocity.length() * dt);
          this.state.rotation.premultiply(rotationChange);
          this.state.rotation.normalize();
        }
        
        // Reset forces and torque for next frame
        this.state.forces.set(0, 0, 0);
        this.state.torque.set(0, 0, 0);
        
        // Sleep check
        const isMoving = this.state.velocity.lengthSq() > SLEEP_THRESHOLD || 
                         this.state.angularVelocity.lengthSq() > SLEEP_THRESHOLD;
        this.state.isAwake = isMoving || this.state.colliding;
      },
      
      applyForce(force: THREE.Vector3, point?: THREE.Vector3): void {
        if (this.properties.isKinematic || this.state.isStatic) return;
        
        this.state.forces.add(force);
        
        if (point && !this.properties.fixedRotation) {
          const relativePoint = point.clone().sub(this.state.position);
          const torque = new THREE.Vector3().crossVectors(relativePoint, force);
          this.state.torque.add(torque);
        }
        
        this.state.isAwake = true;
      },
      
      applyImpulse(impulse: THREE.Vector3, point?: THREE.Vector3): void {
        if (this.properties.isKinematic || this.state.isStatic) return;
        
        this.state.velocity.addScaledVector(impulse, 1 / this.properties.mass);
        
        if (point && !this.properties.fixedRotation) {
          const relativePoint = point.clone().sub(this.state.position);
          const angularImpulse = new THREE.Vector3().crossVectors(relativePoint, impulse);
          const inverseInertia = 1.0; // Simplified inertia for now
          this.state.angularVelocity.addScaledVector(angularImpulse, inverseInertia);
        }
        
        this.state.isAwake = true;
      },
      
      applyTorque(torque: THREE.Vector3): void {
        if (this.properties.isKinematic || this.state.isStatic || this.properties.fixedRotation) return;
        
        this.state.torque.add(torque);
        this.state.isAwake = true;
      },
      
      setPosition(position: THREE.Vector3): void {
        this.state.position.copy(position);
      },
      
      setRotation(rotation: THREE.Quaternion): void {
        this.state.rotation.copy(rotation);
      },
      
      setVelocity(velocity: THREE.Vector3): void {
        this.state.velocity.copy(velocity);
        this.state.isAwake = true;
      },
      
      setAngularVelocity(angularVelocity: THREE.Vector3): void {
        if (this.properties.fixedRotation) return;
        
        this.state.angularVelocity.copy(angularVelocity);
        this.state.isAwake = true;
      },
      
      getAABB() {
        // Calculate a simple AABB for basic collision detection
        const radius = shape.getBoundingSphere().radius;
        return {
          min: new THREE.Vector3(
            this.state.position.x - radius,
            this.state.position.y - radius,
            this.state.position.z - radius
          ),
          max: new THREE.Vector3(
            this.state.position.x + radius,
            this.state.position.y + radius,
            this.state.position.z + radius
          )
        };
      },
      
      getTransform() {
        return {
          position: this.state.position,
          rotation: this.state.rotation
        };
      }
    };
    
    this.addObject(physicsObject);
    return physicsObject;
  }
  
  private mergeWithDefaultProperties(properties?: Partial<PhysicsProperties>): PhysicsProperties {
    return {
      mass: DEFAULT_MASS,
      friction: DEFAULT_FRICTION,
      restitution: DEFAULT_RESTITUTION,
      linearDamping: DEFAULT_DAMPING,
      angularDamping: DEFAULT_DAMPING,
      fixedRotation: false,
      gravity: 1.0,
      collisionGroup: 1,
      collisionMask: 0xFFFF,
      material: 'default',
      isTrigger: false,
      isKinematic: false,
      ...properties
    };
  }
}

// Create and export a single physics engine instance
const physicsEngine = new PhysicsEngine();
export default physicsEngine;

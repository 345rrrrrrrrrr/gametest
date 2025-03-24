import * as THREE from 'three';
import { PhysicsObject } from '../../types/physics';

// Apply gravitational force between two objects
export function applyGravitationalForce(
  objectA: PhysicsObject,
  objectB: PhysicsObject,
  gravitationalConstant: number = 6.674e-11
): void {
  if (objectA.properties.isKinematic || objectB.properties.isKinematic) {
    return;
  }
  
  const direction = new THREE.Vector3().subVectors(
    objectB.state.position,
    objectA.state.position
  );
  
  const distanceSquared = direction.lengthSq();
  
  // Avoid division by zero and very small values
  if (distanceSquared < 0.0001) {
    return;
  }
  
  const forceMagnitude = 
    gravitationalConstant * 
    objectA.properties.mass * 
    objectB.properties.mass / 
    distanceSquared;
  
  const force = direction.normalize().multiplyScalar(forceMagnitude);
  
  objectA.applyForce(force);
  objectB.applyForce(force.clone().negate());
}

// Apply wind force to an object
export function applyWindForce(
  object: PhysicsObject,
  windDirection: THREE.Vector3,
  windStrength: number
): void {
  if (object.properties.isKinematic) {
    return;
  }
  
  // Simple wind implementation - can be extended for more realism
  const force = windDirection.clone().normalize().multiplyScalar(windStrength);
  
  // The force is modified by the object's surface area
  // For simplicity, we use the bounding sphere radius squared as an approximation
  const radius = object.shape.getBoundingSphere().radius;
  force.multiplyScalar(radius * radius);
  
  object.applyForce(force);
}

// Apply magnetic force between two objects
export function applyMagneticForce(
  objectA: PhysicsObject,
  objectB: PhysicsObject,
  strength: number,
  isPush: boolean = false
): void {
  if (objectA.properties.isKinematic || objectB.properties.isKinematic) {
    return;
  }
  
  const direction = new THREE.Vector3().subVectors(
    objectB.state.position,
    objectA.state.position
  );
  
  const distance = direction.length();
  
  // Avoid division by zero and very small values
  if (distance < 0.0001) {
    return;
  }
  
  // Magnetic force decreases with the square of the distance
  const forceMagnitude = strength / (distance * distance);
  
  const force = direction.normalize().multiplyScalar(forceMagnitude);
  
  if (isPush) {
    // Repelling force
    objectA.applyForce(force.clone().negate());
    objectB.applyForce(force);
  } else {
    // Attracting force
    objectA.applyForce(force);
    objectB.applyForce(force.clone().negate());
  }
}

// Apply explosion force to all objects within radius
export function applyExplosionForce(
  position: THREE.Vector3,
  radius: number,
  strength: number,
  objects: PhysicsObject[]
): void {
  objects.forEach(object => {
    if (object.properties.isKinematic) {
      return;
    }
    
    const direction = new THREE.Vector3().subVectors(
      object.state.position,
      position
    );
    
    const distance = direction.length();
    
    if (distance > radius) {
      return; // Object is outside explosion radius
    }
    
    // Force decreases linearly with distance
    const falloff = 1 - distance / radius;
    const forceMagnitude = strength * falloff;
    
    const force = direction.normalize().multiplyScalar(forceMagnitude);
    
    object.applyForce(force);
  });
}

// Apply drag force (air resistance)
export function applyDragForce(
  object: PhysicsObject,
  dragCoefficient: number = 0.5
): void {
  if (object.properties.isKinematic) {
    return;
  }
  
  // Drag force formula: F = -0.5 * rho * v^2 * Cd * A * v_hat
  // where rho is fluid density, v is velocity, Cd is drag coefficient, A is area
  // and v_hat is velocity unit vector
  
  const velocity = object.state.velocity;
  const velocitySquared = velocity.lengthSq();
  
  if (velocitySquared < 0.0001) {
    return; // Object isn't moving fast enough
  }
  
  // Simplified model: we use bounding sphere for area approximation
  const radius = object.shape.getBoundingSphere().radius;
  const area = Math.PI * radius * radius;
  
  const dragMagnitude = 0.5 * dragCoefficient * velocitySquared * area;
  
  const dragForce = velocity.clone().normalize().multiplyScalar(-dragMagnitude);
  
  object.applyForce(dragForce);
}

// Apply buoyancy force (for objects in water)
export function applyBuoyancyForce(
  object: PhysicsObject,
  waterHeight: number,
  fluidDensity: number = 1000 // Water density in kg/m^3
): void {
  if (object.properties.isKinematic) {
    return;
  }
  
  const position = object.state.position;
  const radius = object.shape.getBoundingSphere().radius;
  
  // Check if object is in water
  const lowestPoint = position.y - radius;
  const highestPoint = position.y + radius;
  
  if (lowestPoint > waterHeight) {
    return; // Object is completely above water
  }
  
  // Calculate submerged volume ratio (simplified for spheres)
  let submergedRatio = 0;
  
  if (highestPoint < waterHeight) {
    // Object is completely submerged
    submergedRatio = 1;
  } else {
    // Object is partially submerged
    const submergedHeight = waterHeight - lowestPoint;
    submergedRatio = submergedHeight / (2 * radius);
  }
  
  // Calculate buoyancy force
  // F = rho * g * V
  // where rho is fluid density, g is gravity, V is displaced volume
  
  // Approximate volume for a sphere
  const volume = (4/3) * Math.PI * Math.pow(radius, 3);
  const submergedVolume = volume * submergedRatio;
  
  const gravity = 9.81; // m/s^2
  const buoyancyMagnitude = fluidDensity * gravity * submergedVolume;
  
  const buoyancyForce = new THREE.Vector3(0, buoyancyMagnitude, 0);
  
  object.applyForce(buoyancyForce);
  
  // Optional: Add some drag forces for water resistance
  if (submergedRatio > 0) {
    applyDragForce(object, 1.0 * submergedRatio);
  }
}

// Apply vortex force (tornado/whirlpool effect)
export function applyVortexForce(
  object: PhysicsObject,
  center: THREE.Vector3,
  axis: THREE.Vector3,
  strength: number,
  radius: number
): void {
  if (object.properties.isKinematic) {
    return;
  }
  
  const position = object.state.position;
  const toObject = new THREE.Vector3().subVectors(position, center);
  
  // Project toObject onto the plane perpendicular to axis
  const projection = new THREE.Vector3().copy(toObject);
  const dot = toObject.dot(axis);
  projection.addScaledVector(axis, -dot / axis.lengthSq());
  
  const distance = projection.length();
  
  if (distance > radius) {
    return; // Object is outside vortex radius
  }
  
  // Calculate force direction (perpendicular to projection)
  const forceDirection = new THREE.Vector3().crossVectors(axis, projection).normalize();
  
  // Force magnitude decreases with distance from center
  const falloff = 1 - distance / radius;
  const forceMagnitude = strength * falloff;
  
  const force = forceDirection.multiplyScalar(forceMagnitude);
  
  // Add a small inward pull
  const inwardForce = projection.clone().normalize().multiplyScalar(-forceMagnitude * 0.1);
  force.add(inwardForce);
  
  object.applyForce(force);
}

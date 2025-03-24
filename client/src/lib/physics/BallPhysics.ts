import * as THREE from 'three';

// Define collision interface
export interface Collision {
  objectA: any;
  objectB: any;
  point: THREE.Vector3;
  normal: THREE.Vector3;
  depth: number;
  relativeVelocity: THREE.Vector3;
}

// Class handling ball physics calculations
export class BallPhysics {
  // Response coefficients
  private defaultBounciness: number = 0.7;
  private defaultFriction: number = 0.98;
  
  constructor() {}
  
  // Calculate how two objects bounce off each other
  public resolveCollision(collision: Collision, deltaTime: number): void {
    const { objectA, objectB, normal, depth, relativeVelocity } = collision;
    
    // Skip if objects don't have the necessary properties
    if (!objectA || !objectB) return;
    
    // Calculate bounciness (coefficient of restitution)
    const bounciness = this.getBounciness(objectA, objectB);
    
    // Calculate collision impulse
    // First determine if objects are moving toward each other
    const velocityAlongNormal = relativeVelocity.dot(normal);
    
    // Only resolve if objects are moving toward each other
    if (velocityAlongNormal > 0) return;
    
    // Calculate impulse scalar
    let j = -(1 + bounciness) * velocityAlongNormal;
    
    // Get masses
    const massA = objectA.mass || 1;
    const massB = objectB.mass || Number.POSITIVE_INFINITY; // Infinite mass for static objects
    
    // Calculate mass ratio for impulse distribution
    const totalMass = massA + massB;
    const ratioA = massB / totalMass;
    const ratioB = massA / totalMass;
    
    // Calculate impulse vector
    const impulse = normal.clone().multiplyScalar(j);
    
    // Apply positional correction to prevent sinking
    this.correctPosition(objectA, objectB, normal, depth);
    
    // Apply impulse to velocities
    if (objectA.velocity && objectA.mass !== Infinity) {
      objectA.velocity.sub(impulse.clone().multiplyScalar(ratioA / objectA.mass));
    }
    
    if (objectB.velocity && objectB.mass !== Infinity) {
      objectB.velocity.add(impulse.clone().multiplyScalar(ratioB / objectB.mass));
    }
    
    // Apply friction
    this.applyFriction(objectA, objectB, normal, deltaTime);
    
    // Handle special materials and interactions
    this.handleSpecialInteractions(objectA, objectB, collision);
  }
  
  // Get combined bounciness coefficient from two objects
  private getBounciness(objectA: any, objectB: any): number {
    const bouncinessA = objectA.bounciness !== undefined ? objectA.bounciness : this.defaultBounciness;
    const bouncinessB = objectB.bounciness !== undefined ? objectB.bounciness : this.defaultBounciness;
    
    // Average the bounciness values
    return (bouncinessA + bouncinessB) / 2;
  }
  
  // Apply friction to the tangential component of velocity
  private applyFriction(objectA: any, objectB: any, normal: THREE.Vector3, deltaTime: number): void {
    if (!objectA.velocity || !objectB) return;
    
    // Get friction coefficients
    const frictionA = objectA.friction !== undefined ? objectA.friction : this.defaultFriction;
    const frictionB = objectB.friction !== undefined ? objectB.friction : this.defaultFriction;
    
    // Calculate combined friction
    const friction = (frictionA + frictionB) / 2;
    
    // Get the tangential component of velocity (perpendicular to normal)
    const velocityNormal = normal.clone().multiplyScalar(objectA.velocity.dot(normal));
    const velocityTangent = objectA.velocity.clone().sub(velocityNormal);
    
    // Apply friction to tangential velocity
    if (velocityTangent.lengthSq() > 0.001) {
      // Calculate friction magnitude proportional to normal force
      const frictionMagnitude = velocityTangent.length() * friction * deltaTime;
      
      // Create friction vector
      const frictionVector = velocityTangent.normalize().multiplyScalar(-frictionMagnitude);
      
      // Apply friction (limited by available tangential velocity)
      if (frictionMagnitude > velocityTangent.length()) {
        objectA.velocity.sub(velocityTangent);
      } else {
        objectA.velocity.add(frictionVector);
      }
    }
  }
  
  // Correct positions to prevent sinking/tunneling
  private correctPosition(objectA: any, objectB: any, normal: THREE.Vector3, depth: number): void {
    // Skip if either object is not movable
    if (!objectA.position || !objectB.position) return;
    
    // Calculate correction vector
    const correction = normal.clone().multiplyScalar(depth * 0.8); // 80% of penetration
    
    // Calculate mass ratios
    const massA = objectA.mass || 1;
    const massB = objectB.mass || Number.POSITIVE_INFINITY;
    const totalMass = massA + massB;
    
    // Apply correction proportional to mass
    if (massA !== Infinity) {
      objectA.position.sub(correction.clone().multiplyScalar(massB / totalMass));
    }
    
    if (massB !== Infinity) {
      objectB.position.add(correction.clone().multiplyScalar(massA / totalMass));
    }
  }
  
  // Handle special material interactions and effects
  private handleSpecialInteractions(objectA: any, objectB: any, collision: Collision): void {
    // Check for special materials or object types
    if (objectA.special === 'bouncy' || objectB.material === 'bouncy') {
      // Add extra bounce
      if (objectA.velocity) {
        const bounceBoost = 0.3;
        objectA.velocity.multiplyScalar(1 + bounceBoost);
      }
    }
    
    if (objectA.special === 'sticky' || objectB.material === 'sticky') {
      // Reduce velocity
      if (objectA.velocity) {
        objectA.velocity.multiplyScalar(0.5);
      }
    }
    
    // Handle bumpers (extra impulse)
    if (objectB.type === 'bumper') {
      if (objectA.velocity) {
        // Calculate impulse direction away from bumper
        const impulseDir = collision.normal.clone();
        
        // Apply strong impulse in that direction
        const impulseMagnitude = 15;
        const impulse = impulseDir.multiplyScalar(impulseMagnitude);
        
        objectA.velocity.add(impulse);
      }
    }
    
    // Handle ice (reduced friction)
    if (objectB.type === 'ice' || objectB.material === 'ice') {
      if (objectA.velocity) {
        // Reduce friction greatly
        const iceMultiplier = 0.99;
        objectA.velocity.multiplyScalar(iceMultiplier);
      }
    }
    
    // Handle magnetic objects
    if (objectA.special === 'magnetic' || objectB.special === 'magnetic') {
      // Magnetic effect handled elsewhere in ForceField
    }
  }
  
  // Calculate ball spin based on collision
  public calculateSpin(ball: any, collision: Collision): THREE.Vector3 {
    if (!ball.angularVelocity) {
      ball.angularVelocity = new THREE.Vector3(0, 0, 0);
    }
    
    // Calculate spin axis based on collision normal and ball velocity
    const spinAxis = new THREE.Vector3().crossVectors(
      collision.normal,
      ball.velocity
    ).normalize();
    
    // Calculate spin magnitude based on velocity component tangent to collision
    const normalVel = collision.normal.clone().multiplyScalar(ball.velocity.dot(collision.normal));
    const tangentVel = ball.velocity.clone().sub(normalVel);
    
    const spinMagnitude = tangentVel.length() * 0.5 / ball.radius;
    
    // Add to existing angular velocity
    const newSpin = spinAxis.multiplyScalar(spinMagnitude);
    ball.angularVelocity.add(newSpin);
    
    // Apply damping to prevent excessive spin
    ball.angularVelocity.multiplyScalar(0.95);
    
    return ball.angularVelocity;
  }
}

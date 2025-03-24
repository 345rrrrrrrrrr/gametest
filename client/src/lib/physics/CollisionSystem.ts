import * as THREE from 'three';
import { Collision } from './BallPhysics';
import { PhysicsBall, PhysicsObstacle, PhysicsTerrain } from '../stores/usePhysics';

export class CollisionSystem {
  private lastCollisions: Map<string, number> = new Map();
  private collisionCooldown: number = 50; // ms between same object collisions
  
  constructor() {}
  
  public detectCollisions(
    balls: PhysicsBall[],
    obstacles: PhysicsObstacle[],
    terrains: PhysicsTerrain[]
  ): Collision[] {
    const collisions: Collision[] = [];
    
    // Ball-to-ball collisions
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const collision = this.checkBallToBallCollision(balls[i], balls[j]);
        if (collision) {
          collisions.push(collision);
        }
      }
    }
    
    // Ball-to-obstacle collisions
    for (const ball of balls) {
      for (const obstacle of obstacles) {
        const collision = this.checkBallToObstacleCollision(ball, obstacle);
        if (collision) {
          collisions.push(collision);
        }
      }
    }
    
    // Ball-to-terrain collisions
    for (const ball of balls) {
      for (const terrain of terrains) {
        const collision = this.checkBallToTerrainCollision(ball, terrain);
        if (collision) {
          collisions.push(collision);
        }
      }
    }
    
    return collisions;
  }
  
  private checkBallToBallCollision(ballA: PhysicsBall, ballB: PhysicsBall): Collision | null {
    // Calculate collision key for cooldown tracking
    const collisionKey = `${ballA.id}-${ballB.id}`;
    
    // Skip if on cooldown
    const now = Date.now();
    if (this.lastCollisions.has(collisionKey)) {
      const lastTime = this.lastCollisions.get(collisionKey)!;
      if (now - lastTime < this.collisionCooldown) {
        return null;
      }
    }
    
    // Calculate distance between ball centers
    const distance = ballA.position.distanceTo(ballB.position);
    const combinedRadius = ballA.radius + ballB.radius;
    
    // Check for collision
    if (distance < combinedRadius) {
      // Calculate collision normal
      const normal = new THREE.Vector3()
        .subVectors(ballB.position, ballA.position)
        .normalize();
      
      // Calculate collision depth
      const depth = combinedRadius - distance;
      
      // Calculate collision point
      const point = new THREE.Vector3()
        .copy(ballA.position)
        .add(normal.clone().multiplyScalar(ballA.radius));
      
      // Calculate relative velocity
      const relativeVelocity = new THREE.Vector3()
        .subVectors(ballB.velocity || new THREE.Vector3(), ballA.velocity || new THREE.Vector3());
      
      // Record collision time
      this.lastCollisions.set(collisionKey, now);
      
      return {
        objectA: ballA,
        objectB: ballB,
        point,
        normal,
        depth,
        relativeVelocity
      };
    }
    
    return null;
  }
  
  private checkBallToObstacleCollision(ball: PhysicsBall, obstacle: PhysicsObstacle): Collision | null {
    // Calculate collision key for cooldown tracking
    const collisionKey = `${ball.id}-${obstacle.id}`;
    
    // Skip if on cooldown
    const now = Date.now();
    if (this.lastCollisions.has(collisionKey)) {
      const lastTime = this.lastCollisions.get(collisionKey)!;
      if (now - lastTime < this.collisionCooldown) {
        return null;
      }
    }
    
    switch (obstacle.type) {
      case 'box':
        return this.checkBallToBoxCollision(ball, obstacle);
      case 'cylinder':
        return this.checkBallToCylinderCollision(ball, obstacle);
      case 'sphere':
        return this.checkBallToSphereCollision(ball, obstacle);
      case 'ramp':
        return this.checkBallToRampCollision(ball, obstacle);
      default:
        // Default to box collision for unknown types
        return this.checkBallToBoxCollision(ball, obstacle);
    }
  }
  
  private checkBallToBoxCollision(ball: PhysicsBall, box: PhysicsObstacle): Collision | null {
    // Transform ball position to box local space
    const boxPosition = box.position;
    const boxScale = box.scale;
    
    // Simplified AABB collision check
    const halfWidth = boxScale.x / 2;
    const halfHeight = boxScale.y / 2;
    const halfDepth = boxScale.z / 2;
    
    // Calculate closest point on box to ball center
    const closestPoint = new THREE.Vector3(
      Math.max(boxPosition.x - halfWidth, Math.min(boxPosition.x + halfWidth, ball.position.x)),
      Math.max(boxPosition.y - halfHeight, Math.min(boxPosition.y + halfHeight, ball.position.y)),
      Math.max(boxPosition.z - halfDepth, Math.min(boxPosition.z + halfDepth, ball.position.z))
    );
    
    // Calculate distance to closest point
    const distance = closestPoint.distanceTo(ball.position);
    
    // Check if we have a collision
    if (distance < ball.radius) {
      // Calculate collision normal
      const normal = new THREE.Vector3()
        .subVectors(ball.position, closestPoint)
        .normalize();
      
      // Calculate collision depth
      const depth = ball.radius - distance;
      
      // Calculate relative velocity
      const relativeVelocity = ball.velocity.clone().negate(); // Box is static
      
      // Record collision time
      this.lastCollisions.set(`${ball.id}-${box.id}`, Date.now());
      
      return {
        objectA: ball,
        objectB: box,
        point: closestPoint,
        normal,
        depth,
        relativeVelocity
      };
    }
    
    return null;
  }
  
  private checkBallToCylinderCollision(ball: PhysicsBall, cylinder: PhysicsObstacle): Collision | null {
    // Simplified cylinder collision
    const cylinderPosition = cylinder.position;
    const cylinderScale = cylinder.scale;
    
    // Project ball center onto cylinder axis (y-axis)
    const cylinderTop = cylinderPosition.y + cylinderScale.y / 2;
    const cylinderBottom = cylinderPosition.y - cylinderScale.y / 2;
    const projectedY = Math.max(cylinderBottom, Math.min(cylinderTop, ball.position.y));
    
    // Calculate horizontal distance from cylinder axis
    const horizontalCenter = new THREE.Vector2(cylinderPosition.x, cylinderPosition.z);
    const horizontalPosition = new THREE.Vector2(ball.position.x, ball.position.z);
    const horizontalDistance = horizontalCenter.distanceTo(horizontalPosition);
    
    // Check if we're within cylinder radius
    const cylinderRadius = cylinderScale.x / 2;
    const combinedRadius = cylinderRadius + ball.radius;
    
    if (horizontalDistance < combinedRadius && 
        ball.position.y >= cylinderBottom - ball.radius && 
        ball.position.y <= cylinderTop + ball.radius) {
      
      let normal: THREE.Vector3;
      let point: THREE.Vector3;
      let depth: number;
      
      // Check if we're colliding with the sides or the caps
      if (ball.position.y < cylinderBottom) {
        // Bottom cap collision
        normal = new THREE.Vector3(0, -1, 0);
        point = new THREE.Vector3(ball.position.x, cylinderBottom, ball.position.z);
        depth = ball.radius - (cylinderBottom - ball.position.y);
      } else if (ball.position.y > cylinderTop) {
        // Top cap collision
        normal = new THREE.Vector3(0, 1, 0);
        point = new THREE.Vector3(ball.position.x, cylinderTop, ball.position.z);
        depth = ball.radius - (ball.position.y - cylinderTop);
      } else {
        // Side collision
        const horizontalDirection = new THREE.Vector2()
          .subVectors(horizontalPosition, horizontalCenter)
          .normalize();
        
        normal = new THREE.Vector3(horizontalDirection.x, 0, horizontalDirection.y);
        point = new THREE.Vector3(
          cylinderPosition.x + horizontalDirection.x * cylinderRadius,
          ball.position.y,
          cylinderPosition.z + horizontalDirection.y * cylinderRadius
        );
        depth = combinedRadius - horizontalDistance;
      }
      
      // Calculate relative velocity
      const relativeVelocity = ball.velocity.clone().negate(); // Cylinder is static
      
      // Record collision time
      this.lastCollisions.set(`${ball.id}-${cylinder.id}`, Date.now());
      
      return {
        objectA: ball,
        objectB: cylinder,
        point,
        normal,
        depth,
        relativeVelocity
      };
    }
    
    return null;
  }
  
  private checkBallToSphereCollision(ball: PhysicsBall, sphere: PhysicsObstacle): Collision | null {
    // Simple sphere-to-sphere collision
    const spherePosition = sphere.position;
    const sphereRadius = sphere.scale.x / 2;
    
    const distance = ball.position.distanceTo(spherePosition);
    const combinedRadius = ball.radius + sphereRadius;
    
    if (distance < combinedRadius) {
      // Calculate collision normal
      const normal = new THREE.Vector3()
        .subVectors(ball.position, spherePosition)
        .normalize();
      
      // Calculate collision depth
      const depth = combinedRadius - distance;
      
      // Calculate collision point
      const point = new THREE.Vector3()
        .copy(spherePosition)
        .add(normal.clone().multiplyScalar(sphereRadius));
      
      // Calculate relative velocity
      const relativeVelocity = ball.velocity.clone().negate(); // Sphere is static
      
      // Record collision time
      this.lastCollisions.set(`${ball.id}-${sphere.id}`, Date.now());
      
      return {
        objectA: ball,
        objectB: sphere,
        point,
        normal,
        depth,
        relativeVelocity
      };
    }
    
    return null;
  }
  
  private checkBallToRampCollision(ball: PhysicsBall, ramp: PhysicsObstacle): Collision | null {
    // Simplified ramp collision
    // Treat ramp as an inclined plane
    
    // Get ramp rotation (assuming only Y rotation matters)
    const rampRotation = ramp.rotation.y;
    const rampPosition = ramp.position;
    const rampScale = ramp.scale;
    
    // Calculate ramp normal (perpendicular to inclined surface)
    const rampNormal = new THREE.Vector3(
      Math.sin(rampRotation), 
      0.5, // Assuming 45-degree slope
      Math.cos(rampRotation)
    ).normalize();
    
    // Calculate ramp dimensions
    const rampWidth = rampScale.x;
    const rampHeight = rampScale.y;
    const rampDepth = rampScale.z;
    
    // Calculate vector from ramp position to ball
    const toBall = new THREE.Vector3().subVectors(ball.position, rampPosition);
    
    // Calculate distance from ball to ramp plane
    const distanceToPlane = toBall.dot(rampNormal);
    
    // Check if ball is close enough to ramp plane
    if (Math.abs(distanceToPlane) < ball.radius) {
      // Project ball position onto ramp plane
      const projectedPoint = new THREE.Vector3()
        .copy(ball.position)
        .sub(rampNormal.clone().multiplyScalar(distanceToPlane));
      
      // Check if projected point is within ramp boundaries
      const localX = projectedPoint.x - rampPosition.x;
      const localZ = projectedPoint.z - rampPosition.z;
      
      // Rotate local coordinates to align with ramp orientation
      const rotatedX = localX * Math.cos(-rampRotation) - localZ * Math.sin(-rampRotation);
      const rotatedZ = localX * Math.sin(-rampRotation) + localZ * Math.cos(-rampRotation);
      
      if (Math.abs(rotatedX) <= rampWidth / 2 && Math.abs(rotatedZ) <= rampDepth / 2) {
        // Calculate collision normal (direction from ramp to ball)
        const normal = rampNormal.clone();
        if (distanceToPlane < 0) {
          normal.negate(); // Flip normal if ball is on the other side
        }
        
        // Calculate collision depth
        const depth = ball.radius - Math.abs(distanceToPlane);
        
        // Calculate collision point
        const point = new THREE.Vector3()
          .copy(ball.position)
          .sub(normal.clone().multiplyScalar(ball.radius));
        
        // Calculate relative velocity
        const relativeVelocity = ball.velocity.clone().negate(); // Ramp is static
        
        // Record collision time
        this.lastCollisions.set(`${ball.id}-${ramp.id}`, Date.now());
        
        return {
          objectA: ball,
          objectB: ramp,
          point,
          normal,
          depth,
          relativeVelocity
        };
      }
    }
    
    return null;
  }
  
  private checkBallToTerrainCollision(ball: PhysicsBall, terrain: PhysicsTerrain): Collision | null {
    // Calculate collision key for cooldown tracking
    const collisionKey = `${ball.id}-${terrain.id}`;
    
    // Skip if on cooldown
    const now = Date.now();
    if (this.lastCollisions.has(collisionKey)) {
      const lastTime = this.lastCollisions.get(collisionKey)!;
      if (now - lastTime < this.collisionCooldown) {
        return null;
      }
    }
    
    // Simplified terrain collision
    // For flat terrain, just check Y position
    
    const terrainPosition = terrain.position;
    const terrainScale = terrain.scale;
    
    // Calculate terrain boundaries
    const halfWidth = terrainScale.x / 2;
    const halfDepth = terrainScale.z / 2;
    const terrainTop = terrainPosition.y + terrainScale.y / 2;
    
    // Check if ball is above terrain
    if (ball.position.x >= terrainPosition.x - halfWidth &&
        ball.position.x <= terrainPosition.x + halfWidth &&
        ball.position.z >= terrainPosition.z - halfDepth &&
        ball.position.z <= terrainPosition.z + halfDepth) {
      
      const ballBottom = ball.position.y - ball.radius;
      
      // Check for collision with top of terrain
      if (ballBottom <= terrainTop && ball.position.y >= terrainTop) {
        // Calculate collision normal (up vector)
        const normal = new THREE.Vector3(0, 1, 0);
        
        // Calculate collision depth
        const depth = terrainTop - ballBottom;
        
        // Calculate collision point
        const point = new THREE.Vector3(
          ball.position.x,
          terrainTop,
          ball.position.z
        );
        
        // Calculate relative velocity
        const relativeVelocity = ball.velocity.clone().negate(); // Terrain is static
        
        // Record collision time
        this.lastCollisions.set(collisionKey, now);
        
        return {
          objectA: ball,
          objectB: terrain,
          point,
          normal,
          depth,
          relativeVelocity
        };
      }
    }
    
    return null;
  }
  
  // Clean up old collision records (call periodically to prevent memory leaks)
  public cleanupCollisionHistory(maxAge: number = 5000): void {
    const now = Date.now();
    for (const [key, time] of this.lastCollisions.entries()) {
      if (now - time > maxAge) {
        this.lastCollisions.delete(key);
      }
    }
  }
}

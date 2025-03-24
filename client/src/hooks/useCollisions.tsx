import * as THREE from 'three';
import { useMemo } from 'react';
import { Ball, Obstacle, PowerUp, Collectible } from '@/types/entities';
import { ObstacleType } from '@/types/game';
import debug from '@/lib/utils/debug';

export const useCollisions = () => {
  // Helper function to check sphere-sphere collisions
  const checkSphereCollision = (
    positionA: THREE.Vector3,
    radiusA: number,
    positionB: THREE.Vector3,
    radiusB: number
  ): boolean => {
    const distance = positionA.distanceTo(positionB);
    return distance < (radiusA + radiusB);
  };
  
  // Helper function to check sphere-box collisions
  const checkSphereBoxCollision = (
    spherePosition: THREE.Vector3,
    sphereRadius: number,
    boxPosition: THREE.Vector3,
    boxScale: THREE.Vector3,
    boxRotation: THREE.Quaternion
  ): boolean => {
    // Transform sphere position into box local space
    const boxMatrix = new THREE.Matrix4().makeRotationFromQuaternion(boxRotation);
    const invBoxMatrix = boxMatrix.clone().invert();
    
    const localSpherePosition = spherePosition.clone()
      .sub(boxPosition)
      .applyMatrix4(invBoxMatrix);
    
    // Calculate the half extents of the box
    const halfExtents = new THREE.Vector3(
      boxScale.x / 2,
      boxScale.y / 2,
      boxScale.z / 2
    );
    
    // Calculate closest point on box to sphere center
    const closestPoint = new THREE.Vector3(
      Math.max(-halfExtents.x, Math.min(localSpherePosition.x, halfExtents.x)),
      Math.max(-halfExtents.y, Math.min(localSpherePosition.y, halfExtents.y)),
      Math.max(-halfExtents.z, Math.min(localSpherePosition.z, halfExtents.z))
    );
    
    // Check if closest point is within sphere
    const distanceSquared = localSpherePosition.distanceToSquared(closestPoint);
    return distanceSquared < (sphereRadius * sphereRadius);
  };
  
  // Check collision between ball and obstacle
  const checkBallObstacleCollision = (ball: Ball, obstacle: Obstacle): boolean => {
    switch (obstacle.obstacleType) {
      case ObstacleType.CUBE:
      case ObstacleType.PLATFORM:
      case ObstacleType.BREAKABLE:
        return checkSphereBoxCollision(
          ball.position,
          ball.radius,
          obstacle.position,
          obstacle.scale,
          obstacle.rotation
        );
        
      case ObstacleType.SPHERE:
        return checkSphereCollision(
          ball.position,
          ball.radius,
          obstacle.position,
          obstacle.scale.x / 2  // Assuming uniform scale for sphere
        );
        
      case ObstacleType.CYLINDER:
        // Simplified collision check for cylinder
        // Horizontal distance check (treating like a sphere)
        const horizontalDistance = new THREE.Vector2(
          ball.position.x - obstacle.position.x,
          ball.position.z - obstacle.position.z
        ).length();
        
        if (horizontalDistance > (obstacle.scale.x / 2 + ball.radius)) {
          return false;
        }
        
        // Vertical distance check
        const verticalDistance = Math.abs(ball.position.y - obstacle.position.y);
        return verticalDistance < (obstacle.scale.y / 2 + ball.radius);
        
      case ObstacleType.RAMP:
        // Simplified ramp collision - this would need more complex calculation
        // for accurate slope collision
        return checkSphereBoxCollision(
          ball.position,
          ball.radius,
          obstacle.position,
          new THREE.Vector3(obstacle.scale.x, obstacle.scale.y / 2, obstacle.scale.z),
          obstacle.rotation
        );
        
      case ObstacleType.PORTAL:
      case ObstacleType.TRIGGER:
        // Check for sphere-sphere collision with the portal/trigger
        return checkSphereCollision(
          ball.position,
          ball.radius,
          obstacle.position,
          obstacle.scale.x
        );
        
      default:
        // Default to box collision
        return checkSphereBoxCollision(
          ball.position,
          ball.radius,
          obstacle.position,
          obstacle.scale,
          obstacle.rotation
        );
    }
  };
  
  // Check collision between ball and power-up
  const checkBallPowerUpCollision = (ball: Ball, powerUp: PowerUp): boolean => {
    // Sphere-sphere collision
    return checkSphereCollision(
      ball.position,
      ball.radius,
      powerUp.position,
      powerUp.radius
    );
  };
  
  // Check collision between ball and collectible
  const checkBallCollectibleCollision = (ball: Ball, collectible: Collectible): boolean => {
    // Use a fixed radius for collectibles
    const collectibleRadius = 0.5;
    
    return checkSphereCollision(
      ball.position,
      ball.radius,
      collectible.position,
      collectibleRadius
    );
  };
  
  // Calculate collision response between ball and obstacle
  const calculateCollisionResponse = (
    ballPosition: THREE.Vector3,
    ballVelocity: THREE.Vector3,
    ballRadius: number,
    obstaclePosition: THREE.Vector3,
    obstacleScale: THREE.Vector3,
    obstacleType: ObstacleType
  ): THREE.Vector3 => {
    // Default collision normal (pointing away from obstacle)
    let normal = new THREE.Vector3().subVectors(ballPosition, obstaclePosition).normalize();
    
    switch (obstacleType) {
      case ObstacleType.SPHERE:
        // For sphere, normal is already correct (pointing from sphere center to ball center)
        break;
        
      case ObstacleType.CUBE:
      case ObstacleType.PLATFORM:
      case ObstacleType.BREAKABLE:
        // For box, need to find closest face
        // Simplified approach: find which face normal is most aligned with the direction to the ball
        const dx = Math.abs(ballPosition.x - obstaclePosition.x) / (obstacleScale.x / 2);
        const dy = Math.abs(ballPosition.y - obstaclePosition.y) / (obstacleScale.y / 2);
        const dz = Math.abs(ballPosition.z - obstaclePosition.z) / (obstacleScale.z / 2);
        
        if (dx > dy && dx > dz) {
          normal = new THREE.Vector3(Math.sign(ballPosition.x - obstaclePosition.x), 0, 0);
        } else if (dy > dx && dy > dz) {
          normal = new THREE.Vector3(0, Math.sign(ballPosition.y - obstaclePosition.y), 0);
        } else {
          normal = new THREE.Vector3(0, 0, Math.sign(ballPosition.z - obstaclePosition.z));
        }
        break;
        
      default:
        // Use default normal for other types
        break;
    }
    
    // Calculate reflection direction
    const reflection = ballVelocity.clone().reflect(normal);
    
    return reflection;
  };
  
  return {
    checkBallObstacleCollision,
    checkBallPowerUpCollision,
    checkBallCollectibleCollision,
    calculateCollisionResponse
  };
};

export default useCollisions;

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';
import { useGameState } from '@/lib/stores/useGameState';
import { Ball } from '@/types/entities';
import { GamePhase } from '@/types/game';
import debug from '@/lib/utils/debug';

interface UsePhysicsProps {
  balls: Ball[];
  gravity: number;
  friction: number;
  wind?: {
    direction: THREE.Vector3;
    strength: number;
  };
  boundaries?: {
    min: THREE.Vector3;
    max: THREE.Vector3;
  };
}

export const usePhysics = ({
  balls,
  gravity,
  friction,
  wind,
  boundaries
}: UsePhysicsProps) => {
  const gamePhase = useGameState(state => state.phase);
  const { setPositions, setVelocities, addForce, applyImpulse } = usePhysicsState();
  
  // Accumulator for fixed time step
  const accumulator = useRef(0);
  const fixedTimeStep = 1 / 60; // 60 physics updates per second
  
  // Last frames' velocities for collision response
  const lastVelocities = useRef<Record<string, THREE.Vector3>>({});
  
  // Physics simulation loop
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Use fixed time step for physics
    accumulator.current += delta;
    
    while (accumulator.current >= fixedTimeStep) {
      // Perform physics simulation at fixed time step
      updatePhysics(fixedTimeStep);
      accumulator.current -= fixedTimeStep;
    }
  });
  
  // Update physics for all balls
  const updatePhysics = (deltaTime: number) => {
    // Early return if no balls
    if (balls.length === 0) return;
    
    // Prepare position and velocity updates
    const newPositions: Record<string, THREE.Vector3> = {};
    const newVelocities: Record<string, THREE.Vector3> = {};
    
    // Process each ball
    balls.forEach(ball => {
      // Skip held balls
      if (ball.isHeld) {
        newPositions[ball.id] = ball.position.clone();
        newVelocities[ball.id] = new THREE.Vector3(0, 0, 0);
        return;
      }
      
      // Apply gravity
      const gravityForce = new THREE.Vector3(0, -gravity * ball.mass, 0);
      
      // Apply wind if present
      if (wind && wind.strength > 0) {
        const windForce = wind.direction.clone().normalize().multiplyScalar(wind.strength);
        addForce(ball.id, windForce);
      }
      
      // Apply accumulated forces
      addForce(ball.id, gravityForce);
      
      // Update velocity based on current forces (simulated by the physics state)
      const newVelocity = ball.velocity.clone();
      
      // Apply friction
      newVelocity.x *= friction;
      newVelocity.z *= friction;
      
      // Apply boundary constraints
      const newPosition = ball.position.clone().add(
        newVelocity.clone().multiplyScalar(deltaTime)
      );
      
      // Check and resolve boundary collisions
      if (boundaries) {
        // Floor collision (always present)
        if (newPosition.y - ball.radius < 0) {
          newPosition.y = ball.radius;
          
          // Bounce with energy loss
          if (newVelocity.y < 0) {
            newVelocity.y = -newVelocity.y * ball.bounciness;
            
            // Apply friction on bounce for more realism
            newVelocity.x *= 0.95;
            newVelocity.z *= 0.95;
            
            // If velocity is very small, just stop the ball
            if (Math.abs(newVelocity.y) < 0.1) {
              newVelocity.y = 0;
            }
          }
        }
        
        // Check wall boundaries
        if (newPosition.x - ball.radius < boundaries.min.x) {
          newPosition.x = boundaries.min.x + ball.radius;
          newVelocity.x = -newVelocity.x * ball.bounciness;
        } else if (newPosition.x + ball.radius > boundaries.max.x) {
          newPosition.x = boundaries.max.x - ball.radius;
          newVelocity.x = -newVelocity.x * ball.bounciness;
        }
        
        if (newPosition.z - ball.radius < boundaries.min.z) {
          newPosition.z = boundaries.min.z + ball.radius;
          newVelocity.z = -newVelocity.z * ball.bounciness;
        } else if (newPosition.z + ball.radius > boundaries.max.z) {
          newPosition.z = boundaries.max.z - ball.radius;
          newVelocity.z = -newVelocity.z * ball.bounciness;
        }
      }
      
      // Store new position and velocity
      newPositions[ball.id] = newPosition;
      newVelocities[ball.id] = newVelocity;
      
      // Store last velocity for collision detection
      lastVelocities.current[ball.id] = newVelocity.clone();
    });
    
    // Update all positions and velocities at once
    setPositions(newPositions);
    setVelocities(newVelocities);
  };
  
  // Handle collision detection between balls
  useEffect(() => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Check collisions between all pairs of balls
    for (let i = 0; i < balls.length; i++) {
      const ballA = balls[i];
      if (ballA.isHeld) continue;
      
      for (let j = i + 1; j < balls.length; j++) {
        const ballB = balls[j];
        if (ballB.isHeld) continue;
        
        // Calculate distance between ball centers
        const distance = ballA.position.distanceTo(ballB.position);
        const minDistance = ballA.radius + ballB.radius;
        
        // Check for collision
        if (distance < minDistance) {
          // Calculate collision normal
          const collisionNormal = new THREE.Vector3()
            .subVectors(ballB.position, ballA.position)
            .normalize();
          
          // Calculate collision response
          const relativeVelocity = new THREE.Vector3()
            .subVectors(ballB.velocity, ballA.velocity);
          
          const velocityAlongNormal = relativeVelocity.dot(collisionNormal);
          
          // Only resolve if balls are moving toward each other
          if (velocityAlongNormal < 0) {
            // Calculate impulse scalar
            const restitution = Math.min(ballA.bounciness, ballB.bounciness);
            
            let j = -(1 + restitution) * velocityAlongNormal;
            j /= 1 / ballA.mass + 1 / ballB.mass;
            
            // Apply impulse
            const impulse = collisionNormal.clone().multiplyScalar(j);
            
            // Apply to ball A (negative direction)
            applyImpulse(
              ballA.id,
              impulse.clone().multiplyScalar(-1 / ballA.mass)
            );
            
            // Apply to ball B
            applyImpulse(
              ballB.id,
              impulse.clone().multiplyScalar(1 / ballB.mass)
            );
            
            // Position correction to prevent sinking
            const percent = 0.2; // penetration percentage to correct
            const correction = collisionNormal.clone().multiplyScalar(
              (minDistance - distance) * percent
            );
            
            // Separate balls based on their masses
            if (!ballA.isHeld) {
              setPositions({
                [ballA.id]: ballA.position.clone().sub(
                  correction.clone().multiplyScalar(ballB.mass / (ballA.mass + ballB.mass))
                )
              });
            }
            
            if (!ballB.isHeld) {
              setPositions({
                [ballB.id]: ballB.position.clone().add(
                  correction.clone().multiplyScalar(ballA.mass / (ballA.mass + ballB.mass))
                )
              });
            }
            
            debug.collision(`Ball collision: ${ballA.id} with ${ballB.id}`);
          }
        }
      }
    }
  }, [balls, gamePhase, applyImpulse, setPositions]);
  
  return {
    addForce,
    applyImpulse
  };
};

export default usePhysics;

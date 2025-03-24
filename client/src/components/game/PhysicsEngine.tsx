import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';
import { useGameState } from '@/lib/stores/useGameState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { useSettingsState } from '@/lib/stores/useSettingsState';
import physicsEngine from '@/lib/physics/core';
import { PhysicsObject } from '@/types/physics';
import { GamePhase } from '@/types/game';
import debug from '@/lib/utils/debug';

// This component manages the physics simulation
const PhysicsEngine = () => {
  const gamePhase = useGameState(state => state.phase);
  const balls = usePlayerState(state => state.balls);
  const obstacles = useLevelState(state => state.obstacles);
  const terrain = useLevelState(state => state.terrain);
  const boundaries = useLevelState(state => state.boundaries);
  const setPositions = usePhysicsState(state => state.setPositions);
  const setVelocities = usePhysicsState(state => state.setVelocities);
  const physicsSettings = useSettingsState(state => state.physicsSettings);
  
  // Keep track of physics object mappings
  const physicsObjects = useRef<Map<string, PhysicsObject>>(new Map());
  const accumulatedTime = useRef(0);
  const fixedTimeStep = 1 / 60; // Fixed physics update rate
  
  // Initialize physics engine
  useEffect(() => {
    // Configure physics world based on settings
    physicsEngine.gravity.set(0, -physicsSettings.gravity, 0);
    
    // Log physics initialization
    debug.log('Physics engine initialized', 'physics');
    
    return () => {
      // Clean up physics objects on unmount
      physicsObjects.current.forEach((object, id) => {
        physicsEngine.removeObject(id);
      });
      physicsObjects.current.clear();
    };
  }, [physicsSettings.gravity]);
  
  // Create/update physics objects for balls
  useEffect(() => {
    // Create or update physics objects for each ball
    balls.forEach(ball => {
      if (!physicsObjects.current.has(ball.id)) {
        // Create new physics object for the ball
        const physicsObject = physicsEngine.createSphereBody(
          ball.radius,
          ball.position,
          {
            mass: ball.mass,
            restitution: ball.bounciness,
            friction: ball.friction,
            isKinematic: ball.isHeld,
            collisionGroup: 0x0002, // Ball collision group
            collisionMask: 0xFFFF   // Collide with everything
          }
        );
        
        physicsObjects.current.set(ball.id, physicsObject);
        debug.physics(`Created physics object for ball ${ball.id}`);
      } else {
        // Update existing physics object properties
        const physicsObject = physicsObjects.current.get(ball.id)!;
        
        // Update kinematic state based on held status
        physicsObject.properties.isKinematic = ball.isHeld;
        
        // If held, update position directly
        if (ball.isHeld) {
          physicsObject.setPosition(ball.position);
          physicsObject.setVelocity(new THREE.Vector3(0, 0, 0));
        }
      }
    });
    
    // Remove physics objects for balls that no longer exist
    physicsObjects.current.forEach((object, id) => {
      if (id.startsWith('ball_') && !balls.find(ball => ball.id === id)) {
        physicsEngine.removeObject(id);
        physicsObjects.current.delete(id);
        debug.physics(`Removed physics object for ball ${id}`);
      }
    });
  }, [balls]);
  
  // Create/update physics objects for obstacles
  useEffect(() => {
    // Create or update physics objects for each obstacle
    obstacles.forEach(obstacle => {
      if (!physicsObjects.current.has(obstacle.id)) {
        // Create appropriate physics shape based on obstacle type
        let physicsObject: PhysicsObject;
        
        switch (obstacle.obstacleType) {
          case 'cube':
          case 'platform':
          case 'breakable':
            physicsObject = physicsEngine.createBoxBody(
              obstacle.scale,
              obstacle.position,
              {
                isKinematic: obstacle.isStatic,
                collisionGroup: 0x0004, // Obstacle collision group
                collisionMask: 0xFFFF,   // Collide with everything
                restitution: 0.4,
                friction: 0.8
              }
            );
            break;
            
          case 'sphere':
            physicsObject = physicsEngine.createSphereBody(
              obstacle.scale.x / 2, // Use half of scale as radius
              obstacle.position,
              {
                isKinematic: obstacle.isStatic,
                collisionGroup: 0x0004,
                collisionMask: 0xFFFF,
                restitution: 0.7,
                friction: 0.5
              }
            );
            break;
            
          case 'cylinder':
            physicsObject = physicsEngine.createCylinderBody(
              obstacle.scale.x / 2,
              obstacle.scale.y,
              obstacle.position,
              {
                isKinematic: obstacle.isStatic,
                collisionGroup: 0x0004,
                collisionMask: 0xFFFF,
                restitution: 0.5,
                friction: 0.6
              }
            );
            break;
            
          default:
            // Default to box for other shapes
            physicsObject = physicsEngine.createBoxBody(
              obstacle.scale,
              obstacle.position,
              {
                isKinematic: obstacle.isStatic,
                collisionGroup: 0x0004,
                collisionMask: 0xFFFF
              }
            );
        }
        
        physicsObjects.current.set(obstacle.id, physicsObject);
        debug.physics(`Created physics object for obstacle ${obstacle.id}`);
      } else {
        // Update existing physics object
        const physicsObject = physicsObjects.current.get(obstacle.id)!;
        
        // Some obstacles might need position updates (like moving platforms)
        if (!obstacle.isStatic) {
          physicsObject.setPosition(obstacle.position);
          physicsObject.setRotation(obstacle.rotation);
        }
      }
    });
    
    // Remove physics objects for obstacles that no longer exist
    physicsObjects.current.forEach((object, id) => {
      if (id.startsWith('obstacle_') && !obstacles.find(obs => obs.id === id)) {
        physicsEngine.removeObject(id);
        physicsObjects.current.delete(id);
        debug.physics(`Removed physics object for obstacle ${id}`);
      }
    });
  }, [obstacles]);
  
  // Create boundary walls
  useEffect(() => {
    if (!boundaries) return;
    
    // Create floor
    if (!physicsObjects.current.has('boundary_floor')) {
      const floorObject = physicsEngine.createPlaneBody(
        new THREE.Vector3(0, 1, 0), // Normal pointing up
        new THREE.Vector3(0, 0, 0),  // Position at origin
        {
          isKinematic: true,
          collisionGroup: 0x0001,
          collisionMask: 0xFFFF,
          restitution: 0.5,
          friction: 0.5
        }
      );
      physicsObjects.current.set('boundary_floor', floorObject);
    }
    
    // Create walls based on boundaries
    const createWall = (id: string, position: THREE.Vector3, size: THREE.Vector3) => {
      if (!physicsObjects.current.has(id)) {
        const wallObject = physicsEngine.createBoxBody(
          size,
          position,
          {
            isKinematic: true,
            collisionGroup: 0x0001,
            collisionMask: 0xFFFF,
            restitution: 0.5,
            friction: 0.3
          }
        );
        physicsObjects.current.set(id, wallObject);
      }
    };
    
    // Create boundary walls
    const wallThickness = 1;
    const wallHeight = 10;
    
    // Left wall
    createWall(
      'boundary_left',
      new THREE.Vector3(boundaries.min.x - wallThickness/2, wallHeight/2, 0),
      new THREE.Vector3(wallThickness, wallHeight, boundaries.max.z - boundaries.min.z + wallThickness*2)
    );
    
    // Right wall
    createWall(
      'boundary_right',
      new THREE.Vector3(boundaries.max.x + wallThickness/2, wallHeight/2, 0),
      new THREE.Vector3(wallThickness, wallHeight, boundaries.max.z - boundaries.min.z + wallThickness*2)
    );
    
    // Front wall
    createWall(
      'boundary_front',
      new THREE.Vector3(0, wallHeight/2, boundaries.min.z - wallThickness/2),
      new THREE.Vector3(boundaries.max.x - boundaries.min.x + wallThickness*2, wallHeight, wallThickness)
    );
    
    // Back wall
    createWall(
      'boundary_back',
      new THREE.Vector3(0, wallHeight/2, boundaries.max.z + wallThickness/2),
      new THREE.Vector3(boundaries.max.x - boundaries.min.x + wallThickness*2, wallHeight, wallThickness)
    );
    
    debug.physics('Created boundary walls');
  }, [boundaries]);
  
  // Run physics simulation
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Accumulate time for fixed timestep physics
    accumulatedTime.current += delta;
    
    // Update physics with fixed timestep
    while (accumulatedTime.current >= fixedTimeStep) {
      physicsEngine.step(fixedTimeStep);
      accumulatedTime.current -= fixedTimeStep;
    }
    
    // Extract ball positions and velocities for rendering
    const positions: Record<string, THREE.Vector3> = {};
    const velocities: Record<string, THREE.Vector3> = {};
    
    balls.forEach(ball => {
      const physicsObject = physicsObjects.current.get(ball.id);
      if (physicsObject) {
        // Only update from physics if ball is not being held
        if (!ball.isHeld) {
          positions[ball.id] = physicsObject.state.position.clone();
          velocities[ball.id] = physicsObject.state.velocity.clone();
        }
      }
    });
    
    // Update ball positions and velocities in state
    setPositions(positions);
    setVelocities(velocities);
  });
  
  return null; // This component doesn't render anything visually
};

export default PhysicsEngine;

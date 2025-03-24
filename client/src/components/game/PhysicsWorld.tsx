import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App';
import { usePhysics } from '../../lib/stores/usePhysics';
import { useLevel } from '../../lib/stores/useLevel';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Import game components
import Ball from './Ball';
import Obstacle from './Obstacle';
import Terrain from './Terrain';
import PowerUp from './PowerUp';
import Camera from './Camera';
import { ExplosionEffect } from './Effects/ExplosionEffect';
import { TrailEffect } from './Effects/TrailEffect';

const PhysicsWorld = () => {
  const { scene, camera } = useThree();
  const gameRef = useRef({
    lastTime: 0,
    frameCount: 0,
    fps: 0,
  });
  
  const physics = usePhysics();
  const level = useLevel();
  const game = useGame.getState();
  const { playHit } = useAudio();
  
  // Subscribe to keyboard controls
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // State for tracking particles and effects
  const [effects, setEffects] = useState<{ id: string, position: THREE.Vector3, type: string, time: number }[]>([]);
  
  // Refs for optimization
  const ballRefs = useRef<any[]>([]);
  const obstacleRefs = useRef<any[]>([]);
  const powerUpRefs = useRef<any[]>([]);
  
  // Load level data when component mounts
  useEffect(() => {
    console.log("Loading physics world for level:", level.currentLevel);
    physics.initialize();
    level.loadLevel(level.currentLevel);
    
    // Clean up physics engine when unmounting
    return () => {
      physics.cleanup();
    };
  }, [level.currentLevel]);
  
  // Add collision event listeners
  useEffect(() => {
    const handleCollision = (objA: any, objB: any, point: THREE.Vector3) => {
      console.log("Collision detected between", objA.id, "and", objB.id);
      
      // Create explosion effect at the collision point
      if (objA.type === 'ball' || objB.type === 'ball') {
        const force = objA.velocity.length() + objB.velocity.length();
        if (force > 3) {
          playHit();
          setEffects(prev => [
            ...prev,
            {
              id: `explosion-${Date.now()}-${Math.random()}`,
              position: point.clone(),
              type: 'explosion',
              time: Date.now()
            }
          ]);
        }
      }
    };
    
    physics.onCollision(handleCollision);
    
    return () => {
      physics.offCollision(handleCollision);
    };
  }, [physics, playHit]);
  
  // Game loop
  useFrame((_, delta) => {
    // Calculate FPS
    const now = performance.now();
    gameRef.current.frameCount++;
    
    if (now - gameRef.current.lastTime >= 1000) {
      gameRef.current.fps = gameRef.current.frameCount;
      gameRef.current.frameCount = 0;
      gameRef.current.lastTime = now;
    }
    
    // Get current keyboard state
    const keys = getKeys();
    
    // Update physics simulation
    physics.update(delta, keys);
    
    // Clean up old effects
    setEffects(prev => prev.filter(effect => (Date.now() - effect.time) < 2000));
    
    // Check game conditions (win/lose states)
    if (physics.checkWinCondition()) {
      game.end();
    }
  });
  
  return (
    <>
      {/* Dynamic camera that follows the action */}
      <Camera />
      
      {/* Main terrain for the level */}
      <Terrain 
        terrainData={level.currentLevelData.terrain} 
      />
      
      {/* Generate balls from level data */}
      {level.currentLevelData.balls.map((ball, index) => (
        <Ball
          key={`ball-${ball.id}`}
          ref={el => ballRefs.current[index] = el}
          {...ball}
        />
      ))}
      
      {/* Generate obstacles from level data */}
      {level.currentLevelData.obstacles.map((obstacle, index) => (
        <Obstacle
          key={`obstacle-${obstacle.id}`}
          ref={el => obstacleRefs.current[index] = el}
          {...obstacle}
        />
      ))}
      
      {/* Generate power-ups from level data */}
      {level.currentLevelData.powerUps.map((powerUp, index) => (
        <PowerUp
          key={`powerup-${powerUp.id}`}
          ref={el => powerUpRefs.current[index] = el}
          {...powerUp}
        />
      ))}
      
      {/* Visual effects */}
      {effects.map(effect => {
        if (effect.type === 'explosion') {
          return (
            <ExplosionEffect 
              key={effect.id} 
              position={effect.position} 
            />
          );
        }
        return null;
      })}
      
      {/* Trail effects for balls in motion */}
      {physics.getBalls().filter(ball => ball.velocity.length() > 5).map(ball => (
        <TrailEffect
          key={`trail-${ball.id}`}
          object={ball.object}
          color={ball.color || new THREE.Color(0x3498db)}
        />
      ))}
    </>
  );
};

export default PhysicsWorld;

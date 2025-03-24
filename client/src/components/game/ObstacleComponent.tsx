import * as THREE from 'three';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Obstacle } from '@/types/entities';
import { ObstacleType } from '@/types/game';
import { useGameState } from '@/lib/stores/useGameState';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';
import { GamePhase } from '@/types/game';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useAudio } from '@/lib/stores/useAudio';

interface ObstacleComponentProps {
  obstacle: Obstacle;
}

const ObstacleComponent = ({ obstacle }: ObstacleComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const gamePhase = useGameState(state => state.phase);
  const addObstacleDestroyed = useScoreState(state => state.addObstacleDestroyed);
  const { playHit } = useAudio();
  
  // State for triggered effects
  const [isBroken, setIsBroken] = useState(false);
  const [breakProgress, setBreakProgress] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);
  
  // Get wood texture for certain obstacles
  const woodTexture = useTexture('/textures/wood.jpg');
  
  // Configure textures
  useEffect(() => {
    woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(1, 1);
  }, [woodTexture]);
  
  // Determine material based on obstacle type
  const obstacleMaterial = useMemo(() => {
    if (obstacle.obstacleType === ObstacleType.BREAKABLE) {
      return new THREE.MeshStandardMaterial({
        map: woodTexture,
        color: obstacle.color,
        metalness: 0.1,
        roughness: 0.8,
      });
    } else if (obstacle.obstacleType === ObstacleType.PORTAL) {
      return new THREE.MeshStandardMaterial({
        color: '#8844ff',
        emissive: '#4422aa',
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2,
      });
    } else if (obstacle.obstacleType === ObstacleType.SPINNER) {
      return new THREE.MeshStandardMaterial({
        color: obstacle.color || '#FF5533',
        metalness: 0.7,
        roughness: 0.3,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: obstacle.color,
        metalness: 0.2,
        roughness: 0.7,
      });
    }
  }, [obstacle.obstacleType, obstacle.color, woodTexture]);
  
  // Handle dynamic obstacles
  useFrame((state, delta) => {
    if (!meshRef.current || gamePhase !== GamePhase.PLAYING) return;
    
    // Copy position and rotation from physics state
    meshRef.current.position.copy(obstacle.position);
    meshRef.current.quaternion.copy(obstacle.rotation);
    
    // Handle spinner rotation
    if (obstacle.obstacleType === ObstacleType.SPINNER) {
      meshRef.current.rotateY(delta * 2);
    }
    
    // Handle breakable obstacles cracking
    if (obstacle.obstacleType === ObstacleType.BREAKABLE && obstacle.health < 100) {
      const newProgress = 1 - (obstacle.health / 100);
      setBreakProgress(newProgress);
      
      if (newProgress > 0.95 && !isBroken) {
        setIsBroken(true);
        playHit();
        addObstacleDestroyed();
      }
    }
    
    // Handle portal pulsing
    if (obstacle.obstacleType === ObstacleType.PORTAL) {
      const scalePulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      meshRef.current.scale.set(
        obstacle.scale.x * scalePulse,
        obstacle.scale.y,
        obstacle.scale.z * scalePulse
      );
    }
  });
  
  // Generate geometry based on obstacle type
  const obstacleGeometry = () => {
    switch (obstacle.obstacleType) {
      case ObstacleType.CUBE:
        return <boxGeometry args={[1, 1, 1]} />;
      case ObstacleType.SPHERE:
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case ObstacleType.PYRAMID:
        return <coneGeometry args={[0.5, 1, 4]} />;
      case ObstacleType.CYLINDER:
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case ObstacleType.RAMP:
        return (
          <group>
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 8, 0, 0]}>
              <boxGeometry args={[1, 0.1, 2]} />
              <primitive object={obstacleMaterial} attach="material" />
            </mesh>
          </group>
        );
      case ObstacleType.PLATFORM:
        return <boxGeometry args={[2, 0.2, 2]} />;
      case ObstacleType.SPINNER:
        return (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.2, 0.2, 2]} />
              <primitive object={obstacleMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0]} rotation={[0, Math.PI/2, 0]}>
              <boxGeometry args={[0.2, 0.2, 2]} />
              <primitive object={obstacleMaterial} attach="material" />
            </mesh>
          </group>
        );
      case ObstacleType.PORTAL:
        return <torusGeometry args={[0.7, 0.2, 16, 32]} />;
      case ObstacleType.BREAKABLE:
        return <boxGeometry args={[1, 1, 1]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };
  
  // Don't render if broken
  if (isBroken) return null;
  
  return (
    <mesh
      ref={meshRef}
      position={obstacle.position.toArray()}
      rotation={[0, 0, 0]}
      scale={obstacle.scale.toArray()}
      castShadow
      receiveShadow
    >
      {obstacleGeometry()}
      {obstacle.obstacleType !== ObstacleType.RAMP && 
       obstacle.obstacleType !== ObstacleType.SPINNER && (
        <primitive object={obstacleMaterial} attach="material" />
      )}
      
      {/* Breakable indicator */}
      {obstacle.obstacleType === ObstacleType.BREAKABLE && breakProgress > 0 && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#FF3300" 
            wireframe
            transparent
            opacity={breakProgress * 0.7}
          />
        </mesh>
      )}
      
      {/* Trigger visual indicator */}
      {obstacle.obstacleType === ObstacleType.TRIGGER && (
        <mesh scale={[1.05, 1.05, 1.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial
            color="#FFDD00" 
            wireframe
            transparent
            opacity={isTriggered ? 0.8 : 0.3}
          />
        </mesh>
      )}
    </mesh>
  );
};

export default ObstacleComponent;

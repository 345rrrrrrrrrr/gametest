import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhysics } from '../../lib/stores/usePhysics';
import { useAudio } from '../../lib/stores/useAudio';
import { useScore } from '../../lib/stores/useScore';

interface PowerUpProps {
  id: string;
  type: 'speed' | 'jump' | 'gravity' | 'size' | 'multiplier' | 'magnetism' | 'explosion' | 'time';
  position: [number, number, number];
  rotation?: [number, number, number];
  duration?: number;
  strength?: number;
  color?: string;
  active?: boolean;
}

const PowerUp = forwardRef(({
  id,
  type,
  position,
  rotation = [0, 0, 0],
  duration = 10,
  strength = 1,
  color,
  active = true
}: PowerUpProps, ref) => {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const physics = usePhysics();
  const audioStore = useAudio();
  const scoreStore = useScore();
  
  const [collected, setCollected] = useState(false);
  const [scale, setScale] = useState(0);
  const startTime = useRef(Date.now());
  
  // Get color based on power-up type
  const getPowerUpColor = (): string => {
    if (color) return color;
    
    switch (type) {
      case 'speed': return '#2ecc71';
      case 'jump': return '#3498db';
      case 'gravity': return '#9b59b6';
      case 'size': return '#f1c40f';
      case 'multiplier': return '#e74c3c';
      case 'magnetism': return '#1abc9c';
      case 'explosion': return '#e67e22';
      case 'time': return '#34495e';
      default: return '#3498db';
    }
  };
  
  // Define power-up icon/shape based on type
  const getPowerUpGeometry = () => {
    switch (type) {
      case 'speed':
        return <dodecahedronGeometry args={[0.5, 0]} />;
      case 'jump':
        return <coneGeometry args={[0.4, 0.8, 8]} />;
      case 'gravity':
        return <sphereGeometry args={[0.5, 16, 16]} />;
      case 'size':
        return <boxGeometry args={[0.7, 0.7, 0.7]} />;
      case 'multiplier':
        return <octahedronGeometry args={[0.5, 0]} />;
      case 'magnetism':
        return <torusGeometry args={[0.4, 0.2, 16, 32]} />;
      case 'explosion':
        return <icosahedronGeometry args={[0.5, 0]} />;
      case 'time':
        return <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} />;
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  };
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      return groupRef.current ? groupRef.current.position : new THREE.Vector3();
    },
    isCollected: () => collected,
    collect: () => {
      if (!collected && active) {
        // Play collection sound
        audioStore.playSuccess();
        
        // Increment score
        scoreStore.addPoints(100);
        
        // Apply power-up effect
        applyPowerUpEffect();
        
        // Mark as collected
        setCollected(true);
        
        // Animate out
        setScale(0);
      }
    }
  }));
  
  // Register power-up with physics system
  useEffect(() => {
    if (!groupRef.current) return;
    
    physics.addPowerUp({
      id,
      type,
      object: groupRef.current,
      position: new THREE.Vector3(...position),
      duration,
      strength,
      active
    });
    
    // Entrance animation
    setTimeout(() => {
      setScale(1);
    }, 100);
    
    return () => {
      physics.removePowerUp(id);
    };
  }, []);
  
  // Apply the power-up effect to the world/player
  const applyPowerUpEffect = () => {
    switch (type) {
      case 'speed':
        physics.applyGlobalForce('speedBoost', strength, duration);
        break;
      case 'jump':
        physics.applyGlobalForce('jumpBoost', strength, duration);
        break;
      case 'gravity':
        physics.modifyGravity(strength < 1 ? 0.5 : 1.5, duration);
        break;
      case 'size':
        physics.modifyBallSize(strength, duration);
        break;
      case 'multiplier':
        scoreStore.setMultiplier(strength, duration);
        break;
      case 'magnetism':
        physics.enableMagnetism(duration);
        break;
      case 'explosion':
        physics.triggerExplosion(
          new THREE.Vector3(...position),
          strength * 5,
          strength * 10
        );
        break;
      case 'time':
        physics.modifyTimeScale(strength < 1 ? 0.5 : 1.5, duration);
        break;
    }
  };
  
  // Animate the power-up
  useFrame(() => {
    if (!groupRef.current || collected) return;
    
    const time = (Date.now() - startTime.current) * 0.001;
    
    // Hover animation
    groupRef.current.position.y = position[1] + Math.sin(time * 2) * 0.2;
    
    // Rotation animation
    groupRef.current.rotation.y += 0.01;
    
    // Make inner shape rotate independently
    if (innerRef.current) {
      innerRef.current.rotation.x += 0.02;
      innerRef.current.rotation.z += 0.01;
    }
  });
  
  if (!active || collected) return null;
  
  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation as any}
      scale={[scale, scale, scale]}
    >
      {/* Outer glow effect */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial 
          color={getPowerUpColor()} 
          transparent 
          opacity={0.2} 
        />
      </mesh>
      
      {/* Inner solid shape */}
      <mesh ref={innerRef}>
        {getPowerUpGeometry()}
        <meshStandardMaterial 
          color={getPowerUpColor()} 
          emissive={getPowerUpColor()}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
      
      {/* Center light */}
      <pointLight
        color={getPowerUpColor()}
        intensity={0.5}
        distance={2}
      />
    </group>
  );
});

export default PowerUp;

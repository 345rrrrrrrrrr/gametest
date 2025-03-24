import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PowerUp } from '@/types/entities';
import { PowerUpType } from '@/types/game';
import { useGameState } from '@/lib/stores/useGameState';
import { GamePhase } from '@/types/game';

interface PowerUpsProps {
  powerUps: PowerUp[];
}

const PowerUps = ({ powerUps }: PowerUpsProps) => {
  const gamePhase = useGameState(state => state.phase);
  const groupRef = useRef<THREE.Group>(null);
  
  // Create materials for different power-up types
  const materials = useRef<{[key in PowerUpType]?: THREE.Material}>({});
  
  useEffect(() => {
    // Initialize materials for each power-up type
    materials.current = {
      [PowerUpType.SPEED_BOOST]: new THREE.MeshStandardMaterial({
        color: '#FFDD00',
        emissive: '#FFBB00',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      }),
      [PowerUpType.GRAVITY_FLIP]: new THREE.MeshStandardMaterial({
        color: '#9955FF',
        emissive: '#6600FF',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      }),
      [PowerUpType.BALL_MULTIPLIER]: new THREE.MeshStandardMaterial({
        color: '#00FFAA',
        emissive: '#00DD88',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      }),
      [PowerUpType.SIZE_INCREASE]: new THREE.MeshStandardMaterial({
        color: '#FF5500',
        emissive: '#DD3300',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      }),
      [PowerUpType.SLOW_MOTION]: new THREE.MeshStandardMaterial({
        color: '#00DDFF',
        emissive: '#0099FF',
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.3
      }),
      [PowerUpType.EXPLOSIVE]: new THREE.MeshStandardMaterial({
        color: '#FF0000',
        emissive: '#DD0000',
        emissiveIntensity: 0.7,
        metalness: 0.6,
        roughness: 0.2
      }),
      [PowerUpType.MAGNET]: new THREE.MeshStandardMaterial({
        color: '#DDDDDD',
        emissive: '#999999',
        emissiveIntensity: 0.4,
        metalness: 0.9,
        roughness: 0.1
      }),
      [PowerUpType.GHOST]: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#DDDDFF',
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.7,
        metalness: 0.1,
        roughness: 0.2
      })
    };
  }, []);
  
  // Animate power-ups
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING || !groupRef.current) return;
    
    // Rotate and float all power-ups
    groupRef.current.children.forEach((child, index) => {
      // Get the original y position
      const origY = powerUps[index].position.y;
      
      // Spin around Y axis
      child.rotation.y += delta * 2;
      
      // Float up and down
      const time = state.clock.elapsedTime;
      child.position.y = origY + Math.sin(time * 2 + index) * 0.2;
      
      // Pulse scale for visual effect
      const pulse = 1 + Math.sin(time * 3 + index * 0.5) * 0.05;
      child.scale.set(pulse, pulse, pulse);
    });
  });
  
  // Create 3D models for each power-up type
  const createPowerUpGeometry = (type: PowerUpType) => {
    switch (type) {
      case PowerUpType.SPEED_BOOST:
        return <dodecahedronGeometry args={[0.5, 0]} />;
      case PowerUpType.GRAVITY_FLIP:
        return <boxGeometry args={[0.7, 0.7, 0.7]} />;
      case PowerUpType.BALL_MULTIPLIER:
        return <icosahedronGeometry args={[0.5, 0]} />;
      case PowerUpType.SIZE_INCREASE:
        return <sphereGeometry args={[0.5, 16, 16]} />;
      case PowerUpType.SLOW_MOTION:
        return <octahedronGeometry args={[0.5, 0]} />;
      case PowerUpType.EXPLOSIVE:
        return <tetrahedronGeometry args={[0.5, 0]} />;
      case PowerUpType.MAGNET:
        return <torusGeometry args={[0.3, 0.15, 16, 32]} />;
      case PowerUpType.GHOST:
        return <sphereGeometry args={[0.5, 16, 16]} />;
      default:
        return <sphereGeometry args={[0.5, 16, 16]} />;
    }
  };
  
  return (
    <group ref={groupRef}>
      {powerUps.map((powerUp, index) => (
        <mesh
          key={powerUp.id}
          position={powerUp.position.toArray()}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
          castShadow
        >
          {createPowerUpGeometry(powerUp.powerUpType)}
          <primitive 
            object={materials.current[powerUp.powerUpType] || materials.current[PowerUpType.SPEED_BOOST]} 
            attach="material" 
          />
          
          {/* Outer glow effect */}
          <mesh scale={[1.2, 1.2, 1.2]}>
            {createPowerUpGeometry(powerUp.powerUpType)}
            <meshBasicMaterial 
              color={materials.current[powerUp.powerUpType]?.color || '#FFFFFF'} 
              transparent={true} 
              opacity={0.3}
            />
          </mesh>
          
          {/* Power-up respawn visual indicator */}
          {powerUp.isRespawning && (
            <mesh scale={[1.5, 1.5, 1.5]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial
                color="#FFFFFF"
                wireframe
                transparent
                opacity={0.2 + Math.sin(Date.now() * 0.005) * 0.2}
              />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  );
};

export default PowerUps;

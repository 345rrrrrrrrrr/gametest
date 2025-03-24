import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionEffectProps {
  position: THREE.Vector3;
  color?: string;
  intensity?: number;
  duration?: number;
  size?: number;
}

export const ExplosionEffect = ({
  position,
  color = '#ff5500',
  intensity = 1.0,
  duration = 1.0,
  size = 1.0
}: ExplosionEffectProps) => {
  // References for animation
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const startTime = useRef<number>(Date.now());
  const active = useRef<boolean>(true);
  
  // Create particles for explosion
  const particleCount = useMemo(() => Math.ceil(30 * intensity), [intensity]);
  
  // Create particle positions and velocities
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map(() => {
      // Random direction for each particle
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      
      // Random speed
      const speed = 2 + Math.random() * 3 * intensity;
      
      // Random size
      const particleSize = (0.1 + Math.random() * 0.3) * size;
      
      // Random rotation
      const rotation = [
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ];
      
      return {
        direction,
        speed,
        size: particleSize,
        rotation,
        position: new THREE.Vector3(0, 0, 0)
      };
    });
  }, [particleCount, intensity, size]);
  
  // Animation frame
  useFrame(() => {
    if (!groupRef.current || !active.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const remainingLife = 1 - progress;
    
    // Update particles
    if (groupRef.current.children.length > 1) {
      for (let i = 1; i < groupRef.current.children.length; i++) {
        const particle = groupRef.current.children[i] as THREE.Mesh;
        const particleData = particles[i - 1];
        
        if (particle && particleData) {
          // Update position
          const moveDistance = particleData.speed * 0.016 * (1 - progress * 0.8);
          particleData.position.add(
            particleData.direction.clone().multiplyScalar(moveDistance)
          );
          
          particle.position.copy(particleData.position);
          
          // Scale down as explosion progresses
          const scale = remainingLife * particleData.size;
          particle.scale.set(scale, scale, scale);
          
          // Slow down rotation as explosion progresses
          particle.rotation.x += 0.01 * remainingLife;
          particle.rotation.y += 0.01 * remainingLife;
          particle.rotation.z += 0.01 * remainingLife;
        }
      }
    }
    
    // Update light intensity
    if (lightRef.current) {
      // Bright at first, then fading
      const lightCurve = Math.max(0, remainingLife * 2 * intensity);
      lightRef.current.intensity = lightCurve;
      
      // Increase light range as explosion expands
      const expansionProgress = Math.min(progress * 2, 1);
      lightRef.current.distance = (2 + expansionProgress * 6) * size;
    }
    
    // Deactivate when done
    if (progress >= 1) {
      active.current = false;
    }
  });
  
  return (
    <group ref={groupRef} position={position.toArray()}>
      {/* Central light */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={intensity * 2}
        distance={2 * size}
        decay={2}
      />
      
      {/* Explosion particles */}
      {particles.map((particle, i) => (
        <mesh key={`explosion-particle-${i}`} rotation={particle.rotation as any}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

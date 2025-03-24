import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePhysics } from '../../lib/stores/usePhysics';
import { ObjectPool } from '../../helpers/ObjectPool';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface ParticleSystemProps {
  maxParticles?: number;
}

const ParticleSystem = ({ maxParticles = 1000 }: ParticleSystemProps) => {
  const physics = usePhysics();
  
  // References for the particle system
  const particlesRef = useRef<Particle[]>([]);
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  
  // Attributes
  const positionAttr = useRef<THREE.BufferAttribute | null>(null);
  const colorAttr = useRef<THREE.BufferAttribute | null>(null);
  const sizeAttr = useRef<THREE.BufferAttribute | null>(null);
  
  // Object pool for particle recycling
  const particlePool = useMemo(() => {
    return new ObjectPool<Particle>(
      () => ({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1,
        life: 0,
        maxLife: 2,
        active: false
      }),
      maxParticles
    );
  }, [maxParticles]);
  
  // Initialize particle system
  useEffect(() => {
    // Create buffer geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create attributes
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    
    // Fill arrays with initial values
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
      
      sizes[i] = 0;
    }
    
    // Create buffer attributes
    positionAttr.current = new THREE.BufferAttribute(positions, 3);
    colorAttr.current = new THREE.BufferAttribute(colors, 3);
    sizeAttr.current = new THREE.BufferAttribute(sizes, 1);
    
    // Set buffer attributes to geometry
    geometry.setAttribute('position', positionAttr.current);
    geometry.setAttribute('color', colorAttr.current);
    geometry.setAttribute('size', sizeAttr.current);
    
    geometryRef.current = geometry;
    
    // Initialize particle array
    particlesRef.current = Array(maxParticles).fill(null).map(() => 
      particlePool.get()
    );
    
    // Register with physics system to receive particle creation events
    physics.onParticleEmit((position, velocity, color, size, life) => {
      emitParticle(position, velocity, color, size, life);
    });
    
    return () => {
      physics.offParticleEmit();
    };
  }, []);
  
  // Emit a new particle
  const emitParticle = (
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    color: THREE.Color,
    size: number = 1,
    life: number = 2
  ) => {
    // Get a particle from the pool
    const particle = particlePool.get();
    
    // Set particle properties
    particle.position.copy(position);
    particle.velocity.copy(velocity);
    particle.color.copy(color);
    particle.size = size;
    particle.life = life;
    particle.maxLife = life;
    particle.active = true;
    
    // Add to active particles
    const freeIndex = particlesRef.current.findIndex(p => !p.active);
    if (freeIndex !== -1) {
      particlesRef.current[freeIndex] = particle;
    }
  };
  
  // Update particle system
  useFrame((_, delta) => {
    if (!geometryRef.current || !positionAttr.current || !colorAttr.current || !sizeAttr.current) return;
    
    // Update each particle
    particlesRef.current.forEach((particle, i) => {
      if (!particle.active) return;
      
      // Update life
      particle.life -= delta;
      
      // Check if particle is dead
      if (particle.life <= 0) {
        particle.active = false;
        
        // Reset position and size to avoid visual artifacts
        positionAttr.current!.setXYZ(i, 0, 0, 0);
        sizeAttr.current!.setX(i, 0);
        
        // Return to pool
        particlePool.release(particle);
        return;
      }
      
      // Apply physics to particle
      particle.velocity.y -= 9.81 * delta * 0.3; // Gravity
      particle.position.add(particle.velocity.clone().multiplyScalar(delta));
      
      // Apply damping
      particle.velocity.multiplyScalar(0.98);
      
      // Calculate opacity based on life
      const lifeRatio = particle.life / particle.maxLife;
      
      // Update attributes
      positionAttr.current!.setXYZ(
        i, 
        particle.position.x, 
        particle.position.y, 
        particle.position.z
      );
      
      colorAttr.current!.setXYZ(
        i, 
        particle.color.r, 
        particle.color.g, 
        particle.color.b
      );
      
      sizeAttr.current!.setX(i, particle.size * lifeRatio);
    });
    
    // Update the geometry attributes
    positionAttr.current.needsUpdate = true;
    colorAttr.current.needsUpdate = true;
    sizeAttr.current.needsUpdate = true;
  });
  
  return (
    <points ref={pointsRef}>
      {geometryRef.current && (
        <primitive object={geometryRef.current} />
      )}
      <pointsMaterial
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        vertexColors={true}
        blending={THREE.AdditiveBlending}
      >
        <texture
          attach="map"
          url="/path-to-particle-texture.png" // We don't generate images, so we'll use a simple circle shader
        />
      </pointsMaterial>
    </points>
  );
};

export default ParticleSystem;

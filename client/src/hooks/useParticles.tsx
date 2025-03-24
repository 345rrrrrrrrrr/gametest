import * as THREE from 'three';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { PARTICLE_COLORS, PARTICLE_LIFETIMES } from '@/lib/constants';
import debug from '@/lib/utils/debug';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  active: boolean;
}

interface UseParticlesProps {
  maxParticles?: number;
}

export const useParticles = ({ maxParticles = 1000 }: UseParticlesProps = {}) => {
  // Create particle system
  const particles = useRef<Particle[]>([]);
  const particlesGeometry = useRef<THREE.BufferGeometry>(new THREE.BufferGeometry());
  const particlesMaterial = useRef<THREE.PointsMaterial | null>(null);
  const particlesSystem = useRef<THREE.Points | null>(null);
  
  // Initialize particles
  useEffect(() => {
    // Create all particles with inactive state
    particles.current = Array(maxParticles).fill(null).map(() => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      acceleration: new THREE.Vector3(),
      color: new THREE.Color(),
      size: 0,
      life: 0,
      maxLife: 0,
      active: false
    }));
    
    // Create buffer geometry attributes
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    
    // Set initial values (all particles off screen)
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -1000; // Off screen
      positions[i * 3 + 2] = 0;
      
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
      
      sizes[i] = 0;
    }
    
    // Create buffer attributes
    particlesGeometry.current.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    
    particlesGeometry.current.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );
    
    particlesGeometry.current.setAttribute(
      'size',
      new THREE.BufferAttribute(sizes, 1)
    );
    
    debug.log(`Particle system initialized with ${maxParticles} particles`);
  }, [maxParticles]);
  
  // Create particle material with custom shader
  const createMaterial = () => {
    return new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
  };
  
  // Initialize particle system in the scene
  const initParticleSystem = (scene: THREE.Scene) => {
    if (particlesSystem.current) {
      scene.remove(particlesSystem.current);
    }
    
    particlesMaterial.current = createMaterial();
    particlesSystem.current = new THREE.Points(particlesGeometry.current, particlesMaterial.current);
    particlesSystem.current.frustumCulled = false; // Don't cull particles
    
    scene.add(particlesSystem.current);
    
    return () => {
      if (particlesSystem.current) {
        scene.remove(particlesSystem.current);
      }
    };
  };
  
  // Spawn explosion particles
  const spawnExplosion = (
    position: THREE.Vector3,
    count: number = 50,
    radius: number = 1,
    color: string | THREE.Color = '#ff4500'
  ) => {
    const baseColor = new THREE.Color(color);
    const activeCount = particles.current.filter(p => p.active).length;
    
    if (activeCount + count > maxParticles) {
      count = Math.max(0, maxParticles - activeCount);
      debug.warn(`Particle limit reached, spawning only ${count} particles`);
    }
    
    let spawned = 0;
    
    for (let i = 0; i < particles.current.length && spawned < count; i++) {
      const particle = particles.current[i];
      
      if (!particle.active) {
        // Random direction
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = radius * Math.random();
        
        const x = position.x + r * Math.sin(phi) * Math.cos(theta);
        const y = position.y + r * Math.sin(phi) * Math.sin(theta);
        const z = position.z + r * Math.cos(phi);
        
        particle.position.set(x, y, z);
        
        // Random velocity outward from center
        const speed = 2 + Math.random() * 3;
        particle.velocity.set(
          (x - position.x) * speed,
          (y - position.y) * speed,
          (z - position.z) * speed
        );
        
        // Slight gravity
        particle.acceleration.set(0, -1, 0);
        
        // Random size
        particle.size = 0.1 + Math.random() * 0.3;
        
        // Color variation
        const colorVariation = 0.2;
        particle.color.copy(baseColor);
        particle.color.r += (Math.random() - 0.5) * colorVariation;
        particle.color.g += (Math.random() - 0.5) * colorVariation;
        particle.color.b += (Math.random() - 0.5) * colorVariation;
        
        // Life
        particle.maxLife = 0.5 + Math.random() * 1;
        particle.life = particle.maxLife;
        particle.active = true;
        
        spawned++;
      }
    }
    
    return spawned;
  };
  
  // Spawn trail particles behind a moving object
  const spawnTrail = (
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    count: number = 1,
    color: string | THREE.Color = '#58a5f0'
  ) => {
    const baseColor = new THREE.Color(color);
    let spawned = 0;
    
    const speed = velocity.length();
    
    // Only spawn trail if moving fast enough
    if (speed < 0.5) return 0;
    
    for (let i = 0; i < particles.current.length && spawned < count; i++) {
      const particle = particles.current[i];
      
      if (!particle.active) {
        // Position slightly behind the moving object
        const offset = velocity.clone().normalize().multiplyScalar(-0.1);
        particle.position.copy(position).add(offset);
        
        // Add some random variation
        particle.position.x += (Math.random() - 0.5) * 0.1;
        particle.position.y += (Math.random() - 0.5) * 0.1;
        particle.position.z += (Math.random() - 0.5) * 0.1;
        
        // Slow velocity in the opposite direction of movement
        particle.velocity.copy(velocity).multiplyScalar(-0.05);
        particle.velocity.y += 0.05; // Slight upward drift
        
        // Very light gravity
        particle.acceleration.set(0, -0.1, 0);
        
        // Size based on speed
        particle.size = 0.05 + Math.min(0.2, speed * 0.02);
        
        // Color variation
        particle.color.copy(baseColor);
        
        // Life based on speed
        particle.maxLife = 0.2 + Math.min(0.8, speed * 0.05);
        particle.life = particle.maxLife;
        particle.active = true;
        
        spawned++;
      }
    }
    
    return spawned;
  };
  
  // Spawn sparkle particles for pickups, etc.
  const spawnSparkle = (
    position: THREE.Vector3,
    count: number = 20,
    radius: number = 0.5,
    color: string | THREE.Color = '#ffff00'
  ) => {
    const baseColor = new THREE.Color(color);
    let spawned = 0;
    
    for (let i = 0; i < particles.current.length && spawned < count; i++) {
      const particle = particles.current[i];
      
      if (!particle.active) {
        // Random position within radius
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = radius * Math.random();
        
        const x = position.x + r * Math.sin(phi) * Math.cos(theta);
        const y = position.y + r * Math.sin(phi) * Math.sin(theta);
        const z = position.z + r * Math.cos(phi);
        
        particle.position.set(x, y, z);
        
        // Random velocity upward and outward
        particle.velocity.set(
          (Math.random() - 0.5) * 2,
          1 + Math.random() * 2,
          (Math.random() - 0.5) * 2
        );
        
        // Light gravity
        particle.acceleration.set(0, -1, 0);
        
        // Random size
        particle.size = 0.05 + Math.random() * 0.1;
        
        // Color variation
        const colorVariation = 0.2;
        particle.color.copy(baseColor);
        particle.color.r += (Math.random() - 0.5) * colorVariation;
        particle.color.g += (Math.random() - 0.5) * colorVariation;
        particle.color.b += (Math.random() - 0.5) * colorVariation;
        
        // Life
        particle.maxLife = 0.3 + Math.random() * 0.7;
        particle.life = particle.maxLife;
        particle.active = true;
        
        spawned++;
      }
    }
    
    return spawned;
  };
  
  // Update particles
  useFrame((state, delta) => {
    // Skip if no particles system
    if (!particlesSystem.current) return;
    
    // Get geometry attributes
    const positions = particlesGeometry.current.attributes.position.array as Float32Array;
    const colors = particlesGeometry.current.attributes.color.array as Float32Array;
    const sizes = particlesGeometry.current.attributes.size.array as Float32Array;
    
    let updateNeeded = false;
    
    // Update each particle
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      
      if (particle.active) {
        // Update life
        particle.life -= delta;
        
        if (particle.life <= 0) {
          // Deactivate particle
          particle.active = false;
          
          // Move off screen
          positions[i * 3 + 1] = -1000;
          
          // Mark for update
          updateNeeded = true;
          continue;
        }
        
        // Update position based on velocity
        particle.velocity.add(
          particle.acceleration.clone().multiplyScalar(delta)
        );
        
        particle.position.add(
          particle.velocity.clone().multiplyScalar(delta)
        );
        
        // Update attributes
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
        
        // Calculate fade based on life
        const lifeFactor = particle.life / particle.maxLife;
        
        colors[i * 3] = particle.color.r;
        colors[i * 3 + 1] = particle.color.g;
        colors[i * 3 + 2] = particle.color.b;
        
        // Size can fade out
        sizes[i] = particle.size * lifeFactor;
        
        updateNeeded = true;
      }
    }
    
    // Update geometry only if needed
    if (updateNeeded) {
      particlesGeometry.current.attributes.position.needsUpdate = true;
      particlesGeometry.current.attributes.color.needsUpdate = true;
      particlesGeometry.current.attributes.size.needsUpdate = true;
    }
  });
  
  return {
    initParticleSystem,
    spawnExplosion,
    spawnTrail,
    spawnSparkle,
    particlesSystem
  };
};

export default useParticles;

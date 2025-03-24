import * as THREE from 'three';
import { EffectType } from '../stores/useEffectsState';
import { PARTICLE_COLORS, PARTICLE_LIFETIMES } from '../constants';

/**
 * Create a particle system of the specified type
 */
export function createParticleSystem(
  type: EffectType,
  maxParticles: number = 100
): THREE.Points {
  // Create geometry for the particles
  const geometry = new THREE.BufferGeometry();
  
  // Create arrays for particle properties
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const sizes = new Float32Array(maxParticles);
  const lifetimes = new Float32Array(maxParticles);
  
  // Initialize all particles to be offscreen initially
  for (let i = 0; i < maxParticles; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = -1000; // Set Y position way below the scene
    positions[i * 3 + 2] = 0;
    
    colors[i * 3] = 1.0;     // R
    colors[i * 3 + 1] = 1.0; // G
    colors[i * 3 + 2] = 1.0; // B
    
    sizes[i] = 0;
    lifetimes[i] = 0;
  }
  
  // Create buffer attributes
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
  
  // Choose material based on effect type
  let material: THREE.PointsMaterial;
  
  switch (type) {
    case 'explosion':
      material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      break;
      
    case 'trail':
      material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      break;
      
    case 'spark':
      material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      break;
      
    case 'smoke':
      material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      });
      break;
      
    case 'water':
      material = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      break;
      
    case 'fire':
      material = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      break;
      
    case 'portal':
      material = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      break;
      
    default:
      material = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      });
  }
  
  // Create the points system
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; // Prevent particles from disappearing when offscreen
  
  // Store metadata on the object
  (points as any).userData = {
    type,
    particleIndex: 0, // Next particle to use
    maxParticles,
    active: 0, // Number of active particles
    particleData: new Map() // Store additional particle data
  };
  
  return points;
}

/**
 * Emit particles from a point
 */
export function emitParticles(
  system: THREE.Points,
  type: EffectType,
  position: THREE.Vector3,
  color: string = '#ffffff',
  deltaTime: number = 1/60,
  scale: number = 1.0
): void {
  const userData = (system as any).userData;
  if (!userData) return;
  
  const geometry = system.geometry;
  const positions = geometry.attributes.position.array as Float32Array;
  const colors = geometry.attributes.color.array as Float32Array;
  const sizes = geometry.attributes.size.array as Float32Array;
  
  // Get color as RGB
  const colorObj = new THREE.Color(color);
  
  // Determine number of particles to emit based on type
  let particlesToEmit = 0;
  
  switch (type) {
    case 'explosion':
      // One-time burst
      particlesToEmit = userData.active === 0 ? Math.floor(20 * scale) : 0;
      break;
      
    case 'trail':
      // Continuous emission
      particlesToEmit = Math.ceil(10 * deltaTime * scale);
      break;
      
    case 'spark':
      // One-time burst
      particlesToEmit = userData.active === 0 ? Math.floor(15 * scale) : 0;
      break;
      
    case 'smoke':
      // Slow continuous emission
      particlesToEmit = Math.ceil(5 * deltaTime * scale);
      break;
      
    case 'water':
      // Spray pattern
      particlesToEmit = Math.ceil(8 * deltaTime * scale);
      break;
      
    case 'fire':
      // Continuous flame
      particlesToEmit = Math.ceil(12 * deltaTime * scale);
      break;
      
    case 'portal':
      // Circular emission
      particlesToEmit = Math.ceil(5 * deltaTime * scale);
      break;
      
    default:
      particlesToEmit = Math.ceil(5 * deltaTime * scale);
  }
  
  // Cap the number of particles
  particlesToEmit = Math.min(particlesToEmit, userData.maxParticles - userData.active);
  
  // Create new particles
  for (let i = 0; i < particlesToEmit; i++) {
    // Find the next available particle slot
    const particleIndex = findNextAvailableParticle(system);
    if (particleIndex === -1) break; // No more particles available
    
    // Set basic particle properties
    const idx = particleIndex * 3;
    
    // Set particle position with some randomness based on type
    switch (type) {
      case 'explosion':
        positions[idx] = position.x + (Math.random() - 0.5) * scale * 0.5;
        positions[idx + 1] = position.y + (Math.random() - 0.5) * scale * 0.5;
        positions[idx + 2] = position.z + (Math.random() - 0.5) * scale * 0.5;
        break;
        
      case 'trail':
        positions[idx] = position.x + (Math.random() - 0.5) * 0.1;
        positions[idx + 1] = position.y + (Math.random() - 0.5) * 0.1;
        positions[idx + 2] = position.z + (Math.random() - 0.5) * 0.1;
        break;
        
      case 'spark':
        positions[idx] = position.x + (Math.random() - 0.5) * 0.2;
        positions[idx + 1] = position.y + (Math.random() - 0.5) * 0.2;
        positions[idx + 2] = position.z + (Math.random() - 0.5) * 0.2;
        break;
        
      case 'portal':
        // Create circular pattern
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5 * scale + Math.random() * 0.5 * scale;
        positions[idx] = position.x + Math.cos(angle) * radius;
        positions[idx + 1] = position.y + (Math.random() - 0.5) * 0.2;
        positions[idx + 2] = position.z + Math.sin(angle) * radius;
        break;
        
      default:
        positions[idx] = position.x + (Math.random() - 0.5) * 0.3;
        positions[idx + 1] = position.y + (Math.random() - 0.5) * 0.3;
        positions[idx + 2] = position.z + (Math.random() - 0.5) * 0.3;
    }
    
    // Set particle color with slight variation
    colors[idx] = colorObj.r + (Math.random() - 0.5) * 0.2;
    colors[idx + 1] = colorObj.g + (Math.random() - 0.5) * 0.2;
    colors[idx + 2] = colorObj.b + (Math.random() - 0.5) * 0.2;
    
    // Set particle size based on type
    sizes[particleIndex] = getParticleSize(type, scale);
    
    // Store extra particle data
    userData.particleData.set(particleIndex, {
      lifetime: getParticleLifetime(type),
      velocity: getParticleVelocity(type, position),
      age: 0,
      active: true
    });
    
    userData.active++;
  }
  
  // Update all existing particles
  updateParticles(system, deltaTime);
  
  // Update the geometry attributes
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
}

/**
 * Update all particles in the system
 */
function updateParticles(system: THREE.Points, deltaTime: number): void {
  const userData = (system as any).userData;
  if (!userData) return;
  
  const geometry = system.geometry;
  const positions = geometry.attributes.position.array as Float32Array;
  const colors = geometry.attributes.color.array as Float32Array;
  const sizes = geometry.attributes.size.array as Float32Array;
  
  let updateNeeded = false;
  
  // Process each particle
  for (let i = 0; i < userData.maxParticles; i++) {
    const particleData = userData.particleData.get(i);
    if (!particleData || !particleData.active) continue;
    
    const idx = i * 3;
    
    // Update age
    particleData.age += deltaTime;
    
    // Check if particle has expired
    if (particleData.age >= particleData.lifetime) {
      // Deactivate particle
      particleData.active = false;
      userData.active--;
      
      // Move off screen
      positions[idx + 1] = -1000;
      updateNeeded = true;
      continue;
    }
    
    // Calculate life progress (0 to 1)
    const lifeProgress = particleData.age / particleData.lifetime;
    
    // Update position based on velocity
    positions[idx] += particleData.velocity.x * deltaTime;
    positions[idx + 1] += particleData.velocity.y * deltaTime;
    positions[idx + 2] += particleData.velocity.z * deltaTime;
    
    // Apply gravity based on effect type
    switch (userData.type) {
      case 'explosion':
      case 'spark':
        particleData.velocity.y -= 9.8 * deltaTime; // Gravity
        break;
        
      case 'smoke':
        particleData.velocity.y += 0.5 * deltaTime; // Float upward
        break;
        
      case 'fire':
        particleData.velocity.y += 1.0 * deltaTime; // Float upward faster
        // Add some random movement
        particleData.velocity.x += (Math.random() - 0.5) * deltaTime;
        particleData.velocity.z += (Math.random() - 0.5) * deltaTime;
        break;
    }
    
    // Fade out color based on life progress
    colors[idx] *= (1 - lifeProgress * 0.5);
    colors[idx + 1] *= (1 - lifeProgress * 0.5);
    colors[idx + 2] *= (1 - lifeProgress * 0.5);
    
    // Adjust size based on effect type and life progress
    switch (userData.type) {
      case 'explosion':
        // Expand and then contract
        sizes[i] = sizes[i] * (1 + lifeProgress * (lifeProgress < 0.3 ? 1 : -0.5));
        break;
        
      case 'smoke':
        // Expand over time
        sizes[i] = sizes[i] * (1 + lifeProgress);
        break;
        
      default:
        // Shrink slightly
        sizes[i] = sizes[i] * (1 - lifeProgress * 0.3);
    }
    
    updateNeeded = true;
  }
  
  if (updateNeeded) {
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
  }
}

/**
 * Find the next available particle slot
 */
function findNextAvailableParticle(system: THREE.Points): number {
  const userData = (system as any).userData;
  if (!userData) return -1;
  
  // Start from the next index after the last used one
  let startIdx = userData.particleIndex;
  let index = startIdx;
  
  do {
    const particleData = userData.particleData.get(index);
    if (!particleData || !particleData.active) {
      userData.particleIndex = (index + 1) % userData.maxParticles;
      return index;
    }
    
    index = (index + 1) % userData.maxParticles;
  } while (index !== startIdx);
  
  // If we get here, all particles are active
  return -1;
}

/**
 * Get a random particle size based on effect type
 */
function getParticleSize(type: EffectType, scale: number = 1.0): number {
  switch (type) {
    case 'explosion':
      return (0.3 + Math.random() * 0.4) * scale;
    case 'trail':
      return (0.1 + Math.random() * 0.2) * scale;
    case 'spark':
      return (0.2 + Math.random() * 0.2) * scale;
    case 'smoke':
      return (0.4 + Math.random() * 0.4) * scale;
    case 'water':
      return (0.1 + Math.random() * 0.3) * scale;
    case 'fire':
      return (0.3 + Math.random() * 0.3) * scale;
    case 'portal':
      return (0.2 + Math.random() * 0.2) * scale;
    default:
      return (0.2 + Math.random() * 0.3) * scale;
  }
}

/**
 * Get a random particle lifetime based on effect type
 */
function getParticleLifetime(type: EffectType): number {
  switch (type) {
    case 'explosion':
      return 0.5 + Math.random() * 0.5;
    case 'trail':
      return 0.2 + Math.random() * 0.3;
    case 'spark':
      return 0.3 + Math.random() * 0.4;
    case 'smoke':
      return 1.0 + Math.random() * 1.0;
    case 'water':
      return 0.4 + Math.random() * 0.4;
    case 'fire':
      return 0.3 + Math.random() * 0.3;
    case 'portal':
      return 0.5 + Math.random() * 0.5;
    default:
      return 0.5 + Math.random() * 0.5;
  }
}

/**
 * Get a random particle velocity based on effect type
 */
function getParticleVelocity(type: EffectType, position: THREE.Vector3): THREE.Vector3 {
  switch (type) {
    case 'explosion':
      // Radial outward velocity
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ).normalize();
      return direction.multiplyScalar(3 + Math.random() * 3);
      
    case 'trail':
      // Slight random velocity
      return new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5 + 0.2, // Slight upward bias
        (Math.random() - 0.5) * 0.5
      );
      
    case 'spark':
      // Upward and outward
      return new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      );
      
    case 'smoke':
      // Slow upward drift
      return new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0.2 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.3
      );
      
    case 'water':
      // Spray pattern
      return new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1,
        (Math.random() - 0.5) * 1.5
      );
      
    case 'fire':
      // Upward with flicker
      return new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        0.5 + Math.random() * 1,
        (Math.random() - 0.5) * 0.7
      );
      
    case 'portal':
      // Swirling motion
      const angle = Math.random() * Math.PI * 2;
      const radialVelocity = 0.5 + Math.random() * 0.5;
      return new THREE.Vector3(
        Math.cos(angle) * radialVelocity,
        (Math.random() - 0.5) * 0.5,
        Math.sin(angle) * radialVelocity
      );
      
    default:
      return new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1
      );
  }
}

import * as THREE from 'three';

export const ParticleShader = {
  vertexShader: `
    attribute float size;
    attribute float opacity;
    attribute vec3 customColor;
    
    varying vec3 vColor;
    varying float vOpacity;
    
    void main() {
      vColor = customColor;
      vOpacity = opacity;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Apply size attenuation based on distance
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  
  fragmentShader: `
    uniform sampler2D pointTexture;
    
    varying vec3 vColor;
    varying float vOpacity;
    
    void main() {
      // Calculate circular particle
      vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
      vec2 center = vec2(0.5, 0.5);
      float dist = length(uv - center);
      
      // Soft circular edge
      float fadeEdge = 0.5;
      float strength = 1.0 - smoothstep(fadeEdge - 0.1, fadeEdge, dist);
      
      // Base color from texture or simple circle
      vec4 texColor;
      
      #ifdef USE_TEXTURE
        texColor = texture2D(pointTexture, gl_PointCoord);
      #else
        texColor = vec4(1.0, 1.0, 1.0, strength);
      #endif
      
      // Apply color and opacity
      gl_FragColor = vec4(vColor, vOpacity) * texColor;
      
      // Discard nearly transparent pixels
      if (gl_FragColor.a < 0.01) discard;
    }
  `,
  
  // Default uniforms
  defaultUniforms: {
    pointTexture: { value: null }
  }
};

// Particle system parameters
export interface ParticleSystemParams {
  count: number;
  size: number;
  sizeRandomness: number;
  color: THREE.Color;
  colorRandomness: number;
  transparent: boolean;
  opacity: number;
  blending: THREE.BlendingEquation;
  texture?: THREE.Texture;
  lifetime: number;
  lifetimeRandomness: number;
}

// Create a basic particle material
export const createParticleMaterial = (
  params: Partial<ParticleSystemParams> = {}
): THREE.ShaderMaterial => {
  // Set default parameters
  const defaultParams: ParticleSystemParams = {
    count: 1000,
    size: 0.1,
    sizeRandomness: 0.5,
    color: new THREE.Color(0xffffff),
    colorRandomness: 0.2,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    lifetime: 2.0,
    lifetimeRandomness: 0.5
  };
  
  // Merge defaults with provided params
  const finalParams = { ...defaultParams, ...params };
  
  // Create uniforms
  const uniforms = {
    ...ParticleShader.defaultUniforms,
  };
  
  // Set texture if provided
  if (finalParams.texture) {
    uniforms.pointTexture = { value: finalParams.texture };
  }
  
  // Create material
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: ParticleShader.vertexShader,
    fragmentShader: finalParams.texture ? 
      ParticleShader.fragmentShader.replace('#ifdef USE_TEXTURE', '#define USE_TEXTURE') : 
      ParticleShader.fragmentShader,
    transparent: finalParams.transparent,
    blending: finalParams.blending,
    depthWrite: false
  });
  
  return material;
};

// Create a particle system geometry with attributes
export const createParticleSystemGeometry = (
  params: Partial<ParticleSystemParams> = {}
): THREE.BufferGeometry => {
  // Set default parameters
  const defaultParams: ParticleSystemParams = {
    count: 1000,
    size: 0.1,
    sizeRandomness: 0.5,
    color: new THREE.Color(0xffffff),
    colorRandomness: 0.2,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    lifetime: 2.0,
    lifetimeRandomness: 0.5
  };
  
  // Merge defaults with provided params
  const finalParams = { ...defaultParams, ...params };
  
  // Create geometry
  const geometry = new THREE.BufferGeometry();
  
  // Create attributes
  const positions = new Float32Array(finalParams.count * 3);
  const colors = new Float32Array(finalParams.count * 3);
  const sizes = new Float32Array(finalParams.count);
  const opacities = new Float32Array(finalParams.count);
  
  // Fill with initial values
  for (let i = 0; i < finalParams.count; i++) {
    // Position (initially at origin)
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    
    // Color with randomness
    const color = finalParams.color.clone();
    const randomFactor = 1.0 - finalParams.colorRandomness / 2 + Math.random() * finalParams.colorRandomness;
    color.r *= randomFactor;
    color.g *= randomFactor;
    color.b *= randomFactor;
    
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    // Size with randomness
    sizes[i] = finalParams.size * (1.0 - finalParams.sizeRandomness / 2 + Math.random() * finalParams.sizeRandomness);
    
    // Opacity
    opacities[i] = finalParams.opacity;
  }
  
  // Set attributes
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  
  return geometry;
};

// Create a simple explosion particle effect
export const createExplosionEffect = (
  position: THREE.Vector3,
  color: THREE.Color = new THREE.Color(0xff5500),
  count: number = 100,
  size: number = 0.2,
  speed: number = 5,
  duration: number = 2
): THREE.Points => {
  // Create geometry
  const geometry = createParticleSystemGeometry({
    count,
    size,
    color,
    colorRandomness: 0.3,
    sizeRandomness: 0.5
  });
  
  // Create material
  const material = createParticleMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending
  });
  
  // Create particle system
  const particles = new THREE.Points(geometry, material);
  particles.position.copy(position);
  
  // Store velocities and lifetimes in userData for animation
  const velocities: THREE.Vector3[] = [];
  const lifetimes: number[] = [];
  
  // Initialize particles with random velocities
  const positions = geometry.attributes.position.array;
  const sizes = geometry.attributes.size.array;
  const opacities = geometry.attributes.opacity.array;
  
  for (let i = 0; i < count; i++) {
    // Random direction
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);
    
    // Random speed
    const velocity = new THREE.Vector3(x, y, z);
    velocity.multiplyScalar(speed * (0.5 + Math.random() * 0.5));
    velocities.push(velocity);
    
    // Random lifetime
    lifetimes.push(duration * (0.5 + Math.random() * 0.5));
    
    // Initial position (slight random offset)
    positions[i * 3] = (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  
  // Store data for animation
  particles.userData = {
    velocities,
    lifetimes,
    duration,
    elapsedTime: 0
  };
  
  // Animation function
  particles.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
    const delta = 1 / 60; // Assume 60fps if no clock provided
    particles.userData.elapsedTime += delta;
    
    // Update particles
    const positions = geometry.attributes.position.array;
    const opacities = geometry.attributes.opacity.array;
    const sizes = geometry.attributes.size.array;
    
    for (let i = 0; i < count; i++) {
      // Update position based on velocity
      const velocity = particles.userData.velocities[i];
      positions[i * 3] += velocity.x * delta;
      positions[i * 3 + 1] += velocity.y * delta;
      positions[i * 3 + 2] += velocity.z * delta;
      
      // Apply gravity
      particles.userData.velocities[i].y -= 2 * delta;
      
      // Fade out based on lifetime
      const lifetime = particles.userData.lifetimes[i];
      const normalizedLife = 1 - (particles.userData.elapsedTime / lifetime);
      if (normalizedLife > 0) {
        opacities[i] = normalizedLife;
        sizes[i] *= 0.99; // Slowly shrink particles
      } else {
        opacities[i] = 0;
      }
    }
    
    // Update attributes
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    
    // Remove particles when all are done
    if (particles.userData.elapsedTime > duration * 1.5) {
      scene.remove(particles);
    }
  };
  
  return particles;
};

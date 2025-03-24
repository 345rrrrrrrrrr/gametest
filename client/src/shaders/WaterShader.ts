import * as THREE from 'three';

export const WaterShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveFrequency;
    uniform float uWaveSpeed;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vElevation;
    
    // Simplex noise function
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
      + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    void main() {
      vUv = uv;
      vPosition = position;
      
      // Calculate wave effect
      float frequency = uWaveFrequency;
      float time = uTime * uWaveSpeed;
      
      // Generate multiple waves for more complex water surface
      float wave1 = snoise(vec2(vUv.x * frequency, vUv.y * frequency + time * 0.2)) * 0.5;
      float wave2 = snoise(vec2(vUv.x * frequency * 2.0, vUv.y * frequency * 2.0 - time * 0.3)) * 0.25;
      float wave3 = snoise(vec2(vUv.x * frequency * 4.0 + time * 0.1, vUv.y * frequency * 4.0)) * 0.125;
      
      // Combine waves
      vElevation = wave1 + wave2 + wave3;
      
      // Apply to vertex position
      vec3 newPosition = position;
      newPosition.z += vElevation * uWaveHeight;
      
      // Recalculate normal
      vec3 tangent = normalize(vec3(1.0, 0.0, (snoise(vec2(vUv.x + 0.01, vUv.y) * frequency) - snoise(vec2(vUv.x, vUv.y) * frequency)) * uWaveHeight));
      vec3 bitangent = normalize(vec3(0.0, 1.0, (snoise(vec2(vUv.x, vUv.y + 0.01) * frequency) - snoise(vec2(vUv.x, vUv.y) * frequency)) * uWaveHeight));
      vNormal = normalize(cross(tangent, bitangent));
      
      // Output position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform vec3 uShallowColor;
    uniform vec3 uDeepColor;
    uniform float uShininess;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uLightDirection;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vElevation;
    
    void main() {
      // Normalized elevation for color mixing
      float normalizedElevation = (vElevation + 0.5) * 0.5;
      
      // Mix between shallow and deep water colors based on elevation
      vec3 baseColor = mix(uDeepColor, uShallowColor, normalizedElevation);
      
      // Add ripples
      float ripple = sin(vUv.x * 40.0 + vUv.y * 40.0 + uTime * 2.0) * 0.02;
      baseColor += ripple;
      
      // Calculate lighting
      vec3 normal = normalize(vNormal);
      vec3 lightDir = normalize(uLightDirection);
      float diffuse = max(dot(normal, lightDir), 0.0);
      
      // Specular highlight
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 halfDir = normalize(lightDir + viewDir);
      float specular = pow(max(dot(normal, halfDir), 0.0), uShininess) * 0.8;
      
      // Add time-based sparkles to the water
      float sparkle = pow(max(dot(normal, lightDir), 0.0), 50.0) * sin(uTime * 3.0 + vUv.x * 100.0 + vUv.y * 100.0) * 0.5 + 0.5;
      sparkle *= 0.3;
      
      // Combine lighting
      vec3 color = baseColor * (0.3 + diffuse * 0.7) + vec3(specular + sparkle);
      
      // Output final color with transparency
      gl_FragColor = vec4(color, uOpacity);
    }
  `,
  
  // Default uniforms
  defaultUniforms: {
    uTime: { value: 0 },
    uWaveHeight: { value: 0.2 },
    uWaveFrequency: { value: 3.0 },
    uWaveSpeed: { value: 0.5 },
    uShallowColor: { value: new THREE.Color(0x42b0f5) },
    uDeepColor: { value: new THREE.Color(0x0d47a1) },
    uShininess: { value: 100 },
    uOpacity: { value: 0.8 },
    uLightDirection: { value: new THREE.Vector3(0.5, 0.8, 0.2) }
  }
};

// Create water material with default or custom settings
export const createWaterMaterial = (
  options: {
    waveHeight?: number;
    waveFrequency?: number;
    waveSpeed?: number;
    shallowColor?: THREE.Color;
    deepColor?: THREE.Color;
    shininess?: number;
    opacity?: number;
    lightDirection?: THREE.Vector3;
  } = {}
): THREE.ShaderMaterial => {
  // Create uniforms with defaults and custom options
  const uniforms = {
    uTime: { value: 0 },
    uWaveHeight: { value: options.waveHeight || WaterShader.defaultUniforms.uWaveHeight.value },
    uWaveFrequency: { value: options.waveFrequency || WaterShader.defaultUniforms.uWaveFrequency.value },
    uWaveSpeed: { value: options.waveSpeed || WaterShader.defaultUniforms.uWaveSpeed.value },
    uShallowColor: { value: options.shallowColor || WaterShader.defaultUniforms.uShallowColor.value },
    uDeepColor: { value: options.deepColor || WaterShader.defaultUniforms.uDeepColor.value },
    uShininess: { value: options.shininess || WaterShader.defaultUniforms.uShininess.value },
    uOpacity: { value: options.opacity !== undefined ? options.opacity : WaterShader.defaultUniforms.uOpacity.value },
    uLightDirection: { value: options.lightDirection || WaterShader.defaultUniforms.uLightDirection.value }
  };
  
  // Create shader material
  return new THREE.ShaderMaterial({
    uniforms,
    vertexShader: WaterShader.vertexShader,
    fragmentShader: WaterShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });
};

// Create a water plane with the water shader
export const createWaterSurface = (
  width: number = 20,
  height: number = 20,
  widthSegments: number = 64,
  heightSegments: number = 64,
  options: any = {}
): THREE.Mesh => {
  // Create water geometry with segments for wave detail
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  geometry.rotateX(-Math.PI / 2); // Rotate to be horizontal
  
  // Create water material
  const material = createWaterMaterial(options);
  
  // Create and return mesh
  return new THREE.Mesh(geometry, material);
};

// Update water material time uniform
export const updateWaterMaterial = (material: THREE.ShaderMaterial, time: number): void => {
  if (material.uniforms && material.uniforms.uTime) {
    material.uniforms.uTime.value = time;
  }
};

// Create a simple water ripple effect
export const createWaterRipple = (
  position: THREE.Vector3,
  size: number = 5,
  duration: number = 2,
  options: any = {}
): THREE.Mesh => {
  // Create a circular plane for the ripple
  const geometry = new THREE.CircleGeometry(size, 32);
  geometry.rotateX(-Math.PI / 2); // Make it horizontal
  
  // Create ripple material based on the RippleShader from RippleShader.ts
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: options.color || new THREE.Color(0x4b80ff) },
      uOpacity: { value: 1 },
      uIntensity: { value: options.intensity || 1 },
      uSpeed: { value: options.speed || 1 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uIntensity;
      
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        
        // Calculate radial distance from center
        vec2 center = vec2(0.5, 0.5);
        float dist = length(vUv - center);
        
        // Calculate ripple effect
        float wave = sin(dist * 20.0 - uTime * 2.0) * 0.05 * (1.0 - dist * 2.0);
        
        // Apply to vertex position
        vec3 newPosition = position;
        newPosition.y += wave * uIntensity;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uProgress;
      uniform float uOpacity;
      
      varying vec2 vUv;
      
      void main() {
        // Calculate radial distance from center
        vec2 center = vec2(0.5, 0.5);
        float dist = length(vUv - center);
        
        // Create a ring effect
        float ring = smoothstep(0.0, 0.2, dist) * smoothstep(1.0, 0.8, dist);
        
        // Fade out based on progress
        float alpha = ring * (1.0 - uProgress) * uOpacity;
        
        // Output color with transparency
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  
  // Create the ripple mesh
  const ripple = new THREE.Mesh(geometry, material);
  ripple.position.copy(position);
  ripple.position.y += 0.05; // Slightly above the water surface
  
  // Animation data
  ripple.userData = {
    startTime: Date.now(),
    duration
  };
  
  // Update function
  ripple.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
    const elapsed = (Date.now() - ripple.userData.startTime) / 1000;
    const progress = Math.min(elapsed / ripple.userData.duration, 1.0);
    
    // Update uniforms
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uProgress.value = progress;
    
    // Remove when finished
    if (progress >= 1.0) {
      scene.remove(ripple);
    }
  };
  
  return ripple;
};

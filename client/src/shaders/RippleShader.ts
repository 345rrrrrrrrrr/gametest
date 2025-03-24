import * as THREE from 'three';

export const RippleShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    uniform float uIntensity;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      // Calculate ripple effect
      float distance = length(uv - 0.5);
      float maxDistance = 0.5;
      
      // Create multiple waves from center with different speeds
      float wave1 = sin((distance * 15.0 - uTime * uIntensity) * 6.0) * 0.05;
      float wave2 = sin((distance * 25.0 - uTime * uIntensity * 1.3) * 4.0) * 0.015;
      
      // Fade waves based on distance and progress
      float distanceFactor = 1.0 - distance / maxDistance;
      float waveFactor = distanceFactor * (1.0 - uProgress * 1.2);
      
      // Combined wave effect
      vElevation = (wave1 + wave2) * waveFactor;
      
      // Calculate position with ripple effect
      vec3 newPosition = position;
      newPosition.z += vElevation * uIntensity;
      
      // Output position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uProgress;
    uniform float uOpacity;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      // Calculate distance from center
      float distance = length(vUv - 0.5);
      
      // Create gradient based on distance
      float gradient = 1.0 - smoothstep(0.0, 0.5, distance);
      
      // Add some rings
      float rings = abs(sin(distance * 30.0 - uTime * 2.0)) * 0.15;
      
      // Calculate alpha for transparency
      float alpha = gradient * (0.4 + rings) * uOpacity;
      
      // Add glow to the ripple
      vec3 finalColor = uColor;
      finalColor += vec3(rings * 0.5);
      
      // Fade out based on progress
      alpha *= (1.0 - uProgress * 1.2);
      alpha = clamp(alpha, 0.0, 1.0);
      
      // Output color with transparency
      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
  
  // Default uniforms
  defaultUniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x4b80ff) },
    uProgress: { value: 0 },
    uOpacity: { value: 1 },
    uIntensity: { value: 1 },
    uSpeed: { value: 1 }
  }
};

// Helper function to create ripple material
export const createRippleMaterial = (
  color: THREE.Color = new THREE.Color(0x4b80ff),
  intensity: number = 1,
  speed: number = 1
): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: color },
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uIntensity: { value: intensity },
      uSpeed: { value: speed }
    },
    vertexShader: RippleShader.vertexShader,
    fragmentShader: RippleShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
};

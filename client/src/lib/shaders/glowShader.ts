// Shader for creating glow effects around objects

const glowShader = {
  vertex: `
    uniform float uTime;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // Add slight animation based on time
      vec3 pos = position;
      pos += normal * (sin(uTime * 2.0) * 0.02 + 0.02);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  
  fragment: `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uStrength;
    uniform float uRadius;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // Calculate fresnel effect for edge glow
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = dot(viewDirection, vNormal);
      fresnel = pow(1.0 - fresnel, 3.0);
      
      // Add time-based pulsing
      float pulse = (sin(uTime * 2.0) * 0.1 + 0.9) * uStrength;
      
      // Combine effects for final glow
      float finalStrength = fresnel * pulse;
      
      // Apply color with strength
      vec3 finalColor = uColor * finalStrength;
      
      gl_FragColor = vec4(finalColor, finalStrength);
    }
  `
};

export default glowShader;

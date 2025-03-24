// Shader for creating realistic water surfaces

const waterShader = {
  vertex: `
    uniform float uTime;
    uniform float uWaveHeight;
    uniform float uWaveFrequency;
    uniform float uWaveSpeed;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      
      // Calculate wave effect
      float elevation = 
        sin(position.x * uWaveFrequency + uTime * uWaveSpeed) * 
        sin(position.z * uWaveFrequency + uTime * uWaveSpeed) * 
        uWaveHeight;
      
      vElevation = elevation;
      
      // Apply elevation to position
      vec3 newPosition = position;
      newPosition.y += elevation;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  
  fragment: `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform float uTime;
    
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      // Create water color pattern
      float mixStrength = (vElevation + uWaveHeight) / (2.0 * uWaveHeight);
      
      // Adjust for ripple effect
      float ripples = sin((vUv.x + vUv.y) * 20.0 + uTime * 3.0) * 0.1;
      mixStrength += ripples;
      
      vec3 color = mix(uColor1, uColor2, mixStrength);
      
      // Add highlights based on elevation
      float highlightIntensity = max(0.0, vElevation * 2.0);
      color += vec3(highlightIntensity);
      
      // Fresnel-like edge effect for transparency
      float alpha = 0.7 + sin(vUv.x * 10.0 + uTime) * 0.1;
      
      gl_FragColor = vec4(color, alpha);
    }
  `
};

export default waterShader;

// Define a shader for rendering particle effects in the 3D scene

const particleShader = {
  vertex: `
    uniform float uTime;
    uniform float uSize;
    
    attribute float aScale;
    attribute vec3 aRandomness;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Position
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      
      // Add some randomness to position based on time
      float angle = uTime * aRandomness.x * 0.5;
      modelPosition.x += sin(angle) * aRandomness.y * 0.1;
      modelPosition.y += cos(angle) * aRandomness.z * 0.1;
      
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;
      gl_Position = projectedPosition;
      
      // Size
      gl_PointSize = uSize * aScale;
      gl_PointSize *= (1000.0 / -viewPosition.z);
      
      // Pass data to fragment shader
      vColor = color;
      
      // Calculate distance-based alpha
      float distanceAlpha = 1.0 - clamp(length(viewPosition.xyz) / 100.0, 0.0, 1.0);
      vAlpha = distanceAlpha;
    }
  `,
  
  fragment: `
    uniform sampler2D uTexture;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Circular shape for point
      float distanceToCenter = length(gl_PointCoord - vec2(0.5));
      float strength = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
      
      // Apply color
      gl_FragColor = vec4(vColor, strength * vAlpha);
      
      // Apply texture if available
      if (strength < 0.05) discard;
    }
  `
};

export default particleShader;

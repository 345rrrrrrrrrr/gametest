// Shader for creating dynamic sky backgrounds

const skyShader = {
  vertex: `
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragment: `
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform vec3 uSunPosition;
    uniform vec3 uSunColor;
    uniform float uSunSize;
    uniform float uTime;
    
    varying vec3 vWorldPosition;
    
    void main() {
      // Normalize the world position to get direction vector from camera
      vec3 viewDirection = normalize(vWorldPosition);
      
      // Calculate sky gradient based on height (Y component)
      float h = normalize(viewDirection).y;
      float skyGradient = max(0.0, (h + 0.3) / 1.2);
      
      // Mix colors based on height
      vec3 skyColor = mix(uBottomColor, uTopColor, skyGradient);
      
      // Add subtle noise to sky
      float noise = fract(sin(dot(viewDirection, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
      skyColor += noise * 0.01;
      
      // Calculate sun effect
      float sunEffect = max(0.0, dot(viewDirection, normalize(uSunPosition)));
      sunEffect = pow(sunEffect, 32.0 / uSunSize);
      
      // Add clouds
      float cloudNoise = fract(sin(dot(viewDirection * 15.0 + uTime * 0.01, 
                                       vec3(12.9898, 78.233, 45.543))) * 43758.5453);
      float clouds = (smoothstep(0.4, 0.6, cloudNoise) * 0.5 * max(0.0, viewDirection.y));
      
      // Create final color with sun
      vec3 finalColor = skyColor + uSunColor * sunEffect;
      finalColor = mix(finalColor, vec3(1.0), clouds);
      
      // Add stars at night (if top color is dark)
      float darkness = 1.0 - (uTopColor.r + uTopColor.g + uTopColor.b) / 3.0;
      if (darkness > 0.5) {
        float stars = step(0.98, fract(sin(dot(viewDirection * 1000.0, 
                                              vec3(13.9898, 72.233, 49.543))) * 43758.5453));
        finalColor += stars * darkness * vec3(1.0);
      }
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export default skyShader;

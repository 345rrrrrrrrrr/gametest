import * as THREE from 'three';

export const GlowShader = {
  vertexShader: `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uIntensity;
    uniform float uTime;
    uniform float uPulse;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      // Calculate view direction
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      
      // Calculate fresnel effect (stronger glow at edges)
      float fresnel = dot(viewDirection, vNormal);
      fresnel = pow(1.0 - fresnel, 3.0);
      
      // Apply time-based pulsing if enabled
      float pulseIntensity = 1.0;
      if (uPulse > 0.0) {
        pulseIntensity = 0.8 + sin(uTime * 2.0) * 0.2 * uPulse;
      }
      
      // Calculate final glow
      float glow = fresnel * uIntensity * pulseIntensity;
      
      // Apply color with glow intensity
      vec3 finalColor = uColor * glow;
      
      // Output color with transparency based on glow
      gl_FragColor = vec4(finalColor, glow * 0.8);
    }
  `,
  
  // Default uniforms
  defaultUniforms: {
    uColor: { value: new THREE.Color(0x00aaff) },
    uIntensity: { value: 1.0 },
    uTime: { value: 0 },
    uPulse: { value: 1.0 }
  }
};

// Helper function to create glow material
export const createGlowMaterial = (
  color: THREE.Color = new THREE.Color(0x00aaff),
  intensity: number = 1.0,
  pulse: number = 1.0
): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
      uTime: { value: 0 },
      uPulse: { value: pulse }
    },
    vertexShader: GlowShader.vertexShader,
    fragmentShader: GlowShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending
  });
};

// Add a glow to an existing mesh
export const addGlowEffect = (
  mesh: THREE.Mesh,
  color: THREE.Color = new THREE.Color(0x00aaff),
  intensity: number = 1.0,
  scale: number = 1.1
): THREE.Mesh => {
  // Create a slightly larger copy of the mesh for the glow effect
  const glowGeometry = mesh.geometry.clone();
  
  // Create glow material
  const glowMaterial = createGlowMaterial(color, intensity);
  
  // Create glow mesh
  const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
  glowMesh.scale.set(scale, scale, scale);
  
  // Add glow mesh as a child
  mesh.add(glowMesh);
  
  return glowMesh;
};

// Create a bloom pass for post-processing
export const createBloomEffect = (scene: THREE.Scene, camera: THREE.Camera): THREE.Object3D => {
  // Create a group that will be rendered to a separate render target
  const bloomGroup = new THREE.Group();
  scene.add(bloomGroup);
  
  // Create a render target for the bloom effect
  const renderTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding
    }
  );
  
  // Create a full-screen quad to display the bloom effect
  const bloomMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: renderTarget.texture },
      uIntensity: { value: 1.5 }
    },
    vertexShader: `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uIntensity;
      
      varying vec2 vUv;
      
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec3 color = texel.rgb;
        
        // Threshold for bright areas
        float brightness = dot(color, vec3(0.299, 0.587, 0.114));
        if (brightness > 0.7) {
          color *= uIntensity;
        } else {
          color = vec3(0.0);
        }
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthWrite: false
  });
  
  // Create a plane to display the bloom effect
  const bloomPlane = new THREE.PlaneGeometry(2, 2);
  const bloomQuad = new THREE.Mesh(bloomPlane, bloomMaterial);
  bloomQuad.visible = false; // This will be rendered to a separate pass
  
  bloomGroup.add(bloomQuad);
  
  return bloomGroup;
};

import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSettingsState } from '@/lib/stores/useSettingsState';
import { useLevelState } from '@/lib/stores/useLevelState';

const Lighting = () => {
  const shadowQuality = useSettingsState(state => state.settings.shadowQuality);
  const currentLevel = useLevelState(state => state.currentLevel);
  
  // References to lights
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const pointLightsRef = useRef<THREE.PointLight[]>([]);
  
  // Configure lighting based on level settings and quality
  useEffect(() => {
    if (!directionalLightRef.current || !ambientLightRef.current) return;
    
    // Configure directional light shadow properties based on quality setting
    const dirLight = directionalLightRef.current;
    
    if (shadowQuality === 'high') {
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 500;
      dirLight.shadow.bias = -0.001;
    } else if (shadowQuality === 'medium') {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 350;
      dirLight.shadow.bias = -0.001;
    } else {
      dirLight.shadow.mapSize.width = 512;
      dirLight.shadow.mapSize.height = 512;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 200;
      dirLight.shadow.bias = -0.002;
    }
    
    // Set up shadow camera frustum
    const shadowSize = 30;
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    
    // Update shadow camera
    dirLight.shadow.camera.updateProjectionMatrix();
    
    // Configure light intensities based on level settings
    if (currentLevel?.settings) {
      dirLight.intensity = currentLevel.settings.directionalLightIntensity;
      ambientLightRef.current.intensity = currentLevel.settings.ambientLightIntensity;
      
      // Set shadow enabled state
      dirLight.castShadow = currentLevel.settings.shadowsEnabled;
    }
  }, [shadowQuality, currentLevel]);
  
  // Animate subtle light movement for more dynamic feel
  useFrame((state, delta) => {
    if (directionalLightRef.current) {
      const time = state.clock.elapsedTime;
      
      // Subtle sun movement
      directionalLightRef.current.position.x = Math.sin(time * 0.1) * 50;
      directionalLightRef.current.position.z = Math.cos(time * 0.1) * 50;
      
      // Update directional light target position
      const target = directionalLightRef.current.target as THREE.Object3D;
      target.updateMatrixWorld();
    }
    
    // Animate point lights if any
    pointLightsRef.current.forEach((light, index) => {
      const time = state.clock.elapsedTime;
      const offset = index * Math.PI / 4;
      
      // Subtle pulsing of intensity
      light.intensity = 0.7 + Math.sin(time * 2 + offset) * 0.3;
    });
  });
  
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={[10, 40, 20]}
        intensity={1.5}
        castShadow={true}
        color="#ffffff"
      />
      
      {/* Ambient light for general illumination */}
      <ambientLight 
        ref={ambientLightRef}
        intensity={0.4} 
        color="#aabbff"
      />
      
      {/* Hemisphere light for more natural outdoor lighting */}
      <hemisphereLight 
        intensity={0.5}
        color="#bbddff"
        groundColor="#334455"
      />
      
      {/* Optional colored point lights for accent lighting */}
      <pointLight
        ref={(el) => el && (pointLightsRef.current[0] = el)}
        position={[15, 5, -15]}
        intensity={0.8}
        color="#ff8800"
        distance={50}
        decay={2}
        castShadow={false}
      />
      
      <pointLight
        ref={(el) => el && (pointLightsRef.current[1] = el)}
        position={[-15, 5, 15]}
        intensity={0.8}
        color="#0088ff"
        distance={50}
        decay={2}
        castShadow={false}
      />
    </>
  );
};

export default Lighting;

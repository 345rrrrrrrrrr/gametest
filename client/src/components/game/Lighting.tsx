import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSettings } from '../../lib/stores/useSettings';

const Lighting = () => {
  const settings = useSettings();
  const mainLightRef = useRef<THREE.DirectionalLight>(null);
  const secondaryLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  
  // Time tracking for animation
  const time = useRef(0);
  
  // Set up lights based on settings
  useEffect(() => {
    if (mainLightRef.current) {
      mainLightRef.current.intensity = settings.lightingQuality === 'high' ? 1.2 : 0.8;
      mainLightRef.current.castShadow = settings.shadows;
      
      // Configure shadow properties if enabled
      if (settings.shadows) {
        const shadowMapSize = settings.lightingQuality === 'high' ? 2048 : 1024;
        mainLightRef.current.shadow.mapSize.width = shadowMapSize;
        mainLightRef.current.shadow.mapSize.height = shadowMapSize;
        mainLightRef.current.shadow.camera.near = 0.5;
        mainLightRef.current.shadow.camera.far = 50;
        mainLightRef.current.shadow.camera.left = -20;
        mainLightRef.current.shadow.camera.right = 20;
        mainLightRef.current.shadow.camera.top = 20;
        mainLightRef.current.shadow.camera.bottom = -20;
        mainLightRef.current.shadow.bias = -0.0005;
      }
    }
    
    if (secondaryLightRef.current) {
      secondaryLightRef.current.intensity = settings.lightingQuality === 'high' ? 0.7 : 0.4;
      secondaryLightRef.current.castShadow = settings.shadows && settings.lightingQuality === 'high';
    }
    
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = settings.lightingQuality === 'high' ? 0.5 : 0.7;
    }
  }, [settings.lightingQuality, settings.shadows]);
  
  // Animate lights if settings allow
  useFrame((_, delta) => {
    if (settings.dynamicLighting && mainLightRef.current) {
      time.current += delta;
      
      // Subtle movement of main light to create dynamic shadows
      const xPos = Math.sin(time.current * 0.1) * 5;
      const zPos = Math.cos(time.current * 0.1) * 5;
      
      mainLightRef.current.position.x = xPos;
      mainLightRef.current.position.z = zPos;
      
      // Update the light target to maintain direction
      mainLightRef.current.target.position.set(0, 0, 0);
      mainLightRef.current.target.updateMatrixWorld();
    }
  });
  
  return (
    <>
      {/* Main directional light */}
      <directionalLight
        ref={mainLightRef}
        position={[5, 10, 5]}
        color="#ffffff"
        intensity={1.2}
        castShadow
      >
        {settings.debug && (
          <directionalLightHelper args={[undefined, 5]} />
        )}
      </directionalLight>
      
      {/* Secondary fill light */}
      <directionalLight
        ref={secondaryLightRef}
        position={[-10, 8, -10]}
        color="#b3ccff"
        intensity={0.7}
        castShadow={settings.lightingQuality === 'high'}
      />
      
      {/* Ambient light for base illumination */}
      <ambientLight
        ref={ambientLightRef}
        color="#aabbff"
        intensity={0.5}
      />
      
      {/* Add hemisphere light for more realistic outdoor lighting */}
      {settings.lightingQuality === 'high' && (
        <hemisphereLight
          color="#bde8ff"
          groundColor="#523e50"
          intensity={0.8}
        />
      )}
      
      {/* Add environment-specific lights */}
      {settings.environment === 'night' && (
        <>
          <pointLight
            position={[10, 15, 0]}
            color="#4e88ff"
            intensity={2}
            distance={50}
          />
          <pointLight
            position={[-15, 5, -15]}
            color="#a64dff"
            intensity={1.5}
            distance={35}
          />
        </>
      )}
      
      {settings.environment === 'sunset' && (
        <pointLight
          position={[-20, 10, 5]}
          color="#ff7e4d"
          intensity={2.5}
          distance={60}
        />
      )}
    </>
  );
};

export default Lighting;

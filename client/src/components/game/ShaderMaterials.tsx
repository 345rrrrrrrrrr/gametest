import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { extend, useThree } from '@react-three/fiber';
import { useShaders } from '@/hooks/useShaders';
import { ShaderMaterial } from 'three';

// Define shader materials for special effects
const ShaderMaterials = () => {
  const { scene } = useThree();
  const { particleShader, glowShader, waterShader, skyShader } = useShaders();
  
  // Create the shader materials
  const materials = useMemo(() => {
    // Create particle shader material
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#58a5f0') },
        uTexture: { value: null },
        uSize: { value: 0.5 }
      },
      vertexShader: particleShader.vertex,
      fragmentShader: particleShader.fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Create glow shader material
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#58a5f0') },
        uStrength: { value: 1.0 },
        uRadius: { value: 0.5 }
      },
      vertexShader: glowShader.vertex,
      fragmentShader: glowShader.fragment,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending
    });
    
    // Create water shader material
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#0088FF') },
        uColor2: { value: new THREE.Color('#0044AA') },
        uWaveHeight: { value: 0.2 },
        uWaveFrequency: { value: 5.0 },
        uWaveSpeed: { value: 1.0 }
      },
      vertexShader: waterShader.vertex,
      fragmentShader: waterShader.fragment,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Create sky shader material
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTopColor: { value: new THREE.Color('#001133') },
        uBottomColor: { value: new THREE.Color('#3388FF') },
        uSunPosition: { value: new THREE.Vector3(0, 1, 0) },
        uSunColor: { value: new THREE.Color('#FFDD99') },
        uSunSize: { value: 0.1 }
      },
      vertexShader: skyShader.vertex,
      fragmentShader: skyShader.fragment,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    return {
      particle: particleMaterial,
      glow: glowMaterial,
      water: waterMaterial,
      sky: skyMaterial
    };
  }, [particleShader, glowShader, waterShader, skyShader]);
  
  // Make materials available throughout the app
  useEffect(() => {
    // Extend to make materials available in JSX
    extend({ 
      ParticleMaterial: materials.particle,
      GlowMaterial: materials.glow,
      WaterMaterial: materials.water,
      SkyMaterial: materials.sky
    });
    
    // Add materials to scene's userData for access outside this component
    scene.userData.shaderMaterials = materials;
    
    // Cleanup
    return () => {
      delete scene.userData.shaderMaterials;
    };
  }, [scene, materials]);
  
  // Update shader uniforms
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Update time uniform for all shader materials
    materials.particle.uniforms.uTime.value = time;
    materials.glow.uniforms.uTime.value = time;
    materials.water.uniforms.uTime.value = time;
    materials.sky.uniforms.uTime.value = time;
    
    // Update sun position for sky
    const sunPosition = new THREE.Vector3(
      Math.sin(time * 0.05) * 10,
      Math.abs(Math.cos(time * 0.05) * 10),
      0
    );
    materials.sky.uniforms.uSunPosition.value = sunPosition.normalize();
  });
  
  return null; // This component doesn't render anything
};

export default ShaderMaterials;

// Missing import
import { useFrame } from '@react-three/fiber';

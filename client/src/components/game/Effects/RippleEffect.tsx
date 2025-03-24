import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RippleShader } from '../../../shaders/RippleShader';

interface RippleEffectProps {
  position: [number, number, number];
  color?: string;
  size?: number;
  duration?: number;
  speed?: number;
  intensity?: number;
}

export const RippleEffect = ({
  position,
  color = '#4b80ff',
  size = 5,
  duration = 2,
  speed = 1,
  intensity = 1
}: RippleEffectProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const startTime = useRef<number>(Date.now());
  const active = useRef<boolean>(true);
  
  // Create custom shader material
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value = new THREE.Color(color);
      materialRef.current.uniforms.uIntensity.value = intensity;
      materialRef.current.uniforms.uSpeed.value = speed;
    }
  }, [color, intensity, speed]);
  
  // Animation
  useFrame(() => {
    if (!materialRef.current || !active.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    
    // Update shader uniforms
    materialRef.current.uniforms.uTime.value = elapsed;
    materialRef.current.uniforms.uProgress.value = progress;
    
    // Opacity fades out towards the end
    materialRef.current.uniforms.uOpacity.value = Math.max(0, 1 - progress * 1.2);
    
    // Deactivate when done
    if (progress >= 1) {
      active.current = false;
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]} // Align with ground plane
    >
      <planeGeometry args={[size, size, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uProgress: { value: 0 },
          uOpacity: { value: 1 },
          uIntensity: { value: intensity },
          uSpeed: { value: speed }
        }}
        vertexShader={RippleShader.vertexShader}
        fragmentShader={RippleShader.fragmentShader}
        transparent={true}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

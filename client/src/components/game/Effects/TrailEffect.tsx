import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrailEffectProps {
  object: THREE.Object3D;
  color?: THREE.Color;
  length?: number;
  width?: number;
  fadeTime?: number;
}

export const TrailEffect = ({
  object,
  color = new THREE.Color(0x3498db),
  length = 20,
  width = 0.5,
  fadeTime = a0.5
}: TrailEffectProps) => {
  const trailRef = useRef<THREE.Line>(null);
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const timesRef = useRef<number[]>([]);
  
  // Material for the trail
  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: color,
      opacity: 0.8,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);
  
  // Initialize the trail
  useEffect(() => {
    // Initial points (all at the object's current position)
    const initialPos = object.position.clone();
    pointsRef.current = Array(length).fill(0).map(() => initialPos.clone());
    timesRef.current = Array(length).fill(Date.now());
  }, [object, length]);
  
  // Update the trail
  useFrame(() => {
    if (!trailRef.current) return;
    
    const now = Date.now();
    
    // Add current position to front of the trail
    pointsRef.current.unshift(object.position.clone());
    pointsRef.current.pop(); // Remove last point
    
    // Update timestamps
    timesRef.current.unshift(now);
    timesRef.current.pop();
    
    // Create geometry from points
    const geometry = trailRef.current.geometry;
    const positions = geometry.attributes.position as THREE.BufferAttribute;
    
    // Apply age-based opacity and position
    for (let i = 0; i < pointsRef.current.length; i++) {
      const point = pointsRef.current[i];
      const age = (now - timesRef.current[i]) / 1000;
      const opacity = Math.max(0, 1 - (age / fadeTime));
      
      // Update position
      positions.setXYZ(i, point.x, point.y, point.z);
      
      // Adjust width based on age (thinner as it gets older)
      if (i < pointsRef.current.length - 1) {
        const widthScale = 1 - (i / pointsRef.current.length);
        const scaledWidth = width * widthScale * opacity;
      }
    }
    
    // Update material opacity based on object velocity
    if (object.userData.velocity) {
      const speed = object.userData.velocity.length();
      const minSpeed = 2; // Minimum speed for trail to be visible
      const maxSpeed = 10; // Speed at which trail reaches full opacity
      const speedRatio = Math.min((speed - minSpeed) / (maxSpeed - minSpeed), 1);
      trailRef.current.material.opacity = 0.8 * Math.max(0, speedRatio);
    }
    
    // Mark geometry for update
    positions.needsUpdate = true;
  });
  
  return (
    <line ref={trailRef}>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          count={length}
          array={new Float32Array(length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </line>
  );
};

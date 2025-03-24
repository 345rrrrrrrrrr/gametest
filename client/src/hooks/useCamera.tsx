import * as THREE from 'three';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useSettingsState } from '@/lib/stores/useSettingsState';
import { CAMERA_FOLLOW_DAMPING, CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE } from '@/lib/constants';
import { smoothDampVector3 } from '@/lib/utils/math';

export const useCamera = () => {
  const { camera } = useThree();
  const { balls, activeBallIndex } = usePlayerState();
  const { settings } = useSettingsState();
  
  // Camera settings
  const [distance, setDistance] = useState(20);
  const [rotation, setRotation] = useState({ x: 0, y: Math.PI / 6 }); // x: horizontal, y: vertical
  const targetPosition = useRef(new THREE.Vector3(0, 5, 0));
  const currentVelocity = useRef(new THREE.Vector3());
  
  // Default camera position
  const defaultPosition = useRef(new THREE.Vector3(0, 10, 20));
  const defaultTarget = useRef(new THREE.Vector3(0, 0, 0));
  
  // Set initial camera position
  useEffect(() => {
    if (camera) {
      camera.position.copy(defaultPosition.current);
      camera.lookAt(defaultTarget.current);
    }
  }, [camera]);
  
  // Update target position based on active ball
  const updateCameraTarget = useCallback((delta: number) => {
    if (!camera) return;
    
    // Get the active ball or use a default position
    const target = activeBallIndex >= 0 && balls[activeBallIndex]
      ? balls[activeBallIndex].position.clone()
      : defaultTarget.current;
    
    // Add some offset for better view
    target.y += 2;
    
    // Smooth camera movement using damping
    targetPosition.current = smoothDampVector3(
      targetPosition.current,
      target,
      currentVelocity.current,
      CAMERA_FOLLOW_DAMPING,
      Infinity,
      delta
    );
    
    // Update camera position based on distance and rotation
    const offset = new THREE.Vector3(
      Math.sin(rotation.x) * Math.cos(rotation.y) * distance,
      Math.sin(rotation.y) * distance,
      Math.cos(rotation.x) * Math.cos(rotation.y) * distance
    );
    
    const cameraPosition = new THREE.Vector3().addVectors(targetPosition.current, offset);
    camera.position.copy(cameraPosition);
    
    // Look at target
    camera.lookAt(targetPosition.current);
  }, [camera, balls, activeBallIndex]);
  
  // Apply camera shake if enabled
  const cameraShake = useRef({
    active: false,
    intensity: 0,
    duration: 0,
    elapsed: 0,
    originalPosition: new THREE.Vector3()
  });
  
  useFrame((state, delta) => {
    // Handle camera shake
    if (cameraShake.current.active && settings.cameraShake) {
      const camera = state.camera;
      
      // Store original position on first frame
      if (cameraShake.current.elapsed === 0) {
        cameraShake.current.originalPosition.copy(camera.position);
      }
      
      // Apply shake
      const intensity = cameraShake.current.intensity * 
                      (1 - cameraShake.current.elapsed / cameraShake.current.duration);
      
      camera.position.x = cameraShake.current.originalPosition.x + 
                          (Math.random() - 0.5) * intensity;
      camera.position.y = cameraShake.current.originalPosition.y + 
                          (Math.random() - 0.5) * intensity;
      camera.position.z = cameraShake.current.originalPosition.z + 
                          (Math.random() - 0.5) * intensity;
      
      // Update elapsed time
      cameraShake.current.elapsed += delta;
      
      // End shake if duration exceeded
      if (cameraShake.current.elapsed >= cameraShake.current.duration) {
        camera.position.copy(cameraShake.current.originalPosition);
        cameraShake.current.active = false;
        cameraShake.current.elapsed = 0;
      }
    }
  });
  
  // Camera rotation method
  const rotateCamera = useCallback((deltaX: number, deltaY: number) => {
    // Apply mouse sensitivity from settings
    const sensitivity = settings.mouseSensitivity;
    deltaX *= sensitivity;
    deltaY *= sensitivity;
    
    // Apply inversion if enabled
    if (settings.invertX) deltaX = -deltaX;
    if (settings.invertY) deltaY = -deltaY;
    
    setRotation(prev => {
      // Calculate new rotation
      let newX = prev.x + deltaX;
      let newY = prev.y + deltaY;
      
      // Clamp vertical rotation to prevent flipping
      newY = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, newY));
      
      return { x: newX, y: newY };
    });
  }, [settings.mouseSensitivity, settings.invertX, settings.invertY]);
  
  // Camera zoom method
  const zoomCamera = useCallback((delta: number) => {
    setDistance(prev => {
      const newDistance = prev - delta * 5;
      return Math.max(CAMERA_MIN_DISTANCE, Math.min(CAMERA_MAX_DISTANCE, newDistance));
    });
  }, []);
  
  // Camera movement method (parallel to ground)
  const moveCamera = useCallback((movement: THREE.Vector3) => {
    if (!camera) return;
    
    // Create a normalized direction vector from camera
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    
    // Calculate right vector
    const right = new THREE.Vector3().crossVectors(
      new THREE.Vector3(0, 1, 0),
      direction
    ).normalize();
    
    // Apply movement
    const offset = new THREE.Vector3();
    offset.addScaledVector(direction, -movement.z);
    offset.addScaledVector(right, movement.x);
    
    // Update both camera and target
    targetPosition.current.add(offset);
  }, [camera]);
  
  // Reset camera to default position
  const resetCamera = useCallback(() => {
    setRotation({ x: 0, y: Math.PI / 6 });
    setDistance(20);
    targetPosition.current.copy(defaultTarget.current);
  }, []);
  
  // Trigger camera shake
  const shakeCamera = useCallback((intensity: number = 0.5, duration: number = 0.5) => {
    cameraShake.current = {
      active: true,
      intensity,
      duration,
      elapsed: 0,
      originalPosition: new THREE.Vector3()
    };
  }, []);
  
  return {
    cameraTarget: targetPosition.current,
    updateCameraTarget,
    rotateCamera,
    zoomCamera,
    moveCamera,
    resetCamera,
    shakeCamera
  };
};

export default useCamera;

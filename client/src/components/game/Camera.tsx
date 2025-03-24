import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { Controls } from '../../App';
import { usePhysics } from '../../lib/stores/usePhysics';
import { useSettings } from '../../lib/stores/useSettings';

const Camera = () => {
  const { camera } = useThree();
  const physics = usePhysics();
  const settings = useSettings();
  const [cameraMode, setCameraMode] = useState<'follow' | 'orbit' | 'static'>('follow');
  const [subscribeKeys, getKeys] = useKeyboardControls();
  
  // Target position and rotation
  const targetPosition = useRef(new THREE.Vector3(0, 5, 15));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const orbitAngle = useRef(0);
  const orbitHeight = useRef(5);
  const orbitDistance = useRef(15);
  
  // Camera movement dynamics
  const cameraDynamics = useRef({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    lookAt: new THREE.Vector3(),
    damping: 0.1
  });
  
  // Subscribe to camera toggle key
  useEffect(() => {
    return subscribeKeys(
      state => state.camera,
      (pressed) => {
        if (pressed) {
          // Cycle through camera modes
          setCameraMode(prevMode => {
            switch (prevMode) {
              case 'follow': return 'orbit';
              case 'orbit': return 'static';
              case 'static': return 'follow';
              default: return 'follow';
            }
          });
        }
      }
    );
  }, [subscribeKeys]);
  
  // Set up initial camera position and properties
  useEffect(() => {
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    
    // Adapt camera settings based on user settings
    if (settings.cameraSettings) {
      const { fov, near, far } = settings.cameraSettings;
      camera.fov = fov || 60;
      camera.near = near || 0.1;
      camera.far = far || 1000;
      camera.updateProjectionMatrix();
    }
  }, [camera, settings.cameraSettings]);
  
  // Update camera position and target based on game state
  useFrame((_, delta) => {
    const balls = physics.getBalls();
    const hasActiveBalls = balls.length > 0;
    
    // Default position if no active balls
    if (!hasActiveBalls) {
      targetPosition.current.set(0, 5, 15);
      targetLookAt.current.set(0, 0, 0);
    } else {
      // Find the most active ball to follow (the one with highest velocity)
      let primaryBall = balls[0];
      let maxEnergy = primaryBall.velocity.lengthSq() * primaryBall.mass;
      
      balls.forEach(ball => {
        const energy = ball.velocity.lengthSq() * ball.mass;
        if (energy > maxEnergy) {
          maxEnergy = energy;
          primaryBall = ball;
        }
      });
      
      // Get ball position and velocity
      const ballPos = primaryBall.position;
      const ballVel = primaryBall.velocity;
      
      // Handle different camera modes
      switch (cameraMode) {
        case 'follow':
          // Follow camera: positions behind the ball's movement direction
          if (ballVel.length() > 2) {
            // Calculate an offset position behind the ball based on its velocity
            const normalizedVel = ballVel.clone().normalize();
            const offsetDistance = 10 + primaryBall.radius * 2;
            
            targetPosition.current.copy(ballPos)
              .add(normalizedVel.clone().multiplyScalar(-offsetDistance)) // Move camera behind the ball
              .add(new THREE.Vector3(0, 5 + primaryBall.radius, 0)); // Add height offset
              
            targetLookAt.current.copy(ballPos)
              .add(normalizedVel.clone().multiplyScalar(5)); // Look ahead of the ball
          } else {
            // If ball is not moving much, position camera at a fixed offset
            targetPosition.current.set(
              ballPos.x, 
              ballPos.y + 5 + primaryBall.radius, 
              ballPos.z + 10
            );
            targetLookAt.current.copy(ballPos);
          }
          break;
          
        case 'orbit':
          // Orbit camera: circles around the ball
          orbitAngle.current += delta * 0.5; // Orbit speed
          
          const orbitX = ballPos.x + Math.sin(orbitAngle.current) * orbitDistance.current;
          const orbitZ = ballPos.z + Math.cos(orbitAngle.current) * orbitDistance.current;
          
          targetPosition.current.set(
            orbitX,
            ballPos.y + orbitHeight.current,
            orbitZ
          );
          targetLookAt.current.copy(ballPos);
          break;
          
        case 'static':
          // Static camera: fixed position with wide view
          targetPosition.current.set(0, 20, 30);
          targetLookAt.current.set(0, 0, 0);
          break;
      }
    }
    
    // Apply smoothing to camera movement using dynamics simulation
    cameraDynamics.current.velocity.subVectors(
      targetPosition.current,
      camera.position
    ).multiplyScalar(1 - Math.pow(cameraDynamics.current.damping, delta));
    
    camera.position.add(cameraDynamics.current.velocity.clone().multiplyScalar(delta * 5));
    
    // Smooth look-at transition
    cameraDynamics.current.lookAt.lerp(targetLookAt.current, 1 - Math.pow(cameraDynamics.current.damping, delta * 5));
    camera.lookAt(cameraDynamics.current.lookAt);
    
    // Apply camera shake if enabled and there are strong impacts
    if (settings.cameraShake && physics.getImpactForce() > 10) {
      const shake = physics.getImpactForce() * 0.01;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      camera.position.z += (Math.random() - 0.5) * shake;
    }
  });
  
  return null; // This component doesn't render anything, just controls the camera
};

export default Camera;

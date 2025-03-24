import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useGameState } from '@/lib/stores/useGameState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useCamera } from '@/hooks/useCamera';
import { Controls, GamePhase } from '@/types/game';

export const useGameControls = () => {
  const { camera } = useThree();
  const { phase, setPhase } = useGameState();
  const { createBall, holdBall, releaseBall } = usePlayerState();
  const { addScore } = useScoreState();
  const { rotateCamera, moveCamera, resetCamera } = useCamera();
  
  // Keyboard state
  const keyState = useRef<Record<string, boolean>>({});
  
  // Mouse state for ball throwing
  const mouseState = useRef({
    isDragging: false,
    startPosition: new THREE.Vector2(0, 0),
    currentPosition: new THREE.Vector2(0, 0),
    dragVector: new THREE.Vector2(0, 0)
  });
  
  // Raycaster for mouse interaction
  const raycaster = useRef(new THREE.Raycaster());
  const mousePosition = useRef(new THREE.Vector2());
  
  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    keyState.current[event.code] = true;
    
    // Handle special key presses
    if (event.code === 'Escape' && phase === GamePhase.PLAYING) {
      setPhase(GamePhase.PAUSED);
    }
    
    // Space to create a new ball
    if (event.code === 'Space' && phase === GamePhase.PLAYING) {
      // Create ball at random position
      const randomX = (Math.random() - 0.5) * 20;
      const randomZ = (Math.random() - 0.5) * 20;
      const position = new THREE.Vector3(randomX, 10, randomZ);
      
      createBall(position);
      addScore(10); // Small score for creating a ball
    }
    
    // Reset camera with 'R' key
    if (event.code === 'KeyR' && phase === GamePhase.PLAYING) {
      resetCamera();
    }
  }, [phase, setPhase, createBall, addScore, resetCamera]);
  
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    keyState.current[event.code] = false;
  }, []);
  
  // Handle mouse movement
  const handleMouseMove = useCallback((event: MouseEvent) => {
    // Update mouse position for raycasting
    mousePosition.current.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );
    
    // Update drag state
    if (mouseState.current.isDragging) {
      mouseState.current.currentPosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      
      mouseState.current.dragVector.subVectors(
        mouseState.current.startPosition,
        mouseState.current.currentPosition
      );
    }
    
    // Handle right mouse button drag for camera rotation
    if (event.buttons === 2 && phase === GamePhase.PLAYING) {
      const movementX = event.movementX;
      const movementY = event.movementY;
      
      rotateCamera(-movementX * 0.003, -movementY * 0.003);
    }
  }, [phase, rotateCamera]);
  
  // Handle mouse down
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (phase !== GamePhase.PLAYING) return;
    
    // Left mouse button
    if (event.button === 0) {
      // Start dragging
      mouseState.current.isDragging = true;
      mouseState.current.startPosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      
      // Raycast to see if we're clicking on anything
      raycaster.current.setFromCamera(mousePosition.current, camera);
      
      // Process raycast logic...
    }
  }, [phase, camera]);
  
  // Handle mouse up
  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (phase !== GamePhase.PLAYING) return;
    
    // Left mouse button
    if (event.button === 0 && mouseState.current.isDragging) {
      // End dragging
      mouseState.current.isDragging = false;
      
      // Calculate release vector
      mouseState.current.currentPosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      
      const releaseVector = new THREE.Vector2().subVectors(
        mouseState.current.startPosition,
        mouseState.current.currentPosition
      );
      
      // If we were holding a ball, release it with an impulse
      releaseBall();
    }
  }, [phase, releaseBall]);
  
  // Handle keyboard input each frame
  const handleKeyboardInput = useCallback((controls: Record<Controls, boolean>, delta: number) => {
    if (phase !== GamePhase.PLAYING) return;
    
    // Camera movement
    const moveSpeed = 20 * delta;
    const movementVector = new THREE.Vector3(0, 0, 0);
    
    if (controls[Controls.FORWARD]) {
      movementVector.z -= moveSpeed;
    }
    
    if (controls[Controls.BACKWARD]) {
      movementVector.z += moveSpeed;
    }
    
    if (controls[Controls.LEFT]) {
      movementVector.x -= moveSpeed;
    }
    
    if (controls[Controls.RIGHT]) {
      movementVector.x += moveSpeed;
    }
    
    // Apply camera movement
    if (movementVector.lengthSq() > 0) {
      moveCamera(movementVector);
    }
    
    // Camera rotation
    if (controls[Controls.CAMERA_LEFT]) {
      rotateCamera(0.03, 0);
    }
    
    if (controls[Controls.CAMERA_RIGHT]) {
      rotateCamera(-0.03, 0);
    }
    
    if (controls[Controls.CAMERA_UP]) {
      rotateCamera(0, 0.03);
    }
    
    if (controls[Controls.CAMERA_DOWN]) {
      rotateCamera(0, -0.03);
    }
  }, [phase, moveCamera, rotateCamera]);
  
  // Set up event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  return {
    handleKeyboardInput,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    keyState: keyState.current,
  };
};

export default useGameControls;

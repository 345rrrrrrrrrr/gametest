import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useGameState } from '@/lib/stores/useGameState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';
import { useGameControls } from '@/hooks/useGameControls';
import { Controls, GamePhase } from '@/types/game';

const PlayerControls = () => {
  const { camera } = useThree();
  const gamePhase = useGameState(state => state.phase);
  const setPhase = useGameState(state => state.setPhase);
  const balls = usePlayerState(state => state.balls);
  const activeBallIndex = usePlayerState(state => state.activeBallIndex);
  const setActiveBallIndex = usePlayerState(state => state.setActiveBallIndex);
  const heldBall = usePlayerState(state => state.heldBall);
  const holdBall = usePlayerState(state => state.holdBall);
  const releaseBall = usePlayerState(state => state.releaseBall);
  const applyImpulseToBall = usePhysicsState(state => state.applyImpulse);
  
  // Get keyboard controls
  const [subscribe, getState] = useKeyboardControls<Controls>();
  
  // Mouse state
  const mouse = useRef({
    isDragging: false,
    startPosition: new THREE.Vector2(),
    currentPosition: new THREE.Vector2(),
    dragVector: new THREE.Vector2(),
    dragDistance: 0
  });
  
  // Raycasting for ball selection
  const raycaster = useRef(new THREE.Raycaster());
  const rayDirection = useRef(new THREE.Vector3());
  const mousePlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const intersectionPoint = useRef(new THREE.Vector3());
  
  // Custom controls hook for input handling
  const { handleKeyboardInput, handleMouseMove, handleMouseDown, handleMouseUp } = useGameControls();
  
  // Keyboard controls subscription
  useEffect(() => {
    const unsubscribePause = subscribe(
      state => state[Controls.PAUSE],
      pressed => {
        if (pressed && gamePhase === GamePhase.PLAYING) {
          setPhase(GamePhase.PAUSED);
        }
      }
    );
    
    return () => {
      unsubscribePause();
    };
  }, [subscribe, gamePhase, setPhase]);
  
  // Mouse event handlers
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (gamePhase !== GamePhase.PLAYING) return;
      
      // Record start position
      mouse.current.startPosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      mouse.current.isDragging = true;
      
      // Cast ray to check if we're clicking on a ball
      raycaster.current.setFromCamera(mouse.current.startPosition, camera);
      
      const selectedBalls = balls.map((ball, index) => ({ 
        ball, 
        index,
        distance: raycaster.current.ray.origin.distanceTo(ball.position)
      }))
      .filter(item => {
        const dist = item.ball.position.clone().sub(raycaster.current.ray.origin).length();
        const dir = item.ball.position.clone().sub(raycaster.current.ray.origin).normalize();
        return dir.dot(raycaster.current.ray.direction) > 0.9 && dist < 50;
      })
      .sort((a, b) => a.distance - b.distance);
      
      if (selectedBalls.length > 0) {
        const selected = selectedBalls[0];
        setActiveBallIndex(selected.index);
        holdBall(selected.ball.id);
        
        // Project ball onto mouse plane for dragging
        mousePlane.current.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          selected.ball.position
        );
      }
      
      handleMouseDown(event);
    };
    
    const handlePointerMove = (event: MouseEvent) => {
      if (gamePhase !== GamePhase.PLAYING) return;
      
      // Update current position
      mouse.current.currentPosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      
      if (mouse.current.isDragging && heldBall) {
        // Calculate drag vector
        mouse.current.dragVector.subVectors(
          mouse.current.startPosition,
          mouse.current.currentPosition
        );
        
        mouse.current.dragDistance = mouse.current.dragVector.length() * 20;
        
        // Update raycaster with current mouse position
        raycaster.current.setFromCamera(mouse.current.currentPosition, camera);
        
        // Find intersection with the mouse plane
        if (raycaster.current.ray.intersectPlane(mousePlane.current, intersectionPoint.current)) {
          // Update held ball position
          const ball = balls[activeBallIndex];
          if (ball) {
            const newPosition = new THREE.Vector3(
              intersectionPoint.current.x,
              ball.position.y, // Keep Y position constant
              intersectionPoint.current.z
            );
            
            // Update ball position
            holdBall(ball.id, newPosition);
          }
        }
      }
      
      handleMouseMove(event);
    };
    
    const handlePointerUp = (event: MouseEvent) => {
      if (gamePhase !== GamePhase.PLAYING || !mouse.current.isDragging) return;
      
      if (heldBall) {
        // Calculate launch direction and strength based on drag
        const strength = Math.min(mouse.current.dragDistance, 50);
        
        if (strength > 2) { // Minimum drag threshold
          // Direction is opposite to drag
          const direction = new THREE.Vector3(
            -mouse.current.dragVector.x,
            0.5, // Add some upward component
            -mouse.current.dragVector.y
          ).normalize();
          
          // Apply impulse to the ball
          const impulse = direction.multiplyScalar(strength * 0.5);
          
          // Release the ball with the calculated impulse
          releaseBall();
          
          // Add slight delay for visual clarity
          setTimeout(() => {
            const ball = balls[activeBallIndex];
            if (ball) {
              applyImpulseToBall(ball.id, impulse);
            }
          }, 50);
        } else {
          // Just release the ball without impulse if drag was too small
          releaseBall();
        }
      }
      
      // Reset drag state
      mouse.current.isDragging = false;
      mouse.current.dragDistance = 0;
      mouse.current.dragVector.set(0, 0);
      
      handleMouseUp(event);
    };
    
    // Add event listeners
    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    
    return () => {
      // Remove event listeners on cleanup
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [
    camera, 
    gamePhase, 
    balls, 
    activeBallIndex, 
    heldBall, 
    setActiveBallIndex, 
    holdBall, 
    releaseBall, 
    applyImpulseToBall,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  ]);
  
  // Process keyboard input each frame
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    const controls = getState();
    handleKeyboardInput(controls, delta);
  });
  
  // Debug visualizer for dragging (in development mode)
  useFrame((state) => {
    if (gamePhase !== GamePhase.PLAYING || !mouse.current.isDragging || !heldBall) return;
    
    // You could add debug visualization here if needed
  });
  
  return null; // This component doesn't render anything visually
};

export default PlayerControls;

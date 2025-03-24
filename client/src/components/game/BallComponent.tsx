import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Trail, useGLTF } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';
import { useGameState } from '@/lib/stores/useGameState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { GamePhase } from '@/types/game';
import { Ball } from '@/types/entities';

interface BallComponentProps {
  ball: Ball;
  index: number;
}

const BallComponent = ({ ball, index }: BallComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const previousPosition = useRef(new THREE.Vector3());
  const addForce = usePhysicsState(state => state.addForce);
  const applyImpulse = usePhysicsState(state => state.applyImpulse);
  const gamePhase = useGameState(state => state.phase);
  const currentLevel = useLevelState(state => state.currentLevel);
  
  // Determine if ball should have a trail based on speed
  const [hasTrail, setHasTrail] = useState(false);
  const [trailWidth, setTrailWidth] = useState(0.1);
  const [trailColor, setTrailColor] = useState('#58a5f0');
  
  // Ball texture and material
  const ballMaterial = useMemo(() => {
    const material = new MeshStandardMaterial({
      color: ball.color,
      metalness: 0.3,
      roughness: 0.4,
      envMapIntensity: 0.5,
    });
    return material;
  }, [ball.color]);
  
  // Initialize ball physics
  useEffect(() => {
    if (meshRef.current) {
      previousPosition.current.copy(ball.position);
    }
  }, [ball.position]);
  
  // Update ball physics and position
  useFrame((state, delta) => {
    if (!meshRef.current || gamePhase !== GamePhase.PLAYING) return;
    
    // Update mesh position and rotation from physics state
    meshRef.current.position.copy(ball.position);
    
    // Calculate ball rotation based on movement direction
    if (!ball.isHeld) {
      const movementDirection = new THREE.Vector3().subVectors(
        ball.position,
        previousPosition.current
      );
      
      if (movementDirection.length() > 0.001) {
        // Create rotation perpendicular to movement
        const axis = new THREE.Vector3(-movementDirection.z, 0, movementDirection.x).normalize();
        const angle = movementDirection.length() * 10;
        meshRef.current.rotateOnAxis(axis, angle);
      }
    }
    
    // Update trail based on velocity
    const speed = ball.velocity.length();
    setHasTrail(speed > 5);
    setTrailWidth(Math.min(0.2, 0.05 + speed * 0.01));
    
    // Change trail color based on speed
    if (speed > 15) {
      setTrailColor('#ff4500'); // Fast - red/orange
    } else if (speed > 8) {
      setTrailColor('#ffbb00'); // Medium - yellow
    } else {
      setTrailColor('#58a5f0'); // Normal - blue
    }
    
    // Apply level-specific forces
    if (currentLevel?.settings) {
      // Apply gravity
      addForce(
        ball.id,
        new THREE.Vector3(0, -currentLevel.settings.gravity * ball.mass, 0)
      );
      
      // Apply wind if active
      if (currentLevel.settings.windStrength > 0) {
        const windForce = currentLevel.settings.windDirection
          .clone()
          .normalize()
          .multiplyScalar(currentLevel.settings.windStrength * delta);
        
        addForce(ball.id, windForce);
      }
    }
    
    // Store position for next frame
    previousPosition.current.copy(ball.position);
  });
  
  // Calculate shadow size based on ball distance from ground
  const shadowSize = useMemo(() => {
    const height = ball.position.y;
    const baseShadowSize = ball.radius * 2;
    const shadowScale = Math.max(0.1, 1 - (height / 10));
    return baseShadowSize * shadowScale;
  }, [ball.position.y, ball.radius]);
  
  // Handle ball glow (if ball has power-up)
  const hasPowerUp = ball.activePowerUps.length > 0;
  
  return (
    <>
      {/* Ball mesh */}
      <mesh 
        ref={meshRef} 
        position={ball.position.toArray()} 
        castShadow 
        receiveShadow
      >
        <sphereGeometry args={[ball.radius, 32, 32]} />
        <primitive object={ballMaterial} attach="material" />
        
        {/* Optional glow effect for powered-up balls */}
        {hasPowerUp && (
          <mesh scale={[1.05, 1.05, 1.05]}>
            <sphereGeometry args={[ball.radius, 32, 32]} />
            <meshBasicMaterial 
              color={ball.activePowerUps[0].type === 'speed_boost' ? '#ffbb00' : '#58ffa0'} 
              transparent={true} 
              opacity={0.3}
            />
          </mesh>
        )}
      </mesh>
      
      {/* Ball trail */}
      {hasTrail && (
        <Trail 
          width={trailWidth} 
          length={10} 
          color={trailColor}
          attenuation={(width) => width}
          target={meshRef}
        />
      )}
      
      {/* Ball shadow */}
      <mesh 
        position={[ball.position.x, 0.01, ball.position.z]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[shadowSize, shadowSize]} />
        <meshBasicMaterial 
          color="black" 
          transparent={true} 
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};

export default BallComponent;

// Missing import
import { useState } from 'react';

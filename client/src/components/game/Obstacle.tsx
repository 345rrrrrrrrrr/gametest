import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePhysics } from '../../lib/stores/usePhysics';

interface ObstacleProps {
  id: string;
  type: 'box' | 'cylinder' | 'sphere' | 'ramp' | 'platform' | 'wall' | 'bumper' | 'spinner';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  material?: 'wood' | 'metal' | 'rubber' | 'glass' | 'bouncy';
  movable?: boolean;
  mass?: number;
  interactable?: boolean;
  behavior?: 'static' | 'kinematic' | 'moving' | 'rotating' | 'swinging';
  breakable?: boolean;
  health?: number;
  pathPoints?: Array<[number, number, number]>;
  speed?: number;
}

const Obstacle = forwardRef(({
  id,
  type,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  color = '#f5f5f5',
  material = 'wood',
  movable = false,
  mass = 0,
  interactable = false,
  behavior = 'static',
  breakable = false,
  health = 100,
  pathPoints = [],
  speed = 1
}: ObstacleProps, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const physics = usePhysics();
  const [currentHealth, setCurrentHealth] = useState(health);
  const [pathIndex, setPathIndex] = useState(0);
  const [obstacleScale, setObstacleScale] = useState(0);
  
  // Load appropriate texture based on material
  const textureName = material === 'wood' ? '/textures/wood.jpg' :
                      material === 'rubber' ? '/textures/asphalt.png' : 
                      '/textures/asphalt.png';
  
  const textureProps = useTexture({
    map: textureName,
  });
  
  // Tracking original position for movement patterns
  const originalPosition = useRef(new THREE.Vector3(...position));
  const startTime = useRef(Date.now());
  
  // Expose methods for external control
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      return meshRef.current ? meshRef.current.position : new THREE.Vector3();
    },
    applyDamage: (amount: number) => {
      if (breakable) {
        setCurrentHealth(prev => {
          const newHealth = prev - amount;
          if (newHealth <= 0) {
            // Break the obstacle
            physics.removeObstacle(id);
            setObstacleScale(0); // Animate scale to 0 for visual disappearance
          }
          return newHealth;
        });
      }
    },
    getType: () => type,
    getMass: () => mass,
    getHealth: () => currentHealth,
    activate: () => {
      if (interactable) {
        // Trigger obstacle-specific interaction
        switch (type) {
          case 'bumper':
            // Activate bumper effect
            if (groupRef.current) {
              const scale = { value: 1 };
              // Simple scaling animation to simulate activation
              const scaleUp = () => {
                scale.value = 1.2;
                setTimeout(() => {
                  scale.value = 1;
                }, 100);
              };
              scaleUp();
            }
            break;
          case 'spinner':
            // Increase rotation speed temporarily
            break;
          default:
            break;
        }
      }
    }
  }));
  
  // Register with physics system
  useEffect(() => {
    physics.addObstacle({
      id,
      type,
      object: meshRef.current!,
      position: new THREE.Vector3(...position),
      rotation: new THREE.Euler(...rotation),
      scale: new THREE.Vector3(...scale),
      mass: movable ? mass : 0,
      material,
      behavior,
      breakable
    });
    
    // Entrance animation
    setTimeout(() => {
      setObstacleScale(1);
    }, 100);
    
    return () => {
      physics.removeObstacle(id);
    };
  }, []);
  
  // Handle movement patterns and physics updates
  useFrame((_, delta) => {
    if (!meshRef.current || !groupRef.current) return;
    
    if (behavior === 'rotating' && groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
    }
    
    if (behavior === 'moving' && pathPoints.length > 1) {
      const currentPoint = new THREE.Vector3(...pathPoints[pathIndex]);
      const currentPos = meshRef.current.position;
      
      // Move towards the next point
      const direction = new THREE.Vector3().subVectors(currentPoint, currentPos);
      const distance = direction.length();
      
      if (distance < 0.1) {
        // Reached target point, move to next one
        setPathIndex((prevIndex) => (prevIndex + 1) % pathPoints.length);
      } else {
        // Move towards target
        direction.normalize();
        const moveStep = delta * speed;
        const newPos = currentPos.clone().add(direction.multiplyScalar(moveStep));
        meshRef.current.position.copy(newPos);
        physics.updateObstaclePosition(id, newPos);
      }
    }
    
    if (behavior === 'swinging') {
      const time = (Date.now() - startTime.current) * 0.001 * speed;
      const swingRadius = 2;
      
      // Create a swinging motion
      const xOffset = Math.sin(time) * swingRadius;
      const newPosition = originalPosition.current.clone().add(new THREE.Vector3(xOffset, 0, 0));
      
      meshRef.current.position.copy(newPosition);
      physics.updateObstaclePosition(id, newPosition);
    }
  });
  
  // Get geometry based on type
  const getGeometry = () => {
    switch (type) {
      case 'box':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'ramp':
        // A wedge shape for ramps
        return (
          <mesh>
            <boxGeometry args={[1, 0.5, 1]} />
            <meshStandardMaterial {...textureProps} color={color} />
          </mesh>
        );
      case 'platform':
        // A flat platform
        return <boxGeometry args={[3, 0.2, 3]} />;
      case 'wall':
        // A tall wall
        return <boxGeometry args={[0.5, 3, 3]} />;
      case 'bumper':
        // A cylindrical bumper
        return <cylinderGeometry args={[0.7, 0.7, 0.5, 32]} />;
      case 'spinner':
        // A horizontal spinner with arms
        return (
          <group>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.2, 16]} />
              <meshStandardMaterial {...textureProps} color={color} />
            </mesh>
            <mesh position={[1, 0, 0]} scale={[2, 0.2, 0.2]}>
              <boxGeometry />
              <meshStandardMaterial {...textureProps} color={color} />
            </mesh>
            <mesh position={[-1, 0, 0]} scale={[2, 0.2, 0.2]}>
              <boxGeometry />
              <meshStandardMaterial {...textureProps} color={color} />
            </mesh>
            <mesh position={[0, 0, 1]} scale={[0.2, 0.2, 2]}>
              <boxGeometry />
              <meshStandardMaterial {...textureProps} color={color} />
            </mesh>
            <mesh position={[0, 0, -1]} scale={[0.2, 0.2, 2]}>
              <boxGeometry />
              <meshStandardMaterial {...textureProps} color={color} />
            </mesh>
          </group>
        );
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };
  
  // Material properties based on material type
  const getMaterialProps = () => {
    switch (material) {
      case 'metal':
        return { roughness: 0.1, metalness: 0.9 };
      case 'glass':
        return { roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.7 };
      case 'rubber':
        return { roughness: 0.9, metalness: 0 };
      case 'bouncy':
        return { roughness: 0.7, metalness: 0.1, color: '#ff3b69' };
      case 'wood':
      default:
        return { roughness: 0.7, metalness: 0.1 };
    }
  };
  
  return (
    <group 
      ref={groupRef}
      position={position}
      rotation={rotation as any}
      scale={[obstacleScale, obstacleScale, obstacleScale]}
    >
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        scale={scale}
      >
        {getGeometry()}
        <meshStandardMaterial
          {...textureProps}
          color={color}
          {...getMaterialProps()}
        />
      </mesh>
      
      {/* Health indicator for breakable objects */}
      {breakable && (
        <group position={[0, 1.5, 0]}>
          <mesh scale={[1, 0.1, 0.1]}>
            <boxGeometry />
            <meshBasicMaterial color="#444" />
          </mesh>
          <mesh 
            position={[-(0.5 - (currentHealth / health) * 0.5), 0, 0]} 
            scale={[(currentHealth / health), 0.08, 0.08]}
          >
            <boxGeometry />
            <meshBasicMaterial color={currentHealth > 50 ? '#2ecc71' : '#e74c3c'} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default Obstacle;

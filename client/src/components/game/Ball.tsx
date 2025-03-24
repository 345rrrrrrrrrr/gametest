import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePhysics } from '../../lib/stores/usePhysics';

interface BallProps {
  id: string;
  position: [number, number, number];
  radius: number;
  mass: number;
  velocity?: [number, number, number];
  color?: string;
  metallic?: boolean;
  emissive?: boolean;
  bounciness?: number;
  friction?: number;
  special?: string;
}

const Ball = forwardRef(({
  id,
  position,
  radius = 1,
  mass = 1,
  velocity = [0, 0, 0],
  color = '#3498db',
  metallic = false,
  emissive = false,
  bounciness = 0.8,
  friction = 0.1,
  special
}: BallProps, ref) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ballGroupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const physics = usePhysics();
  
  // Ball textures
  const textureProps = useTexture({
    map: '/textures/asphalt.png',
  });
  
  // Randomize initial rotation
  const [rotation] = useState(() => [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ]);
  
  // Initial state for animation
  const [scale, setScale] = useState(0);
  
  // Expose functions to parent component via ref
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      return meshRef.current ? meshRef.current.position : new THREE.Vector3();
    },
    getVelocity: () => {
      return physics.getBallVelocity(id);
    },
    applyForce: (force: THREE.Vector3) => {
      physics.applyForceToBall(id, force);
    },
    applyImpulse: (impulse: THREE.Vector3) => {
      physics.applyImpulseToBall(id, impulse);
    },
    getRadius: () => radius,
    setPosition: (newPosition: THREE.Vector3) => {
      if (meshRef.current) {
        meshRef.current.position.copy(newPosition);
      }
    }
  }));
  
  // Register ball with physics system
  useEffect(() => {
    physics.addBall({
      id,
      object: meshRef.current!,
      position: new THREE.Vector3(...position),
      velocity: new THREE.Vector3(...velocity),
      radius,
      mass,
      bounciness,
      friction,
      color: new THREE.Color(color),
      special
    });
    
    // Entrance animation
    setTimeout(() => {
      setScale(1);
    }, 100);
    
    return () => {
      physics.removeBall(id);
    };
  }, []);
  
  // Update ball position from physics system
  useFrame(() => {
    const ballData = physics.getBall(id);
    if (ballData && meshRef.current) {
      meshRef.current.position.copy(ballData.position);
      
      // Update ball rotation based on velocity
      if (ballGroupRef.current) {
        // Calculate rotation based on movement and surface contact
        const vel = ballData.velocity;
        const speed = vel.length();
        
        if (speed > 0.01) {
          // Rotational axis is perpendicular to velocity vector
          const rotationAxis = new THREE.Vector3(-vel.z, 0, vel.x).normalize();
          const rotationAmount = speed * 0.01;
          
          // Apply rotation to the ball
          ballGroupRef.current.rotateOnAxis(rotationAxis, rotationAmount);
        }
      }
      
      // Update material properties if special effects are active
      if (materialRef.current) {
        if (special === 'glowing') {
          materialRef.current.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        }
      }
    }
  });
  
  // Material props based on ball type
  const getMaterialProps = () => {
    const baseProps = {
      color,
      roughness: metallic ? 0.1 : 0.7,
      metalness: metallic ? 0.9 : 0.1,
      emissive: emissive ? color : '#000000',
      emissiveIntensity: emissive ? 0.5 : 0,
    };
    
    // Special ball types
    if (special === 'glowing') {
      return {
        ...baseProps,
        emissive: color,
        emissiveIntensity: 0.5,
      };
    }
    
    return baseProps;
  };
  
  return (
    <group ref={ballGroupRef} scale={[scale, scale, scale]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={position}
      >
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          {...textureProps}
          {...getMaterialProps()}
          envMapIntensity={metallic ? 1 : 0.2}
        />
      </mesh>
      
      {/* Add special effect visual elements */}
      {special === 'magnetic' && (
        <group position={position}>
          <mesh>
            <ringGeometry args={[radius * 1.2, radius * 1.4, 32]} />
            <meshBasicMaterial color="#4e6bf2" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      
      {special === 'explosive' && (
        <pointLight
          position={position}
          distance={radius * 5}
          intensity={0.8}
          color={color}
        />
      )}
    </group>
  );
});

export default Ball;

import { useRef, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { usePhysics } from '../../lib/stores/usePhysics';

interface TerrainSection {
  type: 'flat' | 'hills' | 'ramps' | 'water' | 'lava' | 'ice';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  color?: string;
  textureRepeat?: [number, number];
}

interface TerrainProps {
  terrainData: TerrainSection[];
}

const Terrain = ({ terrainData }: TerrainProps) => {
  const physics = usePhysics();
  const terrainRefs = useRef<THREE.Mesh[]>([]);
  
  // Load textures
  const grassTexture = useTexture('/textures/grass.png');
  const sandTexture = useTexture('/textures/sand.jpg');
  const asphaltTexture = useTexture('/textures/asphalt.png');
  
  // Setup texture repeat
  [grassTexture, sandTexture, asphaltTexture].forEach(texture => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  });
  
  // Register terrain with physics system
  useEffect(() => {
    terrainData.forEach((section, index) => {
      if (terrainRefs.current[index]) {
        physics.addTerrain({
          id: `terrain-${index}`,
          type: section.type,
          object: terrainRefs.current[index],
          position: new THREE.Vector3(...section.position),
          rotation: new THREE.Euler(...(section.rotation || [0, 0, 0])),
          scale: new THREE.Vector3(...section.scale)
        });
      }
    });
    
    return () => {
      terrainData.forEach((_, index) => {
        physics.removeTerrain(`terrain-${index}`);
      });
    };
  }, [terrainData]);
  
  // Helper to get appropriate texture for terrain type
  const getTextureForType = (type: string) => {
    switch (type) {
      case 'flat': return grassTexture;
      case 'hills': return grassTexture;
      case 'water': return sandTexture;
      case 'ice': return asphaltTexture;
      case 'lava': return asphaltTexture;
      default: return grassTexture;
    }
  };
  
  // Helper to get terrain color based on type
  const getColorForType = (type: string, providedColor?: string) => {
    if (providedColor) return providedColor;
    
    switch (type) {
      case 'flat': return '#4a9c2b';
      case 'hills': return '#3d8324';
      case 'water': return '#0088cc';
      case 'lava': return '#e74c3c';
      case 'ice': return '#a8d7e0';
      default: return '#4a9c2b';
    }
  };
  
  // Helper to generate geometry based on terrain type
  const getGeometryForType = (type: string) => {
    switch (type) {
      case 'hills':
        return (
          <meshStandardMaterial
            displacementScale={0.5}
            displacementBias={-0.25}
          >
            <planeGeometry args={[1, 1, 32, 32]} />
          </meshStandardMaterial>
        );
      case 'water':
        return <boxGeometry args={[1, 0.1, 1]} />;
      case 'flat':
      default:
        return <boxGeometry args={[1, 0.5, 1]} />;
    }
  };
  
  // Special material properties based on terrain type
  const getMaterialProps = (type: string) => {
    switch (type) {
      case 'water':
        return {
          transparent: true,
          opacity: 0.8,
          metalness: 0.1,
          roughness: 0.2,
        };
      case 'lava':
        return {
          emissive: '#ff5500',
          emissiveIntensity: 0.5,
          roughness: 0.7,
        };
      case 'ice':
        return {
          metalness: 0.3,
          roughness: 0.1,
        };
      default:
        return {
          roughness: 0.8,
          metalness: 0.1,
        };
    }
  };
  
  return (
    <group>
      {terrainData.map((section, index) => {
        // Set texture repeat based on scale
        const texture = getTextureForType(section.type);
        const repeat = section.textureRepeat || [
          section.scale[0] * 2,
          section.scale[2] * 2
        ];
        texture.repeat.set(repeat[0], repeat[1]);
        
        return (
          <mesh
            key={`terrain-${index}`}
            ref={el => {
              if (el) terrainRefs.current[index] = el;
            }}
            position={section.position}
            rotation={section.rotation || [0, 0, 0] as any}
            scale={section.scale}
            receiveShadow
            castShadow={section.type !== 'flat'}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              map={texture}
              color={getColorForType(section.type, section.color)}
              {...getMaterialProps(section.type)}
            />
          </mesh>
        );
      })}
      
      {/* Add water and lava animations/effects as needed */}
      {terrainData.filter(section => section.type === 'water').map((section, index) => (
        <mesh
          key={`water-surface-${index}`}
          position={[section.position[0], section.position[1] + 0.05, section.position[2]]}
          rotation={section.rotation || [0, 0, 0] as any}
          scale={[section.scale[0] * 0.99, 0.1, section.scale[2] * 0.99]}
        >
          <planeGeometry args={[1, 1, 8, 8]} />
          <meshStandardMaterial
            color="#2a97c2"
            transparent
            opacity={0.6}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
      ))}
      
      {/* Add lava glow */}
      {terrainData.filter(section => section.type === 'lava').map((section, index) => (
        <pointLight
          key={`lava-light-${index}`}
          position={[section.position[0], section.position[1] + 1, section.position[2]]}
          color="#ff5500"
          intensity={2}
          distance={section.scale[0] * 5}
        />
      ))}
    </group>
  );
};

export default Terrain;

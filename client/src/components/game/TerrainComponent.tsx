import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { TerrainType } from '@/types/game';
import { Terrain } from '@/types/entities';
import { usePhysicsState } from '@/lib/stores/usePhysicsState';

interface TerrainComponentProps {
  terrain: Terrain;
}

const TerrainComponent = ({ terrain }: TerrainComponentProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const updatePhysicsTerrainHeight = usePhysicsState(state => state.updateTerrainHeight);

  // Load appropriate texture based on terrain type
  const textureMap = {
    [TerrainType.FLAT]: '/textures/grass.png',
    [TerrainType.HILLS]: '/textures/grass.png',
    [TerrainType.SAND]: '/textures/sand.jpg',
    [TerrainType.WATER]: '/textures/grass.png', // Base texture, water is separate
    [TerrainType.ICE]: '/textures/asphalt.png', // Using asphalt as ice substitute
    [TerrainType.LAVA]: '/textures/asphalt.png', // Using asphalt as lava substitute
  };

  const terrainTexturePath = textureMap[terrain.type as keyof typeof textureMap] || '/textures/grass.png';
  const terrainTexture = useTexture(terrainTexturePath);
  
  // Configure texture
  useEffect(() => {
    terrainTexture.wrapS = terrainTexture.wrapT = THREE.RepeatWrapping;
    terrainTexture.repeat.set(terrain.width / 5, terrain.depth / 5);
  }, [terrainTexture, terrain.width, terrain.depth]);

  // Create terrain geometry
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      terrain.width,
      terrain.depth,
      terrain.segments,
      terrain.segments
    );
    
    // Apply heightmap if terrain is hills
    if (terrain.type === TerrainType.HILLS) {
      const vertices = geometry.attributes.position.array;
      
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        
        // Perlin-like noise for height
        const height = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2;
        vertices[i + 1] = height;
      }
      
      // Update normals for lighting
      geometry.computeVertexNormals();
      
      // Update physics terrain heights
      updatePhysicsTerrainHeight(terrain.id, (x, z) => {
        return Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2;
      });
    }
    
    return geometry;
  }, [terrain.width, terrain.depth, terrain.segments, terrain.type, updatePhysicsTerrainHeight, terrain.id]);

  // Water animation for water terrain
  useFrame((state, delta) => {
    if (terrain.type === TerrainType.WATER && waterRef.current) {
      // Animate water ripples
      const time = state.clock.elapsedTime;
      const waterMaterial = waterRef.current.material as THREE.MeshStandardMaterial;
      
      if (waterMaterial.userData.offset === undefined) {
        waterMaterial.userData.offset = 0;
      }
      
      waterMaterial.userData.offset += delta * 0.1;
      waterMaterial.displacementScale = 0.3 + Math.sin(time * 0.4) * 0.1;
    }
  });

  // Create terrain material based on type
  const terrainMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      side: THREE.FrontSide,
      roughness: 0.9,
      metalness: 0.1,
    });
    
    // Adjust material properties based on terrain type
    switch (terrain.type) {
      case TerrainType.ICE:
        material.roughness = 0.2;
        material.color.set('#AADDFF');
        break;
      case TerrainType.LAVA:
        material.roughness = 0.7;
        material.emissive.set('#FF3300');
        material.emissiveIntensity = 0.3;
        material.color.set('#FF5500');
        break;
      default:
        break;
    }
    
    return material;
  }, [terrainTexture, terrain.type]);

  // Special material for water
  const waterMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0088FF',
      transparent: true,
      opacity: 0.7,
      roughness: 0.2,
      metalness: 0.8,
    });
  }, []);

  return (
    <group position={terrain.position.toArray()}>
      {/* Base terrain */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <primitive object={terrainGeometry} attach="geometry" />
        <primitive object={terrainMaterial} attach="material" />
      </mesh>
      
      {/* Water layer if terrain is water */}
      {terrain.type === TerrainType.WATER && (
        <mesh
          ref={waterRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.5, 0]}
        >
          <planeGeometry args={[terrain.width, terrain.depth, 32, 32]} />
          <primitive object={waterMaterial} attach="material" />
        </mesh>
      )}
      
      {/* Lava glow effect if terrain is lava */}
      {terrain.type === TerrainType.LAVA && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, 0]}
        >
          <planeGeometry args={[terrain.width, terrain.depth]} />
          <meshBasicMaterial 
            color="#FF7700" 
            transparent={true} 
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
};

export default TerrainComponent;

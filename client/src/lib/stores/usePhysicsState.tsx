import { create } from 'zustand';
import * as THREE from 'three';

interface PhysicsState {
  // Physics state by entity ID
  positions: Record<string, THREE.Vector3>;
  velocities: Record<string, THREE.Vector3>;
  forces: Record<string, THREE.Vector3>;
  collisions: Record<string, { isColliding: boolean, collidingWith: string[] }>;
  terrainHeightFunctions: Record<string, (x: number, z: number) => number>;
  
  // Actions
  setPositions: (positions: Record<string, THREE.Vector3>) => void;
  setVelocities: (velocities: Record<string, THREE.Vector3>) => void;
  setForces: (forces: Record<string, THREE.Vector3>) => void;
  setCollisions: (collisions: Record<string, { isColliding: boolean, collidingWith: string[] }>) => void;
  
  addForce: (id: string, force: THREE.Vector3) => void;
  applyImpulse: (id: string, impulse: THREE.Vector3) => void;
  clearForces: (id: string) => void;
  
  updateTerrainHeight: (id: string, heightFunction: (x: number, z: number) => number) => void;
  getTerrainHeightAt: (id: string, x: number, z: number) => number;
  
  resetPhysics: () => void;
}

export const usePhysicsState = create<PhysicsState>((set, get) => ({
  // Initial state
  positions: {},
  velocities: {},
  forces: {},
  collisions: {},
  terrainHeightFunctions: {},
  
  // Setter functions
  setPositions: (newPositions) => set((state) => {
    // Merge new positions with existing ones
    const positions = { ...state.positions };
    
    // Update each position
    Object.keys(newPositions).forEach(id => {
      positions[id] = newPositions[id].clone();
    });
    
    return { positions };
  }),
  
  setVelocities: (newVelocities) => set((state) => {
    // Merge new velocities with existing ones
    const velocities = { ...state.velocities };
    
    // Update each velocity
    Object.keys(newVelocities).forEach(id => {
      velocities[id] = newVelocities[id].clone();
    });
    
    return { velocities };
  }),
  
  setForces: (newForces) => set((state) => {
    // Merge new forces with existing ones
    const forces = { ...state.forces };
    
    // Update each force
    Object.keys(newForces).forEach(id => {
      forces[id] = newForces[id].clone();
    });
    
    return { forces };
  }),
  
  setCollisions: (newCollisions) => set((state) => {
    // Merge new collisions with existing ones
    const collisions = { ...state.collisions };
    
    // Update each collision
    Object.keys(newCollisions).forEach(id => {
      collisions[id] = { ...newCollisions[id] };
    });
    
    return { collisions };
  }),
  
  // Force functions
  addForce: (id, force) => set((state) => {
    // Get existing force or create a new zero vector
    const existingForce = state.forces[id] || new THREE.Vector3(0, 0, 0);
    
    // Add the new force
    const updatedForce = existingForce.clone().add(force);
    
    // Update forces state
    return {
      forces: {
        ...state.forces,
        [id]: updatedForce
      }
    };
  }),
  
  applyImpulse: (id, impulse) => set((state) => {
    // Get existing velocity or create a new zero vector
    const existingVelocity = state.velocities[id] || new THREE.Vector3(0, 0, 0);
    
    // Add impulse to velocity (assuming mass of 1 for simplicity)
    const updatedVelocity = existingVelocity.clone().add(impulse);
    
    // Update velocities state
    return {
      velocities: {
        ...state.velocities,
        [id]: updatedVelocity
      }
    };
  }),
  
  clearForces: (id) => set((state) => {
    // Create a copy of the forces state
    const forces = { ...state.forces };
    
    // Set force to zero vector
    forces[id] = new THREE.Vector3(0, 0, 0);
    
    return { forces };
  }),
  
  // Terrain height functions
  updateTerrainHeight: (id, heightFunction) => set((state) => {
    return {
      terrainHeightFunctions: {
        ...state.terrainHeightFunctions,
        [id]: heightFunction
      }
    };
  }),
  
  getTerrainHeightAt: (id, x, z) => {
    const heightFunction = get().terrainHeightFunctions[id];
    if (heightFunction) {
      return heightFunction(x, z);
    }
    return 0; // Default to flat terrain
  },
  
  // Reset all physics state
  resetPhysics: () => set(() => ({
    positions: {},
    velocities: {},
    forces: {},
    collisions: {},
    terrainHeightFunctions: {}
  }))
}));

export default usePhysicsState;

import { create } from 'zustand';
import * as THREE from 'three';

export type EffectType = 
  | 'explosion' 
  | 'trail' 
  | 'spark' 
  | 'smoke' 
  | 'water' 
  | 'fire' 
  | 'portal';

interface Effect {
  id: string;
  type: EffectType;
  position: THREE.Vector3;
  color: string;
  scale: number;
  duration: number; // seconds, -1 for persistent
  elapsed: number;
  maxParticles: number;
}

interface EffectsState {
  // State
  effects: Effect[];
  
  // Actions
  addEffect: (effect: Effect) => void;
  removeEffect: (id: string) => void;
  updateEffect: (id: string, updates: Partial<Effect>) => void;
  clearEffects: () => void;
}

export const useEffectsState = create<EffectsState>((set) => ({
  // Initial state
  effects: [],
  
  // Add a new effect
  addEffect: (effect) => set((state) => ({
    effects: [...state.effects, effect]
  })),
  
  // Remove an effect by ID
  removeEffect: (id) => set((state) => ({
    effects: state.effects.filter(effect => effect.id !== id)
  })),
  
  // Update an existing effect
  updateEffect: (id, updates) => set((state) => ({
    effects: state.effects.map(effect => 
      effect.id === id 
        ? { ...effect, ...updates } 
        : effect
    )
  })),
  
  // Clear all effects
  clearEffects: () => set(() => ({
    effects: []
  }))
}));

export default useEffectsState;

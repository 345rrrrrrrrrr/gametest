import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffectsState } from '@/lib/stores/useEffectsState';
import { useGameState } from '@/lib/stores/useGameState';
import { GamePhase } from '@/types/game';
import { createParticleSystem, emitParticles } from '@/lib/effects/particleSystem';

const EffectsSystem = () => {
  const { scene } = useThree();
  const gamePhase = useGameState(state => state.phase);
  const effects = useEffectsState(state => state.effects);
  const addEffect = useEffectsState(state => state.addEffect);
  const removeEffect = useEffectsState(state => state.removeEffect);
  const updateEffect = useEffectsState(state => state.updateEffect);
  
  // Particle systems
  const particleSystems = useRef<{[key: string]: THREE.Points}>({});
  
  // Create particle systems for each effect
  useEffect(() => {
    effects.forEach(effect => {
      if (!particleSystems.current[effect.id]) {
        const system = createParticleSystem(effect.type, effect.maxParticles);
        particleSystems.current[effect.id] = system;
        scene.add(system);
        
        console.log(`Created particle system: ${effect.id}, type: ${effect.type}`);
      }
    });
    
    // Cleanup removed effects
    Object.keys(particleSystems.current).forEach(id => {
      if (!effects.find(e => e.id === id)) {
        scene.remove(particleSystems.current[id]);
        delete particleSystems.current[id];
      }
    });
  }, [effects, scene]);
  
  // Handle camera shake
  const cameraShakeRef = useRef({
    active: false,
    intensity: 0,
    duration: 0,
    elapsed: 0,
    originalPosition: new THREE.Vector3()
  });
  
  // Public methods for other components to trigger effects
  useEffect(() => {
    // Expose methods globally for other components to use
    (window as any).gameEffects = {
      spawnExplosion: (position: THREE.Vector3, color: string = '#FF5500', scale: number = 1) => {
        const id = `explosion_${Date.now()}`;
        addEffect({
          id,
          type: 'explosion',
          position: position.clone(),
          color,
          scale,
          duration: 2,
          elapsed: 0,
          maxParticles: 100
        });
        
        // Add camera shake
        cameraShakeRef.current = {
          active: true,
          intensity: 0.5 * scale,
          duration: 0.5,
          elapsed: 0,
          originalPosition: new THREE.Vector3()
        };
        
        return id;
      },
      
      spawnTrail: (position: THREE.Vector3, color: string = '#58a5f0') => {
        const id = `trail_${Date.now()}`;
        addEffect({
          id,
          type: 'trail',
          position: position.clone(),
          color,
          scale: 1,
          duration: -1, // Persistent until removed
          elapsed: 0,
          maxParticles: 50
        });
        return id;
      },
      
      updateTrail: (id: string, position: THREE.Vector3) => {
        updateEffect(id, { position: position.clone() });
      },
      
      removeTrail: (id: string) => {
        removeEffect(id);
      },
      
      spawnSpark: (position: THREE.Vector3, color: string = '#FFDD00') => {
        const id = `spark_${Date.now()}`;
        addEffect({
          id,
          type: 'spark',
          position: position.clone(),
          color,
          scale: 1,
          duration: 0.5,
          elapsed: 0,
          maxParticles: 20
        });
        return id;
      }
    };
    
    return () => {
      delete (window as any).gameEffects;
    };
  }, [addEffect, removeEffect, updateEffect]);
  
  // Update effects each frame
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Update existing effects
    effects.forEach(effect => {
      if (particleSystems.current[effect.id]) {
        // Emit particles based on effect type
        emitParticles(
          particleSystems.current[effect.id],
          effect.type,
          effect.position,
          effect.color,
          delta,
          effect.scale
        );
        
        // Update effect duration
        if (effect.duration > 0) {
          const elapsed = effect.elapsed + delta;
          updateEffect(effect.id, { elapsed });
          
          // Remove effect if duration exceeded
          if (elapsed >= effect.duration) {
            removeEffect(effect.id);
          }
        }
      }
    });
    
    // Handle camera shake
    if (cameraShakeRef.current.active) {
      const camera = state.camera;
      
      // Store original position on first frame
      if (cameraShakeRef.current.elapsed === 0) {
        cameraShakeRef.current.originalPosition.copy(camera.position);
      }
      
      // Apply shake
      const intensity = cameraShakeRef.current.intensity * 
                      (1 - cameraShakeRef.current.elapsed / cameraShakeRef.current.duration);
      
      camera.position.x = cameraShakeRef.current.originalPosition.x + 
                          (Math.random() - 0.5) * intensity;
      camera.position.y = cameraShakeRef.current.originalPosition.y + 
                          (Math.random() - 0.5) * intensity;
      camera.position.z = cameraShakeRef.current.originalPosition.z + 
                          (Math.random() - 0.5) * intensity;
      
      // Update elapsed time
      cameraShakeRef.current.elapsed += delta;
      
      // End shake if duration exceeded
      if (cameraShakeRef.current.elapsed >= cameraShakeRef.current.duration) {
        camera.position.copy(cameraShakeRef.current.originalPosition);
        cameraShakeRef.current.active = false;
        cameraShakeRef.current.elapsed = 0;
      }
    }
  });
  
  return null; // This component doesn't render anything
};

export default EffectsSystem;

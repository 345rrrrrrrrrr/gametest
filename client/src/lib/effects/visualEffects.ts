import * as THREE from 'three';
import { useEffectsState, EffectType } from '../stores/useEffectsState';
import { useSettingsState } from '../stores/useSettingsState';

/**
 * Create an explosion effect at a position
 */
export function createExplosion(
  position: THREE.Vector3,
  color: string = '#FF5500',
  scale: number = 1.0
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.5;
      break;
    case 'medium':
      particleMultiplier = 1;
      break;
    case 'high':
      particleMultiplier = 2;
      break;
  }
  
  const id = `explosion_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'explosion',
    position: position.clone(),
    color,
    scale,
    duration: 2,
    elapsed: 0,
    maxParticles: Math.floor(100 * particleMultiplier)
  });
  
  return id;
}

/**
 * Create a trail effect that follows an object
 */
export function createTrail(
  position: THREE.Vector3,
  color: string = '#58a5f0'
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.3;
      break;
    case 'medium':
      particleMultiplier = 0.7;
      break;
    case 'high':
      particleMultiplier = 1;
      break;
  }
  
  const id = `trail_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'trail',
    position: position.clone(),
    color,
    scale: 1,
    duration: -1, // Persistent until removed
    elapsed: 0,
    maxParticles: Math.floor(50 * particleMultiplier)
  });
  
  return id;
}

/**
 * Update a trail's position
 */
export function updateTrail(id: string, position: THREE.Vector3): void {
  const { updateEffect } = useEffectsState.getState();
  
  updateEffect(id, {
    position: position.clone()
  });
}

/**
 * Remove a trail effect
 */
export function removeTrail(id: string): void {
  const { removeEffect } = useEffectsState.getState();
  removeEffect(id);
}

/**
 * Create a spark effect (for pickups, achievements, etc.)
 */
export function createSpark(
  position: THREE.Vector3,
  color: string = '#FFDD00'
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.5;
      break;
    case 'medium':
      particleMultiplier = 1;
      break;
    case 'high':
      particleMultiplier = 1.5;
      break;
  }
  
  const id = `spark_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'spark',
    position: position.clone(),
    color,
    scale: 1,
    duration: 0.8,
    elapsed: 0,
    maxParticles: Math.floor(20 * particleMultiplier)
  });
  
  return id;
}

/**
 * Create a portal effect
 */
export function createPortalEffect(
  position: THREE.Vector3,
  color: string = '#8844FF'
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.5;
      break;
    case 'medium':
      particleMultiplier = 1;
      break;
    case 'high':
      particleMultiplier = 1.5;
      break;
  }
  
  const id = `portal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'portal',
    position: position.clone(),
    color,
    scale: 1.5,
    duration: -1, // Persistent until removed
    elapsed: 0,
    maxParticles: Math.floor(30 * particleMultiplier)
  });
  
  return id;
}

/**
 * Create a water splash effect
 */
export function createWaterSplash(
  position: THREE.Vector3,
  scale: number = 1.0
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.5;
      break;
    case 'medium':
      particleMultiplier = 1;
      break;
    case 'high':
      particleMultiplier = 1.5;
      break;
  }
  
  const id = `water_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'water',
    position: position.clone(),
    color: '#00AAFF',
    scale,
    duration: 1.2,
    elapsed: 0,
    maxParticles: Math.floor(30 * particleMultiplier)
  });
  
  return id;
}

/**
 * Create fire effect
 */
export function createFireEffect(
  position: THREE.Vector3,
  scale: number = 1.0,
  duration: number = -1 // Persistent by default
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.3;
      break;
    case 'medium':
      particleMultiplier = 0.7;
      break;
    case 'high':
      particleMultiplier = 1;
      break;
  }
  
  const id = `fire_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'fire',
    position: position.clone(),
    color: '#FF5500',
    scale,
    duration,
    elapsed: 0,
    maxParticles: Math.floor(40 * particleMultiplier)
  });
  
  return id;
}

/**
 * Create a smoke effect
 */
export function createSmokeEffect(
  position: THREE.Vector3,
  scale: number = 1.0,
  duration: number = 3.0
): string {
  const { addEffect } = useEffectsState.getState();
  const { settings } = useSettingsState.getState();
  
  // Scale particle count based on settings quality
  let particleMultiplier = 1;
  switch (settings.effectsQuality) {
    case 'low':
      particleMultiplier = 0.3;
      break;
    case 'medium':
      particleMultiplier = 0.7;
      break;
    case 'high':
      particleMultiplier = 1;
      break;
  }
  
  const id = `smoke_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  addEffect({
    id,
    type: 'smoke',
    position: position.clone(),
    color: '#777777',
    scale,
    duration,
    elapsed: 0,
    maxParticles: Math.floor(25 * particleMultiplier)
  });
  
  return id;
}

/**
 * Clear all effects
 */
export function clearAllEffects(): void {
  const { clearEffects } = useEffectsState.getState();
  clearEffects();
}

/**
 * Utility function to create an effect based on type
 */
export function createEffect(
  type: EffectType,
  position: THREE.Vector3,
  color: string,
  scale: number = 1.0,
  duration: number = -1
): string {
  switch (type) {
    case 'explosion':
      return createExplosion(position, color, scale);
    case 'trail':
      return createTrail(position, color);
    case 'spark':
      return createSpark(position, color);
    case 'water':
      return createWaterSplash(position, scale);
    case 'fire':
      return createFireEffect(position, scale, duration);
    case 'smoke':
      return createSmokeEffect(position, scale, duration);
    case 'portal':
      return createPortalEffect(position, color);
    default:
      return createSpark(position, color);
  }
}

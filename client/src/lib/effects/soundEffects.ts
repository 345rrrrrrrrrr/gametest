// Sound effect manager for the game
import { useAudio } from '../stores/useAudio';
import { SOUND_PATHS } from '../constants';

/**
 * Interface for a sound effect with variations
 */
interface SoundEffect {
  name: string;
  basePath: string;
  variants?: number; // Number of variations (e.g., hit1.mp3, hit2.mp3, etc.)
  volume: number;
  randomPitch?: boolean; // Whether to randomize pitch
  playbackRate?: number; // Base playback rate
  maxSimultaneous?: number; // Maximum number of simultaneous instances
}

/**
 * Sound effect types with their configurations
 */
const SOUND_EFFECTS: Record<string, SoundEffect> = {
  hit: {
    name: 'hit',
    basePath: SOUND_PATHS.hit,
    volume: 0.3,
    randomPitch: true,
    playbackRate: 1.0,
    maxSimultaneous: 3
  },
  success: {
    name: 'success',
    basePath: SOUND_PATHS.success,
    volume: 0.5,
    randomPitch: false
  },
  explosion: {
    name: 'explosion',
    basePath: SOUND_PATHS.hit, // Reuse hit sound for now
    volume: 0.6,
    randomPitch: true,
    playbackRate: 0.8,
    maxSimultaneous: 2
  },
  powerup: {
    name: 'powerup',
    basePath: SOUND_PATHS.success, // Reuse success sound for now
    volume: 0.4,
    randomPitch: true,
    playbackRate: 1.2
  }
};

// Track currently playing sound instances
const activeSounds: Record<string, HTMLAudioElement[]> = {};

/**
 * Play a sound effect with optional parameters
 */
export function playSoundEffect(
  effectName: string,
  volume?: number,
  pitch?: number
): void {
  const { isMuted } = useAudio.getState();
  
  // Don't play if muted
  if (isMuted) return;
  
  // Get effect configuration
  const effect = SOUND_EFFECTS[effectName];
  if (!effect) {
    console.warn(`Sound effect "${effectName}" not found`);
    return;
  }
  
  // Check if we've reached the maximum simultaneous instances
  if (effect.maxSimultaneous) {
    if (!activeSounds[effectName]) {
      activeSounds[effectName] = [];
    } else if (activeSounds[effectName].length >= effect.maxSimultaneous) {
      // If max reached, either ignore or reuse oldest instance
      const oldestSound = activeSounds[effectName].shift();
      if (oldestSound) {
        oldestSound.pause();
        oldestSound.currentTime = 0;
      }
    }
  }
  
  // Create a new audio element
  const audio = new Audio(effect.basePath);
  
  // Set volume with optional override
  audio.volume = (volume !== undefined ? volume : effect.volume);
  
  // Set playback rate (pitch)
  if (effect.randomPitch && pitch === undefined) {
    // Random pitch variation
    const baseRate = effect.playbackRate || 1.0;
    audio.playbackRate = baseRate + (Math.random() - 0.5) * 0.4;
  } else if (pitch !== undefined) {
    audio.playbackRate = pitch;
  } else if (effect.playbackRate) {
    audio.playbackRate = effect.playbackRate;
  }
  
  // Track the sound if needed
  if (effect.maxSimultaneous) {
    activeSounds[effectName].push(audio);
    
    // Remove from tracking when finished
    audio.onended = () => {
      const index = activeSounds[effectName].indexOf(audio);
      if (index !== -1) {
        activeSounds[effectName].splice(index, 1);
      }
    };
  }
  
  // Play the sound
  audio.play().catch(error => {
    console.warn(`Error playing sound "${effectName}":`, error);
  });
}

/**
 * Play a collision sound with intensity based on impact velocity
 */
export function playCollisionSound(velocity: number): void {
  // Scale volume based on impact velocity
  const impactForce = Math.min(1.0, velocity / 10);
  const volume = 0.2 + impactForce * 0.4;
  
  // Scale pitch based on impact (higher velocity = higher pitch)
  const pitch = 0.8 + impactForce * 0.4;
  
  playSoundEffect('hit', volume, pitch);
}

/**
 * Play an explosion sound with size scaling
 */
export function playExplosionSound(size: number = 1.0): void {
  // Scale volume based on explosion size
  const volume = Math.min(1.0, 0.4 + size * 0.3);
  
  // Larger explosions have lower pitch
  const pitch = 1.0 - size * 0.2;
  
  playSoundEffect('explosion', volume, pitch);
}

/**
 * Play a power-up collection sound
 */
export function playPowerUpSound(powerUpType: string): void {
  // Different power-ups could have different pitches
  let pitch = 1.0;
  
  switch (powerUpType) {
    case 'speed_boost':
      pitch = 1.2;
      break;
    case 'gravity_flip':
      pitch = 0.8;
      break;
    case 'ball_multiplier':
      pitch = 1.1;
      break;
    case 'explosive':
      pitch = 0.9;
      break;
    default:
      pitch = 1.0;
  }
  
  playSoundEffect('powerup', 0.4, pitch);
}

/**
 * Play a success sound (level complete, achievement, etc.)
 */
export function playSuccessSound(): void {
  playSoundEffect('success');
}

/**
 * Stop all active sounds
 */
export function stopAllSounds(): void {
  Object.values(activeSounds).forEach(soundArray => {
    soundArray.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    soundArray.length = 0;
  });
}

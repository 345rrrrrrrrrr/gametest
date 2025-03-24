import * as THREE from 'three';
import { usePhysics } from '../stores/usePhysics';
import { useScore } from '../stores/useScore';
import { useAudio } from '../stores/useAudio';

// Power-up types
export type PowerUpType = 
  'speed' | 
  'jump' | 
  'gravity' | 
  'size' | 
  'multiplier' | 
  'magnetism' | 
  'explosion' | 
  'time' | 
  'shield' | 
  'multiball';

// Power-up data 
export interface PowerUpData {
  id: string;
  type: PowerUpType;
  position: THREE.Vector3;
  duration: number;
  strength: number;
  color: THREE.Color;
  active: boolean;
  collected: boolean;
  collectedTime?: number;
  effectRadius?: number;
  pulseSpeed?: number;
  rotationSpeed?: number;
}

// Power-up effect properties
interface PowerUpEffectDefinition {
  name: string;
  description: string;
  defaultDuration: number;
  defaultStrength: number;
  color: string;
  applyEffect: (powerUp: PowerUpData, physics: any, score: any) => void;
  removeEffect?: (powerUp: PowerUpData, physics: any) => void;
  particleColor?: string;
  particleCount?: number;
  soundEffect?: string;
}

// Power-up system class for managing all power-ups
export class PowerUpSystem {
  private powerUps: Map<string, PowerUpData> = new Map();
  private activeEffects: Map<string, { endTime: number; powerUp: PowerUpData }> = new Map();
  private lastUpdateTime: number = 0;
  
  // Power-up definitions
  private powerUpDefinitions: Record<PowerUpType, PowerUpEffectDefinition> = {
    'speed': {
      name: 'Speed Boost',
      description: 'Increases ball velocity',
      defaultDuration: 10,
      defaultStrength: 1.5,
      color: '#2ecc71', // Green
      applyEffect: (powerUp, physics) => {
        physics.applyGlobalForce('speedBoost', powerUp.strength, powerUp.duration);
      },
      particleColor: '#4bec38',
      particleCount: 15,
      soundEffect: 'speed_boost'
    },
    'jump': {
      name: 'Super Jump',
      description: 'Increases jump height',
      defaultDuration: 8,
      defaultStrength: 2,
      color: '#3498db', // Blue
      applyEffect: (powerUp, physics) => {
        physics.applyGlobalForce('jumpBoost', powerUp.strength, powerUp.duration);
      },
      particleColor: '#3498db',
      particleCount: 20,
      soundEffect: 'jump_boost'
    },
    'gravity': {
      name: 'Gravity Shift',
      description: 'Reduces gravity',
      defaultDuration: 12,
      defaultStrength: 0.5,
      color: '#9b59b6', // Purple
      applyEffect: (powerUp, physics) => {
        physics.modifyGravity(powerUp.strength, powerUp.duration);
      },
      removeEffect: (powerUp, physics) => {
        physics.modifyGravity(1, 0.1); // Reset to normal
      },
      particleColor: '#9b59b6',
      particleCount: 25,
      soundEffect: 'gravity_shift'
    },
    'size': {
      name: 'Size Change',
      description: 'Changes ball size',
      defaultDuration: 10,
      defaultStrength: 1.5, // >1 = larger, <1 = smaller
      color: '#f1c40f', // Yellow
      applyEffect: (powerUp, physics) => {
        physics.modifyBallSize(powerUp.strength, powerUp.duration);
      },
      particleColor: '#f1c40f',
      particleCount: 15,
      soundEffect: 'size_change'
    },
    'multiplier': {
      name: 'Score Multiplier',
      description: 'Increases score multiplier',
      defaultDuration: 15,
      defaultStrength: 2,
      color: '#e74c3c', // Red
      applyEffect: (powerUp, physics, score) => {
        score.setMultiplier(powerUp.strength, powerUp.duration);
      },
      particleColor: '#e74c3c',
      particleCount: 30,
      soundEffect: 'multiplier'
    },
    'magnetism': {
      name: 'Magnetism',
      description: 'Attracts nearby objects',
      defaultDuration: 10,
      defaultStrength: 1,
      color: '#1abc9c', // Turquoise
      applyEffect: (powerUp, physics) => {
        physics.enableMagnetism(powerUp.duration);
      },
      particleColor: '#1abc9c',
      particleCount: 20,
      soundEffect: 'magnetism'
    },
    'explosion': {
      name: 'Explosion',
      description: 'Creates an explosion force',
      defaultDuration: 0, // Instant effect
      defaultStrength: 5,
      color: '#e67e22', // Orange
      applyEffect: (powerUp, physics) => {
        physics.triggerExplosion(
          powerUp.position,
          powerUp.strength * 5,  // Explosion radius
          powerUp.strength * 10  // Force magnitude
        );
      },
      particleColor: '#ff5500',
      particleCount: 50,
      soundEffect: 'explosion'
    },
    'time': {
      name: 'Time Warp',
      description: 'Slows down time',
      defaultDuration: 8,
      defaultStrength: 0.5, // <1 = slow, >1 = fast
      color: '#34495e', // Dark Blue
      applyEffect: (powerUp, physics) => {
        physics.modifyTimeScale(powerUp.strength, powerUp.duration);
      },
      removeEffect: (powerUp, physics) => {
        physics.modifyTimeScale(1, 0.1); // Reset to normal
      },
      particleColor: '#34495e',
      particleCount: 35,
      soundEffect: 'time_warp'
    },
    'shield': {
      name: 'Shield',
      description: 'Protects from damage',
      defaultDuration: 15,
      defaultStrength: 1,
      color: '#3498db', // Blue
      applyEffect: (powerUp, physics) => {
        physics.enableShield(powerUp.duration);
      },
      particleColor: '#3498db',
      particleCount: 25,
      soundEffect: 'shield'
    },
    'multiball': {
      name: 'Multiball',
      description: 'Creates additional balls',
      defaultDuration: 0, // Instant effect
      defaultStrength: 3, // Number of balls
      color: '#16a085', // Green
      applyEffect: (powerUp, physics) => {
        const ballCount = Math.floor(powerUp.strength);
        for (let i = 0; i < ballCount; i++) {
          const angle = (Math.PI * 2 * i) / ballCount;
          physics.createBall({
            position: [
              powerUp.position.x + Math.cos(angle) * 1,
              powerUp.position.y + 1,
              powerUp.position.z + Math.sin(angle) * 1
            ],
            radius: 0.8,
            velocity: [Math.cos(angle) * 5, 8, Math.sin(angle) * 5],
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
          });
        }
      },
      particleColor: '#16a085',
      particleCount: 20,
      soundEffect: 'multiball'
    }
  };
  
  constructor() {
    this.lastUpdateTime = Date.now();
  }
  
  // Create a new power-up
  public createPowerUp(
    type: PowerUpType,
    position: THREE.Vector3,
    options: Partial<PowerUpData> = {}
  ): string {
    const definition = this.powerUpDefinitions[type];
    if (!definition) {
      console.error(`Unknown power-up type: ${type}`);
      return '';
    }
    
    // Generate ID if not provided
    const id = options.id || `powerup-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create power-up data
    const powerUp: PowerUpData = {
      id,
      type,
      position: position.clone(),
      duration: options.duration || definition.defaultDuration,
      strength: options.strength || definition.defaultStrength,
      color: new THREE.Color(options.color || definition.color),
      active: options.active !== undefined ? options.active : true,
      collected: false,
      effectRadius: options.effectRadius || 1,
      pulseSpeed: options.pulseSpeed || 2,
      rotationSpeed: options.rotationSpeed || 1
    };
    
    // Add to power-ups collection
    this.powerUps.set(id, powerUp);
    
    return id;
  }
  
  // Get a power-up by ID
  public getPowerUp(id: string): PowerUpData | undefined {
    return this.powerUps.get(id);
  }
  
  // Get all active power-ups
  public getAllPowerUps(): PowerUpData[] {
    return Array.from(this.powerUps.values()).filter(p => p.active && !p.collected);
  }
  
  // Collect a power-up
  public collectPowerUp(id: string): void {
    const powerUp = this.powerUps.get(id);
    if (!powerUp || powerUp.collected || !powerUp.active) return;
    
    // Mark as collected
    powerUp.collected = true;
    powerUp.collectedTime = Date.now();
    
    // Get system instances
    const physics = usePhysics.getState();
    const score = useScore.getState();
    const audio = useAudio.getState();
    
    // Apply effect
    const definition = this.powerUpDefinitions[powerUp.type];
    definition.applyEffect(powerUp, physics, score);
    
    // Play sound effect
    audio.playSuccess();
    
    // Add score
    score.addPoints(100, 'powerup');
    
    // Add to active effects if it has duration
    if (powerUp.duration > 0) {
      const endTime = Date.now() + powerUp.duration * 1000;
      this.activeEffects.set(id, { endTime, powerUp });
    }
    
    // Create particle effect at collection point
    if (definition.particleCount && physics.onParticleEmit) {
      const particleColor = new THREE.Color(definition.particleColor || definition.color);
      const particleCount = definition.particleCount;
      
      for (let i = 0; i < particleCount; i++) {
        // Create burst effect
        const angle = Math.random() * Math.PI * 2;
        const upwardAngle = Math.random() * Math.PI / 2;
        const speed = 2 + Math.random() * 3;
        
        const velocity = new THREE.Vector3(
          Math.sin(angle) * Math.cos(upwardAngle) * speed,
          Math.sin(upwardAngle) * speed,
          Math.cos(angle) * Math.cos(upwardAngle) * speed
        );
        
        // Emit particles
        physics.onParticleEmit(
          powerUp.position.clone(),
          velocity,
          particleColor,
          0.2 + Math.random() * 0.3,
          0.5 + Math.random() * 1
        );
      }
    }
  }
  
  // Update all power-ups and active effects
  public update(deltaTime: number): void {
    const now = Date.now();
    
    // Process active effects
    const expiredEffects: string[] = [];
    
    this.activeEffects.forEach((effectData, id) => {
      if (now >= effectData.endTime) {
        // Effect has expired
        expiredEffects.push(id);
        
        // Call remove effect if defined
        const physics = usePhysics.getState();
        const definition = this.powerUpDefinitions[effectData.powerUp.type];
        
        if (definition.removeEffect) {
          definition.removeEffect(effectData.powerUp, physics);
        }
      }
    });
    
    // Remove expired effects
    expiredEffects.forEach(id => {
      this.activeEffects.delete(id);
    });
    
    // Update power-up animations
    this.powerUps.forEach(powerUp => {
      if (powerUp.active && !powerUp.collected) {
        // Hovering animation
        powerUp.position.y = powerUp.position.y + Math.sin(now * 0.002 * powerUp.pulseSpeed!) * 0.003;
        
        // Rotation
        // (actual rotation would be applied by the 3D component using this position)
      }
    });
    
    this.lastUpdateTime = now;
  }
  
  // Clean up collected power-ups
  public cleanup(maxAge: number = 30000): void {
    const now = Date.now();
    
    this.powerUps.forEach((powerUp, id) => {
      if (powerUp.collected && powerUp.collectedTime && now - powerUp.collectedTime > maxAge) {
        this.powerUps.delete(id);
      }
    });
  }
  
  // Get active effects for UI display
  public getActiveEffects(): { type: PowerUpType, timeRemaining: number, duration: number }[] {
    const now = Date.now();
    const effects: { type: PowerUpType, timeRemaining: number, duration: number }[] = [];
    
    this.activeEffects.forEach(({ endTime, powerUp }) => {
      effects.push({
        type: powerUp.type,
        timeRemaining: Math.max(0, (endTime - now) / 1000),
        duration: powerUp.duration
      });
    });
    
    return effects;
  }
  
  // Get display name for power-up type
  public getPowerUpName(type: PowerUpType): string {
    return this.powerUpDefinitions[type]?.name || 'Unknown Power-up';
  }
  
  // Get description for power-up type
  public getPowerUpDescription(type: PowerUpType): string {
    return this.powerUpDefinitions[type]?.description || '';
  }
  
  // Clear all power-ups (used when changing levels)
  public clear(): void {
    this.powerUps.clear();
    this.activeEffects.clear();
  }
}

// Create a singleton instance
export const powerUpSystem = new PowerUpSystem();

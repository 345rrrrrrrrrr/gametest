import { create } from 'zustand';
import * as THREE from 'three';
import { Ball } from '@/types/entities';
import { PowerUpType } from '@/types/game';
import { generateUUID } from '@/lib/utils/helpers';

interface PlayerState {
  // Ball entities
  balls: Ball[];
  activeBallIndex: number;
  heldBall: string | null;
  
  // Camera targets
  cameraTarget: THREE.Vector3;
  
  // Actions
  createBall: (position: THREE.Vector3, direction?: THREE.Vector3) => string;
  updateBall: (id: string, updates: Partial<Ball>) => void;
  removeBall: (id: string) => void;
  setActiveBallIndex: (index: number) => void;
  holdBall: (id: string, position?: THREE.Vector3) => void;
  releaseBall: () => void;
  applyPowerUpToBall: (id: string, powerUp: { type: PowerUpType, remainingTime: number, strength: number }) => void;
  resetBalls: () => void;
}

export const usePlayerState = create<PlayerState>((set, get) => ({
  // Initial state
  balls: [],
  activeBallIndex: -1,
  heldBall: null,
  cameraTarget: new THREE.Vector3(0, 5, 0),
  
  // Actions
  createBall: (position, direction = new THREE.Vector3(0, 0, 0)) => {
    const id = `ball_${generateUUID()}`;
    
    const ball: Ball = {
      id,
      type: 'ball',
      position: position.clone(),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(1, 1, 1),
      visible: true,
      radius: 0.5,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      velocity: direction.clone(),
      mass: 1,
      bounciness: 0.7,
      friction: 0.5,
      isHeld: false,
      trail: {
        enabled: true,
        maxPoints: 100,
        width: 0.1,
        color: '#58a5f0'
      },
      activePowerUps: [],
      children: [],
      update: () => {},
      destroy: () => {},
      applyForce: (force) => {},
      applyImpulse: (impulse) => {},
      hold: () => {},
      release: () => {},
      applyGravity: () => {},
      applyFriction: () => {},
      applyWind: () => {},
      checkCollisions: () => {}
    };
    
    set((state) => ({
      balls: [...state.balls, ball],
      activeBallIndex: state.balls.length
    }));
    
    return id;
  },
  
  updateBall: (id, updates) => {
    set((state) => ({
      balls: state.balls.map(ball => 
        ball.id === id ? { ...ball, ...updates } : ball
      )
    }));
  },
  
  removeBall: (id) => {
    set((state) => {
      const newBalls = state.balls.filter(ball => ball.id !== id);
      const wasActive = state.activeBallIndex >= 0 && state.balls[state.activeBallIndex]?.id === id;
      
      return {
        balls: newBalls,
        activeBallIndex: wasActive 
          ? (newBalls.length > 0 ? 0 : -1) 
          : (state.activeBallIndex >= newBalls.length 
             ? (newBalls.length > 0 ? newBalls.length - 1 : -1) 
             : state.activeBallIndex)
      };
    });
  },
  
  setActiveBallIndex: (index) => {
    set((state) => ({
      activeBallIndex: index >= -1 && index < state.balls.length 
        ? index
        : state.activeBallIndex
    }));
  },
  
  holdBall: (id, position) => {
    set((state) => {
      // Find the ball index
      const ballIndex = state.balls.findIndex(ball => ball.id === id);
      if (ballIndex === -1) return state;
      
      // Update the ball's position and held state
      const updatedBalls = [...state.balls];
      updatedBalls[ballIndex] = {
        ...updatedBalls[ballIndex],
        isHeld: true,
        ...(position ? { position: position.clone() } : {})
      };
      
      return {
        balls: updatedBalls,
        activeBallIndex: ballIndex,
        heldBall: id
      };
    });
  },
  
  releaseBall: () => {
    set((state) => {
      if (!state.heldBall) return state;
      
      // Find the ball
      const ballIndex = state.balls.findIndex(ball => ball.id === state.heldBall);
      if (ballIndex === -1) return state;
      
      // Update the ball's held state
      const updatedBalls = [...state.balls];
      updatedBalls[ballIndex] = {
        ...updatedBalls[ballIndex],
        isHeld: false
      };
      
      return {
        balls: updatedBalls,
        heldBall: null
      };
    });
  },
  
  applyPowerUpToBall: (id, powerUp) => {
    set((state) => {
      // Find the ball
      const ballIndex = state.balls.findIndex(ball => ball.id === id);
      if (ballIndex === -1) return state;
      
      // Get current active power-ups
      const currentPowerUps = [...state.balls[ballIndex].activePowerUps];
      
      // Check if this power-up type already exists
      const existingIndex = currentPowerUps.findIndex(pu => pu.type === powerUp.type);
      
      if (existingIndex >= 0) {
        // Update existing power-up duration
        currentPowerUps[existingIndex] = {
          ...currentPowerUps[existingIndex],
          remainingTime: Math.max(
            currentPowerUps[existingIndex].remainingTime,
            powerUp.remainingTime
          ),
          strength: powerUp.strength
        };
      } else {
        // Add new power-up
        currentPowerUps.push({
          type: powerUp.type,
          remainingTime: powerUp.remainingTime,
          strength: powerUp.strength
        });
      }
      
      // Update the ball
      const updatedBalls = [...state.balls];
      updatedBalls[ballIndex] = {
        ...updatedBalls[ballIndex],
        activePowerUps: currentPowerUps
      };
      
      return {
        balls: updatedBalls
      };
    });
  },
  
  resetBalls: () => {
    set(() => ({
      balls: [],
      activeBallIndex: -1,
      heldBall: null
    }));
  }
}));

export default usePlayerState;

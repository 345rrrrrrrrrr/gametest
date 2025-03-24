import { create } from 'zustand';
import { useAudio } from './useAudio';

interface ScoreState {
  // Score values
  score: number;
  highScore: number;
  multiplier: number;
  maxMultiplier: number;
  combo: number;
  comboTimer: number;
  
  // Tracking
  lastScoreTime: number;
  totalCollisions: number;
  objectsDestroyed: number;
  powerUpsCollected: number;
  
  // Score history for analytics
  history: {
    timestamp: number;
    points: number;
    type: string;
  }[];
  
  // Methods
  addPoints: (points: number, type?: string) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setMultiplier: (value: number, duration?: number) => void;
  getMultipliedPoints: (basePoints: number) => number;
  reset: () => void;
  updateComboTimer: (delta: number) => void;
  getHistory: () => { timestamp: number; points: number; type: string }[];
}

export const useScore = create<ScoreState>((set, get) => ({
  // Initial values
  score: 0,
  highScore: 0,
  multiplier: 1,
  maxMultiplier: 10,
  combo: 0,
  comboTimer: 0,
  
  lastScoreTime: 0,
  totalCollisions: 0,
  objectsDestroyed: 0,
  powerUpsCollected: 0,
  
  history: [],
  
  // Add points to score
  addPoints: (points, type = 'general') => {
    if (points <= 0) return;
    
    const { score, highScore, multiplier, history } = get();
    
    // Apply multiplier
    const multipliedPoints = Math.round(points * multiplier);
    const newScore = score + multipliedPoints;
    const newHighScore = Math.max(highScore, newScore);
    
    // Reset combo timer
    const comboTime = 5; // 5 seconds to chain actions
    
    // Play success sound if significant points
    if (multipliedPoints >= 100) {
      const audio = useAudio.getState();
      audio.playSuccess();
    }
    
    // Add to history
    const scoreEntry = {
      timestamp: Date.now(),
      points: multipliedPoints,
      type
    };
    
    set({
      score: newScore,
      highScore: newHighScore,
      lastScoreTime: Date.now(),
      comboTimer: comboTime,
      history: [...history, scoreEntry]
    });
    
    // Increment appropriate counters based on type
    if (type === 'collision') {
      set(state => ({ totalCollisions: state.totalCollisions + 1 }));
    } else if (type === 'destruction') {
      set(state => ({ objectsDestroyed: state.objectsDestroyed + 1 }));
    } else if (type === 'powerup') {
      set(state => ({ powerUpsCollected: state.powerUpsCollected + 1 }));
    }
  },
  
  // Increment combo counter
  incrementCombo: () => {
    set(state => {
      const newCombo = state.combo + 1;
      
      // Increase multiplier at combo thresholds
      let newMultiplier = state.multiplier;
      
      if (newCombo % 5 === 0) {
        newMultiplier = Math.min(state.multiplier + 0.5, state.maxMultiplier);
      }
      
      return {
        combo: newCombo,
        multiplier: newMultiplier,
        comboTimer: 5 // Reset combo timer
      };
    });
  },
  
  // Reset combo and multiplier
  resetCombo: () => {
    set({
      combo: 0,
      multiplier: 1,
      comboTimer: 0
    });
  },
  
  // Set multiplier directly (e.g., from power-up)
  setMultiplier: (value, duration) => {
    const newMultiplier = Math.min(value, get().maxMultiplier);
    
    set({
      multiplier: newMultiplier,
      comboTimer: duration || 5
    });
    
    // Reset multiplier after duration if provided
    if (duration) {
      setTimeout(() => {
        set({ multiplier: 1 });
      }, duration * 1000);
    }
  },
  
  // Calculate points with current multiplier
  getMultipliedPoints: (basePoints) => {
    return Math.round(basePoints * get().multiplier);
  },
  
  // Reset all score values
  reset: () => {
    // Preserve high score
    const { highScore } = get();
    
    set({
      score: 0,
      multiplier: 1,
      combo: 0,
      comboTimer: 0,
      lastScoreTime: 0,
      totalCollisions: 0,
      objectsDestroyed: 0,
      powerUpsCollected: 0,
      history: []
    });
  },
  
  // Update combo timer (call this in game loop)
  updateComboTimer: (delta) => {
    set(state => {
      if (state.comboTimer <= 0) return state;
      
      const newTimer = state.comboTimer - delta;
      
      // Reset combo when timer reaches zero
      if (newTimer <= 0) {
        return {
          comboTimer: 0,
          multiplier: 1,
          combo: 0
        };
      }
      
      return { comboTimer: newTimer };
    });
  },
  
  // Get score history for analytics
  getHistory: () => {
    return get().history;
  }
}));

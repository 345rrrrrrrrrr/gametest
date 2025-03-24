import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { useAudio } from '../stores/useAudio';

// Score event types
export type ScoreEventType = 
  'collision' | 
  'destruction' | 
  'powerup' | 
  'checkpoint' | 
  'objective' | 
  'combo' | 
  'time' | 
  'trick';

// Score event data
export interface ScoreEvent {
  id: string;
  timestamp: number;
  points: number;
  type: ScoreEventType;
  position?: { x: number; y: number; z: number };
  multiplier: number;
  description?: string;
}

// Combo state
export interface ComboState {
  active: boolean;
  count: number;
  lastEventTime: number;
  timeWindow: number;
  multiplier: number;
}

// Score system class for tracking and calculating scores
export class ScoreSystem {
  private score: number = 0;
  private highScore: number = 0;
  private multiplier: number = 1;
  private baseMultiplier: number = 1;
  private temporaryMultiplier: number = 1;
  private temporaryMultiplierEndTime: number = 0;
  private maxMultiplier: number = 10;
  private scoreHistory: ScoreEvent[] = [];
  private combo: ComboState = {
    active: false,
    count: 0,
    lastEventTime: 0,
    timeWindow: 5000, // 5 seconds to chain actions
    multiplier: 1
  };
  private objectsDestroyed: number = 0;
  private powerUpsCollected: number = 0;
  private checkpointsPassed: number = 0;
  private totalCollisions: number = 0;
  private gameStartTime: number = 0;
  private gameEndTime: number = 0;
  private levelScore: Record<number, number> = {};
  private levelBestTime: Record<number, number> = {};
  private callbacks: ((points: number, type: ScoreEventType) => void)[] = [];
  
  constructor() {
    this.gameStartTime = Date.now();
    
    // Load high score from local storage
    this.loadScores();
  }
  
  // Add points to the score
  public addPoints(points: number, type: ScoreEventType = 'collision', position?: { x: number; y: number; z: number }, description?: string): number {
    if (points <= 0) return 0;
    
    // Check for combo
    const now = Date.now();
    this.updateCombo(now);
    
    // Calculate total multiplier
    const totalMultiplier = this.calculateTotalMultiplier();
    
    // Calculate actual points with multiplier
    const adjustedPoints = Math.round(points * totalMultiplier);
    
    // Update score
    this.score += adjustedPoints;
    
    // Update high score if needed
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveScores();
    }
    
    // Create score event
    const event: ScoreEvent = {
      id: `score-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      points: adjustedPoints,
      type,
      position,
      multiplier: totalMultiplier,
      description
    };
    
    // Add to history
    this.scoreHistory.push(event);
    
    // Update stats based on event type
    this.updateStats(type);
    
    // Notify callbacks
    this.notifyCallbacks(adjustedPoints, type);
    
    // Play sound based on points
    this.playScoreSound(adjustedPoints);
    
    return adjustedPoints;
  }
  
  // Update the combo state
  private updateCombo(now: number): void {
    if (this.combo.active) {
      // Check if combo has expired
      if (now - this.combo.lastEventTime > this.combo.timeWindow) {
        // Reset combo
        this.combo.active = false;
        this.combo.count = 0;
        this.combo.multiplier = 1;
      }
    }
    
    // Increment combo
    this.combo.count++;
    this.combo.active = true;
    this.combo.lastEventTime = now;
    
    // Update combo multiplier (increase every 5 hits)
    if (this.combo.count % 5 === 0) {
      this.combo.multiplier = Math.min(this.combo.multiplier + 0.5, 5);
    }
  }
  
  // Calculate the total multiplier (base * temporary * combo)
  private calculateTotalMultiplier(): number {
    let totalMultiplier = this.baseMultiplier;
    
    // Add temporary multiplier if active
    if (Date.now() < this.temporaryMultiplierEndTime) {
      totalMultiplier *= this.temporaryMultiplier;
    }
    
    // Add combo multiplier if active
    if (this.combo.active) {
      totalMultiplier *= this.combo.multiplier;
    }
    
    // Ensure total doesn't exceed max
    return Math.min(totalMultiplier, this.maxMultiplier);
  }
  
  // Update stats based on event type
  private updateStats(type: ScoreEventType): void {
    switch (type) {
      case 'collision':
        this.totalCollisions++;
        break;
      case 'destruction':
        this.objectsDestroyed++;
        break;
      case 'powerup':
        this.powerUpsCollected++;
        break;
      case 'checkpoint':
        this.checkpointsPassed++;
        break;
    }
  }
  
  // Notify callbacks of score change
  private notifyCallbacks(points: number, type: ScoreEventType): void {
    this.callbacks.forEach(callback => {
      try {
        callback(points, type);
      } catch (error) {
        console.error('Error in score callback:', error);
      }
    });
  }
  
  // Set a temporary score multiplier
  public setMultiplier(value: number, duration: number): void {
    // Ensure multiplier is valid
    const multiplier = Math.max(1, Math.min(value, this.maxMultiplier));
    
    // Set temporary multiplier
    this.temporaryMultiplier = multiplier;
    this.temporaryMultiplierEndTime = Date.now() + duration * 1000;
    
    // Update current multiplier
    this.multiplier = this.calculateTotalMultiplier();
  }
  
  // Get the current score
  public getScore(): number {
    return this.score;
  }
  
  // Get the high score
  public getHighScore(): number {
    return this.highScore;
  }
  
  // Get the current multiplier
  public getMultiplier(): number {
    return this.calculateTotalMultiplier();
  }
  
  // Get combo state
  public getCombo(): ComboState {
    return { ...this.combo };
  }
  
  // Get combo timer remaining (0-1)
  public getComboTimerPercentage(): number {
    if (!this.combo.active) return 0;
    
    const elapsed = Date.now() - this.combo.lastEventTime;
    return Math.max(0, 1 - (elapsed / this.combo.timeWindow));
  }
  
  // Reset the score
  public reset(): void {
    this.score = 0;
    this.multiplier = 1;
    this.baseMultiplier = 1;
    this.temporaryMultiplier = 1;
    this.temporaryMultiplierEndTime = 0;
    this.scoreHistory = [];
    this.combo = {
      active: false,
      count: 0,
      lastEventTime: 0,
      timeWindow: 5000,
      multiplier: 1
    };
    this.objectsDestroyed = 0;
    this.powerUpsCollected = 0;
    this.checkpointsPassed = 0;
    this.totalCollisions = 0;
    this.gameStartTime = Date.now();
    this.gameEndTime = 0;
  }
  
  // End the game and return final score
  public endGame(): { score: number; highScore: number; time: number } {
    this.gameEndTime = Date.now();
    const gameTime = (this.gameEndTime - this.gameStartTime) / 1000; // in seconds
    
    return {
      score: this.score,
      highScore: this.highScore,
      time: gameTime
    };
  }
  
  // Save level score
  public saveLevelScore(levelId: number): void {
    const currentScore = this.levelScore[levelId] || 0;
    if (this.score > currentScore) {
      this.levelScore[levelId] = this.score;
      this.saveScores();
    }
    
    // Save time if this is the first completion or better time
    if (this.gameEndTime > 0) {
      const gameTime = (this.gameEndTime - this.gameStartTime) / 1000;
      const bestTime = this.levelBestTime[levelId];
      
      if (!bestTime || gameTime < bestTime) {
        this.levelBestTime[levelId] = gameTime;
        this.saveScores();
      }
    }
  }
  
  // Get level high score
  public getLevelHighScore(levelId: number): number {
    return this.levelScore[levelId] || 0;
  }
  
  // Get level best time
  public getLevelBestTime(levelId: number): number | undefined {
    return this.levelBestTime[levelId];
  }
  
  // Get recent score events
  public getRecentEvents(count: number = 5): ScoreEvent[] {
    return this.scoreHistory.slice(-count).reverse();
  }
  
  // Get stats
  public getStats(): {
    objectsDestroyed: number;
    powerUpsCollected: number;
    checkpointsPassed: number;
    totalCollisions: number;
    gameTime: number;
  } {
    const now = Date.now();
    const gameTime = (this.gameEndTime > 0 ? this.gameEndTime : now) - this.gameStartTime;
    
    return {
      objectsDestroyed: this.objectsDestroyed,
      powerUpsCollected: this.powerUpsCollected,
      checkpointsPassed: this.checkpointsPassed,
      totalCollisions: this.totalCollisions,
      gameTime: gameTime / 1000 // in seconds
    };
  }
  
  // Register callback for score changes
  public onScoreChange(callback: (points: number, type: ScoreEventType) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  // Save scores to local storage
  private saveScores(): void {
    try {
      const scoreData = {
        highScore: this.highScore,
        levelScores: this.levelScore,
        levelTimes: this.levelBestTime
      };
      
      localStorage.setItem('physics-sandbox-scores', JSON.stringify(scoreData));
    } catch (e) {
      console.error('Failed to save scores:', e);
    }
  }
  
  // Load scores from local storage
  private loadScores(): void {
    try {
      const scoreData = localStorage.getItem('physics-sandbox-scores');
      if (scoreData) {
        const parsed = JSON.parse(scoreData);
        this.highScore = parsed.highScore || 0;
        this.levelScore = parsed.levelScores || {};
        this.levelBestTime = parsed.levelTimes || {};
      }
    } catch (e) {
      console.error('Failed to load scores:', e);
    }
  }
  
  // Play sound based on score amount
  private playScoreSound(points: number): void {
    const audio = useAudio.getState();
    
    if (points >= 500) {
      // Major score - play success sound
      audio.playSuccess();
    } else if (points >= 100) {
      // Medium score - play hit sound
      audio.playHit();
    }
    // Small scores don't play sounds to avoid sound spam
  }
}

// Create Zustand store for score management
interface ScoreState {
  score: number;
  highScore: number;
  multiplier: number;
  combo: number;
  comboTimer: number; // 0-5 seconds
  totalCollisions: number;
  objectsDestroyed: number;
  powerUpsCollected: number;
  
  // Methods
  addPoints: (points: number, type?: ScoreEventType) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setMultiplier: (value: number, duration?: number) => void;
  getMultipliedPoints: (basePoints: number) => number;
  reset: () => void;
  updateComboTimer: (delta: number) => void;
  getHistory: () => ScoreEvent[];
}

// Create score system instance
const scoreSystem = new ScoreSystem();

// Export the Zustand store
export const useScoreSystem = create<ScoreState>()(
  subscribeWithSelector((set, get) => ({
    score: 0,
    highScore: scoreSystem.getHighScore(),
    multiplier: 1,
    combo: 0,
    comboTimer: 0,
    totalCollisions: 0,
    objectsDestroyed: 0,
    powerUpsCollected: 0,
    
    addPoints: (points, type = 'general') => {
      const adjustedPoints = scoreSystem.addPoints(points, type);
      
      set({
        score: scoreSystem.getScore(),
        highScore: scoreSystem.getHighScore(),
        multiplier: scoreSystem.getMultiplier(),
        comboTimer: scoreSystem.getCombo().active ? 5 : 0
      });
      
      return adjustedPoints;
    },
    
    incrementCombo: () => {
      // This will be handled internally by the score system
      // when addPoints is called
      const comboState = scoreSystem.getCombo();
      set({ 
        combo: comboState.count,
        multiplier: scoreSystem.getMultiplier(),
        comboTimer: 5
      });
    },
    
    resetCombo: () => {
      // Force reset combo
      scoreSystem.reset();
      set({
        combo: 0,
        multiplier: 1,
        comboTimer: 0
      });
    },
    
    setMultiplier: (value, duration = 5) => {
      scoreSystem.setMultiplier(value, duration);
      set({
        multiplier: scoreSystem.getMultiplier(),
        comboTimer: duration
      });
    },
    
    getMultipliedPoints: (basePoints) => {
      return Math.round(basePoints * get().multiplier);
    },
    
    reset: () => {
      scoreSystem.reset();
      set({
        score: 0,
        multiplier: 1,
        combo: 0,
        comboTimer: 0,
        totalCollisions: 0,
        objectsDestroyed: 0,
        powerUpsCollected: 0
      });
    },
    
    updateComboTimer: (delta) => {
      set(state => {
        if (state.comboTimer <= 0) {
          return {
            comboTimer: 0,
            multiplier: 1,
            combo: 0
          };
        }
        
        const newTimer = state.comboTimer - delta;
        
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
    
    getHistory: () => {
      return scoreSystem.getRecentEvents();
    }
  }))
);

import { create } from 'zustand';

interface ScoreState {
  // Score and statistics
  score: number;
  combo: number;
  highScore: number;
  timeLeft: number;
  ballsCreated: number;
  obstaclesDestroyed: number;
  powerUpsCollected: number;
  distanceTraveled: number;
  jumpsPerformed: number;
  timeSpentInAir: number;
  highestPoint: number;
  fastestSpeed: number;
  longestChain: number;
  
  // Actions
  addScore: (points: number) => void;
  setScore: (score: number) => void;
  incrementCombo: () => void;
  setCombo: (combo: number) => void;
  resetCombo: () => void;
  setTimeLeft: (time: number) => void;
  addBallCreated: () => void;
  addObstacleDestroyed: () => void;
  addPowerUpCollected: () => void;
  addDistanceTraveled: (distance: number) => void;
  addJump: () => void;
  addTimeInAir: (time: number) => void;
  updateHighestPoint: (height: number) => void;
  updateFastestSpeed: (speed: number) => void;
  resetScore: () => void;
  saveHighScore: () => void;
}

export const useScoreState = create<ScoreState>((set, get) => ({
  // Initial state
  score: 0,
  combo: 1,
  highScore: 0,
  timeLeft: 0,
  ballsCreated: 0,
  obstaclesDestroyed: 0,
  powerUpsCollected: 0,
  distanceTraveled: 0,
  jumpsPerformed: 0,
  timeSpentInAir: 0,
  highestPoint: 0,
  fastestSpeed: 0,
  longestChain: 0,
  
  // Actions
  addScore: (points) => set((state) => {
    const pointsWithCombo = points * state.combo;
    const newScore = state.score + pointsWithCombo;
    
    // Update high score if needed
    const newHighScore = newScore > state.highScore ? newScore : state.highScore;
    
    return {
      score: newScore,
      highScore: newHighScore
    };
  }),
  
  setScore: (score) => set(() => ({ score })),
  
  incrementCombo: () => set((state) => {
    const newCombo = state.combo + 1;
    const newLongestChain = newCombo > state.longestChain 
      ? newCombo 
      : state.longestChain;
    
    return {
      combo: newCombo,
      longestChain: newLongestChain
    };
  }),
  
  setCombo: (combo) => set(() => ({ combo })),
  
  resetCombo: () => set(() => ({ combo: 1 })),
  
  setTimeLeft: (time) => set(() => ({ timeLeft: time })),
  
  addBallCreated: () => set((state) => ({ 
    ballsCreated: state.ballsCreated + 1 
  })),
  
  addObstacleDestroyed: () => set((state) => ({ 
    obstaclesDestroyed: state.obstaclesDestroyed + 1 
  })),
  
  addPowerUpCollected: () => set((state) => ({ 
    powerUpsCollected: state.powerUpsCollected + 1 
  })),
  
  addDistanceTraveled: (distance) => set((state) => ({ 
    distanceTraveled: state.distanceTraveled + distance 
  })),
  
  addJump: () => set((state) => ({ 
    jumpsPerformed: state.jumpsPerformed + 1 
  })),
  
  addTimeInAir: (time) => set((state) => ({ 
    timeSpentInAir: state.timeSpentInAir + time 
  })),
  
  updateHighestPoint: (height) => set((state) => ({ 
    highestPoint: height > state.highestPoint ? height : state.highestPoint 
  })),
  
  updateFastestSpeed: (speed) => set((state) => ({ 
    fastestSpeed: speed > state.fastestSpeed ? speed : state.fastestSpeed 
  })),
  
  resetScore: () => set(() => ({ 
    score: 0,
    combo: 1,
    timeLeft: 0,
    // Don't reset statistics that persist between games
  })),
  
  saveHighScore: () => {
    const { highScore } = get();
    try {
      const savedHighScore = localStorage.getItem('highScore');
      const currentHighScore = savedHighScore ? parseInt(savedHighScore) : 0;
      
      if (highScore > currentHighScore) {
        localStorage.setItem('highScore', highScore.toString());
      }
    } catch (e) {
      console.error('Error saving high score:', e);
    }
  }
}));

// Initialize high score from localStorage
try {
  const savedHighScore = localStorage.getItem('highScore');
  if (savedHighScore) {
    useScoreState.setState({ 
      highScore: parseInt(savedHighScore) 
    });
  }
} catch (e) {
  console.error('Error loading high score:', e);
}

export default useScoreState;

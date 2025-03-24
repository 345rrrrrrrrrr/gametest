import { create } from 'zustand';
import { GamePhase, GameMode } from '@/types/game';

interface GameState {
  // Game state
  phase: GamePhase;
  mode: GameMode;
  isPaused: boolean;
  isLoading: boolean;
  loadingProgress: number;
  debugMode: boolean;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  setMode: (mode: GameMode) => void;
  setPaused: (paused: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  toggleDebugMode: () => void;
}

export const useGameState = create<GameState>((set) => ({
  // Initial state
  phase: GamePhase.MENU,
  mode: GameMode.SANDBOX,
  isPaused: false,
  isLoading: false,
  loadingProgress: 0,
  debugMode: false,
  
  // Actions
  setPhase: (phase) => set(() => ({ phase })),
  
  setMode: (mode) => set(() => ({ mode })),
  
  setPaused: (paused) => set(() => ({ 
    isPaused: paused,
    phase: paused ? GamePhase.PAUSED : GamePhase.PLAYING
  })),
  
  setLoading: (loading) => set(() => ({ 
    isLoading: loading,
    loadingProgress: loading ? 0 : 100
  })),
  
  setLoadingProgress: (progress) => set((state) => ({
    loadingProgress: state.isLoading ? Math.min(100, Math.max(0, progress)) : 0
  })),
  
  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode }))
}));

export default useGameState;

import { create } from 'zustand';

interface UIState {
  // UI visibility
  showUI: boolean;
  showHUD: boolean;
  showMenu: boolean;
  showDebugInfo: boolean;
  showTooltips: boolean;
  
  // UI state
  activeTab: string;
  lastMessage: string;
  messageTimer: number | null;
  
  // Actions
  setShowUI: (show: boolean) => void;
  setShowHUD: (show: boolean) => void;
  setShowMenu: (show: boolean) => void;
  setShowDebugInfo: (show: boolean) => void;
  setShowTooltips: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  showMessage: (message: string, duration?: number) => void;
  clearMessage: () => void;
}

export const useUIState = create<UIState>((set, get) => ({
  // Initial state
  showUI: true,
  showHUD: true,
  showMenu: true,
  showDebugInfo: false,
  showTooltips: true,
  activeTab: 'ballSettings',
  lastMessage: '',
  messageTimer: null,
  
  // Actions
  setShowUI: (show) => set(() => ({ showUI: show })),
  
  setShowHUD: (show) => set(() => ({ showHUD: show })),
  
  setShowMenu: (show) => set(() => ({ showMenu: show })),
  
  setShowDebugInfo: (show) => set(() => ({ showDebugInfo: show })),
  
  setShowTooltips: (show) => set(() => ({ showTooltips: show })),
  
  setActiveTab: (tab) => set(() => ({ activeTab: tab })),
  
  showMessage: (message, duration = 3000) => set((state) => {
    // Clear any existing timer
    if (state.messageTimer !== null) {
      window.clearTimeout(state.messageTimer);
    }
    
    // Set new timer to clear message
    const timer = window.setTimeout(() => {
      get().clearMessage();
    }, duration);
    
    return {
      lastMessage: message,
      messageTimer: timer
    };
  }),
  
  clearMessage: () => set((state) => {
    // Clear timer if exists
    if (state.messageTimer !== null) {
      window.clearTimeout(state.messageTimer);
    }
    
    return {
      lastMessage: '',
      messageTimer: null
    };
  })
}));

export default useUIState;

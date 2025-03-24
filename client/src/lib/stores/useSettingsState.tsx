import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { GameSettings } from '@/types/game';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';

interface PhysicsSettings {
  gravity: number;
  defaultBounciness: number;
  defaultFriction: number;
  windEnabled: boolean;
  windStrength: number;
  windDirection: number;
  magnetEnabled: boolean;
  magnetStrength: number;
}

const DEFAULT_PHYSICS_SETTINGS: PhysicsSettings = {
  gravity: 9.81,
  defaultBounciness: 0.7,
  defaultFriction: 0.5,
  windEnabled: false,
  windStrength: 0,
  windDirection: 0,
  magnetEnabled: false,
  magnetStrength: 0
};

interface SettingsState {
  // Game settings
  settings: GameSettings;
  physicsSettings: PhysicsSettings;
  
  // Actions
  updateSetting: <K extends keyof GameSettings>(
    key: K,
    value: GameSettings[K]
  ) => void;
  
  updatePhysicsSetting: <K extends keyof PhysicsSettings>(
    key: K,
    value: PhysicsSettings[K]
  ) => void;
  
  resetSettings: () => void;
  saveSettings: () => void;
  loadSettings: () => void;
}

export const useSettingsState = create<SettingsState>((set, get) => ({
  // Initial state
  settings: { ...DEFAULT_SETTINGS },
  physicsSettings: { ...DEFAULT_PHYSICS_SETTINGS },
  
  // Update a single setting
  updateSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value
      }
    }));
  },
  
  // Update a physics setting
  updatePhysicsSetting: (key, value) => {
    set((state) => ({
      physicsSettings: {
        ...state.physicsSettings,
        [key]: value
      }
    }));
  },
  
  // Reset all settings to defaults
  resetSettings: () => {
    set(() => ({
      settings: { ...DEFAULT_SETTINGS },
      physicsSettings: { ...DEFAULT_PHYSICS_SETTINGS }
    }));
  },
  
  // Save settings to local storage
  saveSettings: () => {
    const { settings, physicsSettings } = get();
    setLocalStorage('gameSettings', settings);
    setLocalStorage('physicsSettings', physicsSettings);
  },
  
  // Load settings from local storage
  loadSettings: () => {
    const savedSettings = getLocalStorage('gameSettings');
    const savedPhysicsSettings = getLocalStorage('physicsSettings');
    
    set(() => ({
      settings: savedSettings 
        ? { ...DEFAULT_SETTINGS, ...savedSettings } 
        : { ...DEFAULT_SETTINGS },
      physicsSettings: savedPhysicsSettings 
        ? { ...DEFAULT_PHYSICS_SETTINGS, ...savedPhysicsSettings } 
        : { ...DEFAULT_PHYSICS_SETTINGS }
    }));
  }
}));

// Load saved settings on initialization
useSettingsState.getState().loadSettings();

export default useSettingsState;

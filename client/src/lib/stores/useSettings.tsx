import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAudio } from './useAudio';

interface SettingsState {
  // Graphics settings
  lightingQuality: 'low' | 'medium' | 'high';
  shadows: boolean;
  postProcessing: boolean;
  cameraShake: boolean;
  dynamicLighting: boolean;
  particleDensity: number;
  
  // Environment settings
  environment: 'day' | 'sunset' | 'night';
  skybox: boolean;
  reflections: boolean;
  
  // Audio settings
  volume: number;
  musicEnabled: boolean;
  soundsMuted: boolean;
  
  // Camera settings
  cameraSettings: {
    fov: number;
    near: number;
    far: number;
    defaultMode: 'follow' | 'orbit' | 'static';
  };
  
  // Debug settings
  debug: boolean;
  showFPS: boolean;
  showPhysicsDebug: boolean;
  
  // Methods
  setLightingQuality: (quality: 'low' | 'medium' | 'high') => void;
  toggleShadows: () => void;
  togglePostProcessing: () => void;
  toggleCameraShake: () => void;
  toggleDynamicLighting: () => void;
  setParticleDensity: (density: number) => void;
  
  setEnvironment: (environment: 'day' | 'sunset' | 'night') => void;
  toggleSkybox: () => void;
  toggleReflections: () => void;
  
  setVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleSounds: () => void;
  
  setCameraFOV: (fov: number) => void;
  setCameraMode: (mode: 'follow' | 'orbit' | 'static') => void;
  
  toggleDebug: () => void;
  toggleFPS: () => void;
  togglePhysicsDebug: () => void;
  
  resetToDefaults: () => void;
}

// Default settings
const defaultSettings = {
  lightingQuality: 'medium' as const,
  shadows: true,
  postProcessing: true,
  cameraShake: true,
  dynamicLighting: true,
  particleDensity: 0.7,
  
  environment: 'day' as const,
  skybox: true,
  reflections: true,
  
  volume: 0.7,
  musicEnabled: true,
  soundsMuted: false,
  
  cameraSettings: {
    fov: 60,
    near: 0.1,
    far: 1000,
    defaultMode: 'follow' as const
  },
  
  debug: false,
  showFPS: false,
  showPhysicsDebug: false
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      // Graphics settings
      setLightingQuality: (quality) => {
        set({ lightingQuality: quality });
      },
      
      toggleShadows: () => {
        set(state => ({ shadows: !state.shadows }));
      },
      
      togglePostProcessing: () => {
        set(state => ({ postProcessing: !state.postProcessing }));
      },
      
      toggleCameraShake: () => {
        set(state => ({ cameraShake: !state.cameraShake }));
      },
      
      toggleDynamicLighting: () => {
        set(state => ({ dynamicLighting: !state.dynamicLighting }));
      },
      
      setParticleDensity: (density) => {
        set({ particleDensity: Math.max(0, Math.min(1, density)) });
      },
      
      // Environment settings
      setEnvironment: (environment) => {
        set({ environment });
      },
      
      toggleSkybox: () => {
        set(state => ({ skybox: !state.skybox }));
      },
      
      toggleReflections: () => {
        set(state => ({ reflections: !state.reflections }));
      },
      
      // Audio settings
      setVolume: (volume) => {
        const newVolume = Math.max(0, Math.min(1, volume));
        set({ volume: newVolume });
        
        // Update audio elements
        const audioStore = useAudio.getState();
        if (audioStore.backgroundMusic) {
          audioStore.backgroundMusic.volume = newVolume * 0.5;
        }
        
        // Other sound adjustments can be made here
      },
      
      toggleMusic: () => {
        set(state => {
          const newState = { musicEnabled: !state.musicEnabled };
          
          // Pause or play the background music
          const audioStore = useAudio.getState();
          if (audioStore.backgroundMusic) {
            if (newState.musicEnabled && !state.soundsMuted) {
              audioStore.backgroundMusic.play().catch(err => {
                console.warn("Couldn't play background music:", err);
              });
            } else {
              audioStore.backgroundMusic.pause();
            }
          }
          
          return newState;
        });
      },
      
      toggleSounds: () => {
        set(state => {
          const newState = { soundsMuted: !state.soundsMuted };
          
          // Update audio store muted state
          const audioStore = useAudio.getState();
          audioStore.toggleMute();
          
          // Also handle background music
          if (audioStore.backgroundMusic) {
            if (newState.soundsMuted) {
              audioStore.backgroundMusic.pause();
            } else if (state.musicEnabled) {
              audioStore.backgroundMusic.play().catch(err => {
                console.warn("Couldn't play background music:", err);
              });
            }
          }
          
          return newState;
        });
      },
      
      // Camera settings
      setCameraFOV: (fov) => {
        set(state => ({
          cameraSettings: {
            ...state.cameraSettings,
            fov
          }
        }));
      },
      
      setCameraMode: (mode) => {
        set(state => ({
          cameraSettings: {
            ...state.cameraSettings,
            defaultMode: mode
          }
        }));
      },
      
      // Debug settings
      toggleDebug: () => {
        set(state => ({ debug: !state.debug }));
      },
      
      toggleFPS: () => {
        set(state => ({ showFPS: !state.showFPS }));
      },
      
      togglePhysicsDebug: () => {
        set(state => ({ showPhysicsDebug: !state.showPhysicsDebug }));
      },
      
      // Reset all settings to defaults
      resetToDefaults: () => {
        set(defaultSettings);
      }
    }),
    {
      name: 'physics-sandbox-settings'
    }
  )
);

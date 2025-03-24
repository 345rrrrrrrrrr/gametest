import * as THREE from 'three';
import { getLocalStorage, setLocalStorage } from '@/lib/utils';
import { TEXTURE_PATHS } from '../constants';

// Generate a UUID
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Load a texture with error handling
export async function loadTexture(path: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      path,
      (texture) => {
        // Configure texture
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.encoding = THREE.sRGBEncoding;
        resolve(texture);
      },
      undefined,
      (error) => {
        console.error(`Error loading texture from ${path}:`, error);
        reject(error);
      }
    );
  });
}

// Get a texture from available textures
export async function getTexture(textureKey: keyof typeof TEXTURE_PATHS): Promise<THREE.Texture> {
  const path = TEXTURE_PATHS[textureKey];
  if (!path) {
    console.error(`Texture key ${textureKey} not found in TEXTURE_PATHS`);
    // Return a default texture
    return loadTexture(TEXTURE_PATHS.asphalt);
  }
  return loadTexture(path);
}

// Deep clone an object
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (obj instanceof Object) {
    const copy: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      copy[key] = deepClone((obj as Record<string, any>)[key]);
    });
    return copy as T;
  }
  
  throw new Error(`Unable to copy object: ${obj}`);
}

// Load game data from local storage
export function loadGameData<T>(key: string, defaultValue: T): T {
  const savedData = getLocalStorage(key);
  return savedData !== null ? savedData as T : defaultValue;
}

// Save game data to local storage
export function saveGameData<T>(key: string, data: T): void {
  setLocalStorage(key, data);
}

// Throttle a function to limit how often it can be called
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let inThrottle = false;
  let lastResult: ReturnType<T> | undefined;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
    return lastResult;
  };
}

// Debounce a function to delay its execution
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Generate a random color with optional alpha
export function randomColor(alpha: number = 1): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Format a number with commas
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format a time in seconds to MM:SS format
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Check if a value is between a min and max (inclusive)
export function isBetween(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Fisher-Yates shuffle algorithm for arrays
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Ease-in-out function
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Linear easing function
export function linearEase(t: number): number {
  return t;
}

// Cubic ease-in function
export function easeIn(t: number): number {
  return t * t * t;
}

// Cubic ease-out function
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Convert a hex color to an RGB color
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Convert RGB values to a hex color
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Get a gradient color between two colors based on a ratio
export function gradientColor(
  startColor: string,
  endColor: string,
  ratio: number
): string {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);
  
  const r = Math.round(start.r + (end.r - start.r) * ratio);
  const g = Math.round(start.g + (end.g - start.g) * ratio);
  const b = Math.round(start.b + (end.b - start.b) * ratio);
  
  return rgbToHex(r, g, b);
}

// Check if WebGL is available in the browser
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

// Check if the device is a mobile device
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get the current viewport dimensions
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// Get the device pixel ratio for high-DPI displays
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

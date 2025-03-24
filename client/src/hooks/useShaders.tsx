import { useMemo } from 'react';
import particleShader from '@/lib/shaders/particleShader';
import glowShader from '@/lib/shaders/glowShader';
import waterShader from '@/lib/shaders/waterShader';
import skyShader from '@/lib/shaders/skyShader';

export const useShaders = () => {
  // Memoize shaders to avoid recreating on every render
  const shaders = useMemo(() => {
    return {
      particleShader,
      glowShader,
      waterShader,
      skyShader
    };
  }, []);
  
  return shaders;
};

export default useShaders;

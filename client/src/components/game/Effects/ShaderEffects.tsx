import { useRef, useEffect } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { useSettings } from '../../../lib/stores/useSettings';
import { usePhysics } from '../../../lib/stores/usePhysics';

// Register the components with react-three-fiber
extend({ EffectComposer, ShaderPass, RenderPass, UnrealBloomPass, GlitchPass });

// Custom post-processing shader effects
const ShaderEffects = () => {
  const { gl, scene, camera, size } = useThree();
  const settings = useSettings();
  const physics = usePhysics();
  
  const composer = useRef<EffectComposer>();
  const bloomPass = useRef<UnrealBloomPass>();
  const glitchPass = useRef<GlitchPass>();
  
  // Check if we're using high quality rendering
  const isHighQuality = settings.lightingQuality === 'high';
  
  // Initialize effect composer and passes
  useEffect(() => {
    if (!composer.current) {
      composer.current = new EffectComposer(gl);
      
      // Add basic render pass
      const renderPass = new RenderPass(scene, camera);
      composer.current.addPass(renderPass);
      
      // Add bloom effect (for glowing objects)
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        0.5,  // strength
        0.8,  // radius
        0.85  // threshold (higher = less bloom)
      );
      bloomPass.current = bloom;
      composer.current.addPass(bloom);
      
      // Add glitch pass for special effects (disabled by default)
      const glitch = new GlitchPass(0);
      glitch.enabled = false;
      glitchPass.current = glitch;
      composer.current.addPass(glitch);
    }
    
    // Update passes based on quality settings
    if (bloomPass.current) {
      bloomPass.current.strength = isHighQuality ? 0.5 : 0.3;
      bloomPass.current.radius = isHighQuality ? 0.8 : 0.5;
      bloomPass.current.threshold = isHighQuality ? 0.85 : 0.9;
    }
  }, [gl, scene, camera, size, isHighQuality]);
  
  // Resize effect composer when screen size changes
  useEffect(() => {
    if (composer.current) {
      composer.current.setSize(size.width, size.height);
    }
  }, [size]);
  
  // Update glitch effect based on physics impacts
  useEffect(() => {
    const handleImpact = (force: number) => {
      if (force > 15 && glitchPass.current) {
        // Enable glitch effect briefly after strong impact
        glitchPass.current.enabled = true;
        
        // Duration based on impact force
        const duration = Math.min(force * 30, 500);
        
        // Disable after duration
        setTimeout(() => {
          if (glitchPass.current) {
            glitchPass.current.enabled = false;
          }
        }, duration);
      }
    };
    
    physics.onImpact(handleImpact);
    
    return () => {
      physics.offImpact();
    };
  }, [physics]);
  
  // Render using effect composer
  useFrame(({ gl }) => {
    if (composer.current && settings.postProcessing) {
      composer.current.render();
    } else {
      gl.render(scene, camera);
    }
  }, 1);
  
  return null; // This component doesn't render any mesh
};

export default ShaderEffects;

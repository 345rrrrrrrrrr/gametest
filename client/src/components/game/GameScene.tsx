import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, Sky, Environment, Stats } from '@react-three/drei';
import { Perf } from 'r3f-perf';

// Import game components
import BallComponent from './BallComponent';
import ObstacleComponent from './ObstacleComponent';
import TerrainComponent from './TerrainComponent';
import PowerUps from './PowerUps';
import Lighting from './Lighting';
import PhysicsEngine from './PhysicsEngine';
import EffectsSystem from './EffectsSystem';
import LevelSystem from './LevelSystem';
import PlayerControls from './PlayerControls';
import CollisionSystem from './CollisionSystem';
import ScoreSystem from './ScoreSystem';

// Import game stores
import { useGameState } from '@/lib/stores/useGameState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useSettingsState } from '@/lib/stores/useSettingsState';
import { useCamera } from '@/hooks/useCamera';
import { useGameClock } from '@/hooks/useGameClock';
import { GamePhase } from '@/types/game';

const GameScene = () => {
  const { scene, camera } = useThree();
  const gamePhase = useGameState(state => state.phase);
  const showFPS = useSettingsState(state => state.settings.showFPS);
  const balls = usePlayerState(state => state.balls);
  const obstacles = useLevelState(state => state.obstacles);
  const terrain = useLevelState(state => state.terrain);
  const powerUps = useLevelState(state => state.powerUps);
  
  // Set up camera controls
  const { cameraTarget, updateCameraTarget } = useCamera();
  
  // Set up game clock
  const { tick } = useGameClock();
  
  // Performance monitoring
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);
  const fps = useRef(0);
  
  // Initialize scene
  useEffect(() => {
    // Set background
    scene.background = new THREE.Color('#111122');
    
    // Set fog
    scene.fog = new THREE.Fog('#111122', 50, 100);
    
    console.log('Game scene initialized');
  }, [scene]);
  
  // Game loop
  useFrame((state, delta) => {
    // Calculate FPS
    const currentTime = state.clock.elapsedTime;
    frameCount.current++;
    
    if (currentTime - lastFrameTime.current > 1) {
      fps.current = Math.round(frameCount.current / (currentTime - lastFrameTime.current));
      frameCount.current = 0;
      lastFrameTime.current = currentTime;
    }
    
    // Only update when game is playing
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Update game clock
    tick(delta);
    
    // Update camera position to follow targets
    updateCameraTarget(delta);
  });
  
  return (
    <>
      {/* Performance monitoring */}
      {showFPS && <Perf position="top-left" />}
      {showFPS && <Stats />}
      
      {/* Sky and environment */}
      <Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0.6} azimuth={0.25} />
      <Environment preset="sunset" />
      
      {/* Lighting setup */}
      <Lighting />
      
      {/* Physics engine (invisibly updates physics) */}
      <PhysicsEngine />
      
      {/* Game systems */}
      <LevelSystem />
      <PlayerControls />
      <CollisionSystem />
      <ScoreSystem />
      <EffectsSystem />
      
      {/* Game entities */}
      {terrain && <TerrainComponent terrain={terrain} />}
      
      {obstacles.map((obstacle, index) => (
        <ObstacleComponent key={obstacle.id} obstacle={obstacle} />
      ))}
      
      {balls.map((ball, index) => (
        <BallComponent key={ball.id} ball={ball} index={index} />
      ))}
      
      {/* Power-ups */}
      <PowerUps powerUps={powerUps} />
      
      {/* Helper objects */}
      <gridHelper args={[100, 100, '#444444', '#222222']} position={[0, 0.01, 0]} />
    </>
  );
};

export default GameScene;

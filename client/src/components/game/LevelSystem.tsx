import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '@/lib/stores/useGameState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useAudio } from '@/lib/stores/useAudio';
import { GamePhase, GameMode } from '@/types/game';
import { LevelData } from '@/types/level';
import { Ball, Terrain, Obstacle, PowerUp, Collectible } from '@/types/entities';
import { levels } from '@/lib/levels/levelDefinitions';
import { generateUUID } from '@/lib/utils/helpers';

const LevelSystem = () => {
  const { phase, mode, setPhase } = useGameState();
  const { 
    currentLevel, currentLevelIndex, setCurrentLevel, 
    setObstacles, setPowerUps, setTerrain, setCollectibles,
    setBoundaries
  } = useLevelState();
  const { createBall, resetBalls } = usePlayerState();
  const { resetScore, setTimeLeft } = useScoreState();
  const { playSuccess } = useAudio();
  
  // Timer for level completion check
  const checkTimer = useRef<number>(0);
  
  // Current level objectives status
  const objectivesRef = useRef<{[key: string]: number}>({});
  
  // Initialize the current level
  useEffect(() => {
    if (phase === GamePhase.PLAYING && currentLevelIndex >= 0 && !currentLevel) {
      loadLevel(levels[currentLevelIndex]);
    }
  }, [phase, currentLevelIndex, currentLevel]);
  
  // Check level completion
  useFrame((state, delta) => {
    if (phase !== GamePhase.PLAYING || !currentLevel) return;
    
    // Increment check timer
    checkTimer.current += delta;
    
    // Only check every 0.5 seconds to save performance
    if (checkTimer.current < 0.5) return;
    checkTimer.current = 0;
    
    // Check if level is completed based on mode
    switch (mode) {
      case GameMode.TIME_TRIAL:
        // In time trial, level is completed when time runs out
        break;
        
      case GameMode.PUZZLE:
        // In puzzle mode, check if all objectives are completed
        if (currentLevel.objectives.every(obj => {
          return objectivesRef.current[obj.id] >= obj.target;
        })) {
          completeLevel();
        }
        break;
        
      case GameMode.DESTRUCTION:
        // In destruction mode, check if all breakable obstacles are destroyed
        if (currentLevel.obstacles.filter(obj => obj.isBreakable).length === 0) {
          completeLevel();
        }
        break;
        
      case GameMode.SANDBOX:
        // Sandbox has no completion criteria
        break;
    }
  });
  
  // Load a level into the game
  const loadLevel = (levelData: LevelData) => {
    console.log(`Loading level: ${levelData.name}`);
    
    // Reset game state
    resetBalls();
    resetScore();
    objectivesRef.current = {};
    
    // Set level time if applicable
    if (levelData.settings.timeLimit) {
      setTimeLeft(levelData.settings.timeLimit);
    }
    
    // Set current level
    setCurrentLevel(levelData);
    
    // Create terrain
    const terrain: Terrain = {
      id: 'terrain',
      type: 'terrain',
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(1, 1, 1),
      visible: true,
      children: [],
      width: levelData.terrain.width,
      height: levelData.terrain.height,
      depth: levelData.terrain.depth,
      segments: levelData.terrain.segments,
      texture: new THREE.Texture(), // Placeholder, actual texture loaded in component
      update: () => {},
      destroy: () => {},
      getHeightAt: (x: number, z: number) => 0
    };
    setTerrain(terrain);
    
    // Create obstacles
    const obstacles: Obstacle[] = levelData.obstacles.map(obstacleDef => {
      return {
        id: obstacleDef.id || generateUUID(),
        type: 'obstacle',
        obstacleType: obstacleDef.type,
        position: obstacleDef.position.clone(),
        rotation: new THREE.Quaternion().setFromEuler(obstacleDef.rotation),
        scale: obstacleDef.scale.clone(),
        visible: true,
        color: obstacleDef.color || '#58a5f0',
        isBreakable: obstacleDef.isBreakable || false,
        health: obstacleDef.health || 100,
        isStatic: obstacleDef.physicsProperties?.isKinematic || true,
        children: [],
        update: () => {},
        destroy: () => {},
        damage: (amount: number) => {}
      };
    });
    setObstacles(obstacles);
    
    // Create power-ups
    const powerUps: PowerUp[] = levelData.powerUps.map(powerUpDef => {
      return {
        id: generateUUID(),
        type: 'powerup',
        powerUpType: powerUpDef.type,
        position: powerUpDef.position.clone(),
        rotation: new THREE.Quaternion().setFromEuler(powerUpDef.rotation),
        scale: new THREE.Vector3(1, 1, 1),
        visible: true,
        duration: powerUpDef.duration,
        strength: powerUpDef.strength,
        radius: powerUpDef.radius,
        children: [],
        isRespawning: false,
        respawnTime: powerUpDef.respawnTime,
        update: () => {},
        destroy: () => {},
        onPickup: (ball: Ball) => {}
      };
    });
    setPowerUps(powerUps);
    
    // Create collectibles if any
    if (levelData.collectibles) {
      const collectibles: Collectible[] = levelData.collectibles.positions.map(pos => {
        return {
          id: generateUUID(),
          type: 'collectible',
          collectibleType: levelData.collectibles?.type || 'coin',
          position: pos.clone(),
          rotation: new THREE.Quaternion(),
          scale: new THREE.Vector3(1, 1, 1),
          visible: true,
          value: levelData.collectibles?.value || 10,
          collected: false,
          children: [],
          update: () => {},
          destroy: () => {},
          onCollect: (ball: Ball) => {}
        };
      });
      setCollectibles(collectibles);
    } else {
      setCollectibles([]);
    }
    
    // Set level boundaries
    setBoundaries(levelData.boundaries);
    
    // Create initial balls at start positions
    levelData.startPoints.forEach((startPoint, index) => {
      if (index < 5) { // Limit initial balls to 5
        createBall(startPoint.position.clone(), startPoint.direction.clone());
      }
    });
    
    // Initialize objectives
    levelData.objectives.forEach(objective => {
      objectivesRef.current[objective.id] = 0;
    });
    
    console.log('Level loaded successfully');
  };
  
  // Complete the current level
  const completeLevel = () => {
    console.log('Level completed!');
    playSuccess();
    setPhase(GamePhase.LEVEL_COMPLETE);
    
    // Add level completion logic here (save progress, unlock next level, etc.)
  };
  
  return null; // This component doesn't render anything visually
};

export default LevelSystem;

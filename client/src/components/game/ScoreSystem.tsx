import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '@/lib/stores/useGameState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { GamePhase, GameMode } from '@/types/game';

const ScoreSystem = () => {
  const gamePhase = useGameState(state => state.phase);
  const gameMode = useGameState(state => state.mode);
  const setPhase = useGameState(state => state.setPhase);
  const { 
    score, setScore, 
    combo, setCombo, 
    timeLeft, setTimeLeft,
    addObstacleDestroyed, addPowerUpCollected, 
    addDistanceTraveled
  } = useScoreState();
  const balls = usePlayerState(state => state.balls);
  
  // Timers for score calculation
  const lastComboTime = useRef(0);
  const distanceTimer = useRef(0);
  const lastPositions = useRef<{[id: string]: {x: number, y: number, z: number}}>({});
  
  // Update score calculations each frame
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Update time-based score features
    lastComboTime.current += delta;
    
    // Reset combo if no points gained for a while
    if (lastComboTime.current > 3.0 && combo > 1) {
      setCombo(1);
    }
    
    // Calculate distance traveled by balls
    distanceTimer.current += delta;
    
    if (distanceTimer.current >= 0.5) {
      distanceTimer.current = 0;
      
      let totalDistance = 0;
      
      balls.forEach(ball => {
        const lastPos = lastPositions.current[ball.id];
        
        if (lastPos) {
          const dx = ball.position.x - lastPos.x;
          const dy = ball.position.y - lastPos.y;
          const dz = ball.position.z - lastPos.z;
          
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          totalDistance += distance;
        }
        
        // Update last position
        lastPositions.current[ball.id] = {
          x: ball.position.x,
          y: ball.position.y,
          z: ball.position.z
        };
      });
      
      // Add to total distance stat
      if (totalDistance > 0) {
        addDistanceTraveled(totalDistance);
      }
    }
    
    // Time Trial mode: handle timer
    if (gameMode === GameMode.TIME_TRIAL && timeLeft > 0) {
      setTimeLeft(timeLeft - delta);
      
      // End game when time runs out
      if (timeLeft <= 0) {
        setPhase(GamePhase.GAME_OVER);
      }
    }
  });
  
  return null; // This component doesn't render anything visually
};

export default ScoreSystem;

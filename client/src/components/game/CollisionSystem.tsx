import * as THREE from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '@/lib/stores/useGameState';
import { usePlayerState } from '@/lib/stores/usePlayerState';
import { useLevelState } from '@/lib/stores/useLevelState';
import { useScoreState } from '@/lib/stores/useScoreState';
import { useAudio } from '@/lib/stores/useAudio';
import { GamePhase, PowerUpType, ObstacleType } from '@/types/game';
import { useCollisions } from '@/hooks/useCollisions';
import debug from '@/lib/utils/debug';

const CollisionSystem = () => {
  const gamePhase = useGameState(state => state.phase);
  const balls = usePlayerState(state => state.balls);
  const updateBall = usePlayerState(state => state.updateBall);
  const applyPowerUpToBall = usePlayerState(state => state.applyPowerUpToBall);
  const obstacles = useLevelState(state => state.obstacles);
  const updateObstacle = useLevelState(state => state.updateObstacle);
  const removeObstacle = useLevelState(state => state.removeObstacle);
  const powerUps = useLevelState(state => state.powerUps);
  const updatePowerUp = useLevelState(state => state.updatePowerUp);
  const collectibles = useLevelState(state => state.collectibles);
  const updateCollectible = useLevelState(state => state.updateCollectible);
  const addScore = useScoreState(state => state.addScore);
  const { playHit } = useAudio();
  
  // Access collision detection functions
  const { checkBallObstacleCollision, checkBallPowerUpCollision, checkBallCollectibleCollision } = useCollisions();
  
  // Cooldown for collision sounds to prevent sound spam
  const soundCooldown = useRef(0);
  
  // Last frame positions for velocity calculation
  const lastPositions = useRef<{[id: string]: THREE.Vector3}>({});
  
  // Store last frame positions for all balls
  useEffect(() => {
    balls.forEach(ball => {
      if (!lastPositions.current[ball.id]) {
        lastPositions.current[ball.id] = ball.position.clone();
      }
    });
    
    return () => {
      lastPositions.current = {};
    };
  }, [balls]);
  
  // Process collisions each frame
  useFrame((state, delta) => {
    if (gamePhase !== GamePhase.PLAYING) return;
    
    // Decrement sound cooldown
    if (soundCooldown.current > 0) {
      soundCooldown.current -= delta;
    }
    
    // Check collision for each ball
    balls.forEach(ball => {
      // Skip held balls
      if (ball.isHeld) return;
      
      // Calculate velocity from position difference
      const lastPos = lastPositions.current[ball.id] || ball.position.clone();
      const velocity = new THREE.Vector3().subVectors(ball.position, lastPos).divideScalar(delta);
      const speed = velocity.length();
      
      // Update last position
      lastPositions.current[ball.id] = ball.position.clone();
      
      // Ball-Obstacle collisions
      obstacles.forEach(obstacle => {
        const collision = checkBallObstacleCollision(ball, obstacle);
        
        if (collision) {
          // Play hit sound if cooled down and ball is moving fast enough
          if (soundCooldown.current <= 0 && speed > 5) {
            playHit();
            soundCooldown.current = 0.1; // 100ms cooldown
          }
          
          // Handle different obstacle types
          switch (obstacle.obstacleType) {
            case ObstacleType.BREAKABLE:
              // Damage breakable obstacle based on impact speed
              const damage = Math.min(speed * 5, 50);
              const newHealth = Math.max(0, obstacle.health - damage);
              
              updateObstacle(obstacle.id, { health: newHealth });
              
              // Remove if fully destroyed
              if (newHealth <= 0) {
                removeObstacle(obstacle.id);
                addScore(100);
                
                // Spawn explosion effect at obstacle position
                if ((window as any).gameEffects) {
                  (window as any).gameEffects.spawnExplosion(
                    obstacle.position,
                    obstacle.color,
                    obstacle.scale.x
                  );
                }
              }
              break;
              
            case ObstacleType.BOUNCER:
              // Add extra bounce force
              const bounceForce = velocity.clone().negate().normalize().multiplyScalar(speed * 1.5);
              // This would need to be implemented with the physics system
              break;
              
            case ObstacleType.PORTAL:
              // Find another portal to teleport to
              const otherPortals = obstacles.filter(o => 
                o.id !== obstacle.id && o.obstacleType === ObstacleType.PORTAL
              );
              
              if (otherPortals.length > 0) {
                // Choose a random other portal
                const targetPortal = otherPortals[Math.floor(Math.random() * otherPortals.length)];
                
                // Teleport the ball
                const newPosition = targetPortal.position.clone().add(
                  new THREE.Vector3(0, ball.radius * 2, 0)
                );
                
                updateBall(ball.id, { position: newPosition });
                
                // Spawn effects
                if ((window as any).gameEffects) {
                  (window as any).gameEffects.spawnSpark(obstacle.position, '#9955FF');
                  (window as any).gameEffects.spawnSpark(newPosition, '#9955FF');
                }
              }
              break;
              
            default:
              // Standard collision handled by physics
              break;
          }
          
          debug.collision(`Ball ${ball.id} collided with obstacle ${obstacle.id}`);
        }
      });
      
      // Ball-PowerUp collisions
      powerUps.forEach(powerUp => {
        if (powerUp.isRespawning) return;
        
        const collision = checkBallPowerUpCollision(ball, powerUp);
        
        if (collision) {
          // Apply power-up effect to ball
          applyPowerUpToBall(ball.id, {
            type: powerUp.powerUpType,
            remainingTime: powerUp.duration,
            strength: powerUp.strength
          });
          
          // Add score and set power-up to respawning state
          addScore(50);
          
          if (powerUp.respawnTime) {
            updatePowerUp(powerUp.id, { 
              isRespawning: true,
              respawnCountdown: powerUp.respawnTime 
            });
          }
          
          // Play sound effect
          playHit();
          
          // Spawn effect
          if ((window as any).gameEffects) {
            let color = '#FFDD00'; // Default
            
            switch (powerUp.powerUpType) {
              case PowerUpType.SPEED_BOOST:
                color = '#FFDD00';
                break;
              case PowerUpType.GRAVITY_FLIP:
                color = '#9955FF';
                break;
              case PowerUpType.BALL_MULTIPLIER:
                color = '#00FFAA';
                break;
              case PowerUpType.EXPLOSIVE:
                color = '#FF0000';
                break;
              default:
                break;
            }
            
            (window as any).gameEffects.spawnSpark(powerUp.position, color);
          }
          
          debug.collision(`Ball ${ball.id} collected power-up ${powerUp.id}`);
        }
      });
      
      // Ball-Collectible collisions
      collectibles.forEach(collectible => {
        if (collectible.collected) return;
        
        const collision = checkBallCollectibleCollision(ball, collectible);
        
        if (collision) {
          // Mark collectible as collected
          updateCollectible(collectible.id, { collected: true });
          
          // Add score based on collectible value
          addScore(collectible.value);
          
          // Play sound effect
          playHit();
          
          // Spawn effect
          if ((window as any).gameEffects) {
            let color = '#FFDD00'; // Default gold color
            
            switch (collectible.collectibleType) {
              case 'star':
                color = '#FFDD00';
                break;
              case 'coin':
                color = '#FFBB00';
                break;
              case 'gem':
                color = '#00FFAA';
                break;
              default:
                break;
            }
            
            (window as any).gameEffects.spawnSpark(collectible.position, color);
          }
          
          debug.collision(`Ball ${ball.id} collected ${collectible.collectibleType}`);
        }
      });
    });
  });
  
  return null; // This component doesn't render anything visually
};

export default CollisionSystem;

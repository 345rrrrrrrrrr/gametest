import * as THREE from 'three';
import { GamePhase, GameMode, GameStats, PlayerProfile } from '../client/src/types/game';
import { LevelData, LevelObjective } from '../client/src/types/level';
import { levels } from '../client/src/lib/levels/levelDefinitions';

/**
 * Server-side game state management
 * Handles persistent game data, player profiles, and level progression
 */

interface GameSession {
  id: string;
  players: Map<string, PlayerState>;
  currentLevel: LevelData | null;
  gamePhase: GamePhase;
  gameMode: GameMode;
  startTime: number;
  endTime: number | null;
  scores: Map<string, number>;
  objectives: Map<string, LevelObjective>;
  isMultiplayer: boolean;
  maxPlayers: number;
}

interface PlayerState {
  id: string;
  profile: PlayerProfile;
  isConnected: boolean;
  lastActive: number;
  controlledBalls: string[];
  score: number;
  isReady: boolean;
}

class GameStateManager {
  private activeSessions: Map<string, GameSession>;
  private playerProfiles: Map<string, PlayerProfile>;
  
  constructor() {
    this.activeSessions = new Map();
    this.playerProfiles = new Map();
  }
  
  // Create a new game session
  createSession(playerId: string, isMultiplayer: boolean = false): string {
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Get or create player profile
    const profile = this.getPlayerProfile(playerId);
    
    // Create player state
    const playerState: PlayerState = {
      id: playerId,
      profile,
      isConnected: true,
      lastActive: Date.now(),
      controlledBalls: [],
      score: 0,
      isReady: false
    };
    
    // Create session
    const session: GameSession = {
      id: sessionId,
      players: new Map([[playerId, playerState]]),
      currentLevel: null,
      gamePhase: GamePhase.MENU,
      gameMode: GameMode.SANDBOX,
      startTime: Date.now(),
      endTime: null,
      scores: new Map([[playerId, 0]]),
      objectives: new Map(),
      isMultiplayer,
      maxPlayers: isMultiplayer ? 4 : 1
    };
    
    this.activeSessions.set(sessionId, session);
    return sessionId;
  }
  
  // Get an existing session
  getSession(sessionId: string): GameSession | null {
    return this.activeSessions.get(sessionId) || null;
  }
  
  // Join an existing session (for multiplayer)
  joinSession(sessionId: string, playerId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isMultiplayer) return false;
    
    // Check if session is full
    if (session.players.size >= session.maxPlayers) return false;
    
    // Get or create player profile
    const profile = this.getPlayerProfile(playerId);
    
    // Create player state
    const playerState: PlayerState = {
      id: playerId,
      profile,
      isConnected: true,
      lastActive: Date.now(),
      controlledBalls: [],
      score: 0,
      isReady: false
    };
    
    session.players.set(playerId, playerState);
    session.scores.set(playerId, 0);
    
    return true;
  }
  
  // Leave a session
  leaveSession(sessionId: string, playerId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    // Remove player from session
    session.players.delete(playerId);
    session.scores.delete(playerId);
    
    // If no players left, clean up the session
    if (session.players.size === 0) {
      this.cleanupSession(sessionId);
    }
    
    return true;
  }
  
  // Set the current level for a session
  setSessionLevel(sessionId: string, levelIndex: number): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    // Validate level index
    if (levelIndex < 0 || levelIndex >= levels.length) return false;
    
    session.currentLevel = levels[levelIndex];
    
    // Reset objectives based on level
    session.objectives.clear();
    session.currentLevel.objectives.forEach(objective => {
      session.objectives.set(objective.id, {
        ...objective,
        progressCurrent: 0
      });
    });
    
    return true;
  }
  
  // Set game mode for a session
  setSessionGameMode(sessionId: string, mode: GameMode): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    // Verify level supports this mode
    if (session.currentLevel && 
        !session.currentLevel.supportedGameModes.includes(mode)) {
      return false;
    }
    
    session.gameMode = mode;
    return true;
  }
  
  // Update game phase
  setSessionPhase(sessionId: string, phase: GamePhase): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    session.gamePhase = phase;
    
    // Handle phase transitions
    if (phase === GamePhase.PLAYING) {
      session.startTime = Date.now();
      session.endTime = null;
      
      // Reset player scores
      session.players.forEach((player) => {
        session.scores.set(player.id, 0);
      });
    } else if (phase === GamePhase.GAME_OVER || phase === GamePhase.LEVEL_COMPLETE) {
      session.endTime = Date.now();
      
      // Save player progress
      this.savePlayerProgress(session);
    }
    
    return true;
  }
  
  // Update player score
  updatePlayerScore(sessionId: string, playerId: string, score: number): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    session.scores.set(playerId, score);
    return true;
  }
  
  // Update objective progress
  updateObjectiveProgress(
    sessionId: string, 
    objectiveId: string, 
    progress: number
  ): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    const objective = session.objectives.get(objectiveId);
    if (!objective) return false;
    
    // Update progress (don't exceed target)
    objective.progressCurrent = Math.min(objective.target, progress);
    session.objectives.set(objectiveId, objective);
    
    return true;
  }
  
  // Get player profile, create if doesn't exist
  getPlayerProfile(playerId: string): PlayerProfile {
    let profile = this.playerProfiles.get(playerId);
    
    if (!profile) {
      profile = {
        name: `Player ${playerId.substring(0, 5)}`,
        selectedBall: 'default',
        unlockedBalls: ['default'],
        unlockedLevels: [0], // Start with only first level unlocked
        levelProgress: [],
        stats: {
          ballsCreated: 0,
          obstaclesDestroyed: 0,
          powerUpsCollected: 0,
          distanceTraveled: 0,
          jumpsPerformed: 0,
          timeSpentInAir: 0,
          highestPoint: 0,
          fastestSpeed: 0,
          longestChain: 0,
          totalPlayTime: 0
        },
        settings: {
          soundVolume: 0.7,
          musicVolume: 0.5,
          particleCount: 1000,
          shadowQuality: 'medium',
          effectsQuality: 'medium',
          cameraShake: true,
          showFPS: false,
          controlType: 'keyboard',
          mouseSensitivity: 0.5,
          invertY: false,
          invertX: false
        },
        totalScore: 0,
        achievements: []
      };
      
      this.playerProfiles.set(playerId, profile);
    }
    
    return profile;
  }
  
  // Update player profile
  updatePlayerProfile(playerId: string, updates: Partial<PlayerProfile>): boolean {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return false;
    
    // Update allowed fields
    if (updates.name) profile.name = updates.name;
    if (updates.selectedBall) profile.selectedBall = updates.selectedBall;
    if (updates.settings) profile.settings = { ...profile.settings, ...updates.settings };
    
    this.playerProfiles.set(playerId, profile);
    return true;
  }
  
  // Save player progress after completing a level
  private savePlayerProgress(session: GameSession): void {
    if (!session.currentLevel) return;
    
    session.players.forEach((player, playerId) => {
      const profile = this.getPlayerProfile(playerId);
      const levelId = session.currentLevel!.id;
      const score = session.scores.get(playerId) || 0;
      
      // Calculate stars based on score thresholds
      let stars = 0;
      if (score >= session.currentLevel!.scoreThresholds.gold) {
        stars = 3;
      } else if (score >= session.currentLevel!.scoreThresholds.silver) {
        stars = 2;
      } else if (score >= session.currentLevel!.scoreThresholds.bronze) {
        stars = 1;
      }
      
      // Find existing progress or create new
      let levelProgress = profile.levelProgress.find(p => p.levelId === levelId);
      
      if (!levelProgress) {
        levelProgress = {
          levelId,
          completed: false,
          score: 0,
          stars: 0,
          time: 0,
          objectives: session.currentLevel!.objectives.map(obj => ({
            id: obj.id,
            completed: false
          }))
        };
        profile.levelProgress.push(levelProgress);
      }
      
      // Update only if better
      if (score > levelProgress.score) {
        levelProgress.score = score;
        levelProgress.completed = true;
        
        // Only update stars if new amount is higher
        if (stars > levelProgress.stars) {
          levelProgress.stars = stars;
        }
        
        // Update time if better (lower)
        const sessionTime = (session.endTime || Date.now()) - session.startTime;
        if (levelProgress.time === 0 || sessionTime < levelProgress.time) {
          levelProgress.time = sessionTime;
        }
        
        // Update objectives completion
        levelProgress.objectives = session.currentLevel!.objectives.map(obj => {
          const sessionObj = session.objectives.get(obj.id);
          const completed = sessionObj 
            ? sessionObj.progressCurrent >= sessionObj.target
            : false;
          
          return {
            id: obj.id,
            completed
          };
        });
        
        // Update total score
        profile.totalScore = profile.levelProgress.reduce(
          (total, progress) => total + progress.score, 
          0
        );
        
        // Unlock next level if completed with at least 1 star
        if (stars > 0) {
          const nextLevelId = levelId + 1;
          if (!profile.unlockedLevels.includes(nextLevelId)) {
            profile.unlockedLevels.push(nextLevelId);
          }
        }
        
        // Save updated profile
        this.playerProfiles.set(playerId, profile);
      }
    });
  }
  
  // Clean up inactive sessions
  private cleanupSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }
  
  // Periodic cleanup of old sessions
  cleanupInactiveSessions(): void {
    const now = Date.now();
    this.activeSessions.forEach((session, id) => {
      // Check if session has been inactive for more than 1 hour
      const lastActive = Array.from(session.players.values())
        .reduce((latest, player) => Math.max(latest, player.lastActive), 0);
      
      if (now - lastActive > 60 * 60 * 1000) {
        this.cleanupSession(id);
      }
    });
  }
}

// Create and export the game state manager instance
const gameStateManager = new GameStateManager();
export default gameStateManager;

import { Request, Response } from 'express';
import gameEngine from '../engine';
import gameStateManager from '../gameState';
import { GamePhase, GameMode } from '../../client/src/types/game';
import { levels } from '../../client/src/lib/levels/levelDefinitions';

// Controller for game-related operations
const gameController = {
  // Create a new game session
  createSession: (req: Request, res: Response) => {
    try {
      const { playerId, isMultiplayer = false } = req.body;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      const sessionId = gameStateManager.createSession(playerId, isMultiplayer);
      
      return res.status(201).json({ 
        sessionId,
        message: 'Game session created successfully' 
      });
    } catch (error: any) {
      console.error('Error creating game session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Join an existing game session
  joinSession: (req: Request, res: Response) => {
    try {
      const { sessionId, playerId } = req.body;
      
      if (!sessionId || !playerId) {
        return res.status(400).json({ error: 'Session ID and Player ID are required' });
      }
      
      const joined = gameStateManager.joinSession(sessionId, playerId);
      
      if (!joined) {
        return res.status(404).json({ error: 'Session not found or full' });
      }
      
      return res.status(200).json({
        message: 'Joined game session successfully'
      });
    } catch (error: any) {
      console.error('Error joining game session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Leave a game session
  leaveSession: (req: Request, res: Response) => {
    try {
      const { sessionId, playerId } = req.body;
      
      if (!sessionId || !playerId) {
        return res.status(400).json({ error: 'Session ID and Player ID are required' });
      }
      
      const left = gameStateManager.leaveSession(sessionId, playerId);
      
      if (!left) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      return res.status(200).json({
        message: 'Left game session successfully'
      });
    } catch (error: any) {
      console.error('Error leaving game session:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Set up a level
  setLevel: (req: Request, res: Response) => {
    try {
      const { sessionId, levelIndex } = req.body;
      
      if (!sessionId || levelIndex === undefined) {
        return res.status(400).json({ error: 'Session ID and level index are required' });
      }
      
      // Validate level index
      if (levelIndex < 0 || levelIndex >= levels.length) {
        return res.status(400).json({ error: 'Invalid level index' });
      }
      
      const success = gameStateManager.setSessionLevel(sessionId, levelIndex);
      
      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Initialize the game engine with the level
      const session = gameStateManager.getSession(sessionId);
      if (session && session.currentLevel) {
        gameEngine.initialize(session.currentLevel, session.gameMode);
      }
      
      return res.status(200).json({
        message: 'Level set successfully',
        level: levels[levelIndex].name
      });
    } catch (error: any) {
      console.error('Error setting level:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Set game mode
  setGameMode: (req: Request, res: Response) => {
    try {
      const { sessionId, gameMode } = req.body;
      
      if (!sessionId || !gameMode) {
        return res.status(400).json({ error: 'Session ID and game mode are required' });
      }
      
      // Validate game mode
      if (!Object.values(GameMode).includes(gameMode as GameMode)) {
        return res.status(400).json({ error: 'Invalid game mode' });
      }
      
      const success = gameStateManager.setSessionGameMode(sessionId, gameMode as GameMode);
      
      if (!success) {
        return res.status(404).json({ 
          error: 'Session not found or game mode not supported for current level' 
        });
      }
      
      // Update game engine
      const session = gameStateManager.getSession(sessionId);
      if (session && session.currentLevel) {
        gameEngine.gameMode = gameMode as GameMode;
      }
      
      return res.status(200).json({
        message: 'Game mode set successfully',
        gameMode
      });
    } catch (error: any) {
      console.error('Error setting game mode:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Start the game
  startGame: (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      const success = gameStateManager.setSessionPhase(sessionId, GamePhase.PLAYING);
      
      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update game engine
      gameEngine.gamePhase = GamePhase.PLAYING;
      
      return res.status(200).json({
        message: 'Game started successfully'
      });
    } catch (error: any) {
      console.error('Error starting game:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Pause the game
  pauseGame: (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      const success = gameStateManager.setSessionPhase(sessionId, GamePhase.PAUSED);
      
      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update game engine
      gameEngine.gamePhase = GamePhase.PAUSED;
      
      return res.status(200).json({
        message: 'Game paused successfully'
      });
    } catch (error: any) {
      console.error('Error pausing game:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // End the game
  endGame: (req: Request, res: Response) => {
    try {
      const { sessionId, gamePhase = GamePhase.GAME_OVER } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      // Validate game phase (only GAME_OVER or LEVEL_COMPLETE are valid end states)
      if (gamePhase !== GamePhase.GAME_OVER && gamePhase !== GamePhase.LEVEL_COMPLETE) {
        return res.status(400).json({ error: 'Invalid end game phase' });
      }
      
      const success = gameStateManager.setSessionPhase(sessionId, gamePhase as GamePhase);
      
      if (!success) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Update game engine
      gameEngine.gamePhase = gamePhase as GamePhase;
      
      return res.status(200).json({
        message: 'Game ended successfully',
        phase: gamePhase
      });
    } catch (error: any) {
      console.error('Error ending game:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Create a ball
  createBall: (req: Request, res: Response) => {
    try {
      const { sessionId, position, velocity } = req.body;
      
      if (!sessionId || !position || !velocity) {
        return res.status(400).json({ 
          error: 'Session ID, position, and velocity are required' 
        });
      }
      
      // Get session
      const session = gameStateManager.getSession(sessionId);
      if (!session || session.gamePhase !== GamePhase.PLAYING) {
        return res.status(400).json({ 
          error: 'Session not found or game not in playing state' 
        });
      }
      
      // Create ball in game engine
      const ballId = gameEngine.createBall(
        new THREE.Vector3(position.x, position.y, position.z),
        new THREE.Vector3(velocity.x, velocity.y, velocity.z)
      );
      
      return res.status(201).json({
        message: 'Ball created successfully',
        ballId
      });
    } catch (error: any) {
      console.error('Error creating ball:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Apply force to a ball
  applyForce: (req: Request, res: Response) => {
    try {
      const { sessionId, ballId, force } = req.body;
      
      if (!sessionId || !ballId || !force) {
        return res.status(400).json({ 
          error: 'Session ID, ball ID, and force are required' 
        });
      }
      
      // Get session
      const session = gameStateManager.getSession(sessionId);
      if (!session || session.gamePhase !== GamePhase.PLAYING) {
        return res.status(400).json({ 
          error: 'Session not found or game not in playing state' 
        });
      }
      
      // Apply input to game engine
      gameEngine.applyInputs({
        applyForce: true,
        ballId,
        force: [force.x, force.y, force.z]
      });
      
      return res.status(200).json({
        message: 'Force applied successfully'
      });
    } catch (error: any) {
      console.error('Error applying force:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get game state
  getGameState: (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }
      
      // Get session
      const session = gameStateManager.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // Get engine state
      const engineState = gameEngine.getState();
      
      // Combine with session state
      const gameState = {
        gamePhase: session.gamePhase,
        gameMode: session.gameMode,
        levelId: session.currentLevel?.id,
        levelName: session.currentLevel?.name,
        players: Array.from(session.players.entries()).map(([id, player]) => ({
          id: player.id,
          name: player.profile.name,
          score: session.scores.get(id) || 0,
          isReady: player.isReady
        })),
        objectives: Array.from(session.objectives.entries()).map(([id, objective]) => ({
          id: objective.id,
          name: objective.name,
          target: objective.target,
          current: objective.progressCurrent,
          completed: objective.progressCurrent >= objective.target
        })),
        balls: engineState.balls,
        obstacles: engineState.obstacles,
        powerUps: engineState.powerUps
      };
      
      return res.status(200).json(gameState);
    } catch (error: any) {
      console.error('Error getting game state:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Update player profile
  updateProfile: (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const updates = req.body;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Update profile
      const success = gameStateManager.updatePlayerProfile(playerId, updates);
      
      if (!success) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      return res.status(200).json({
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get player profile
  getProfile: (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Get profile
      const profile = gameStateManager.getPlayerProfile(playerId);
      
      return res.status(200).json(profile);
    } catch (error: any) {
      console.error('Error getting profile:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  // Get available levels
  getLevels: (_req: Request, res: Response) => {
    try {
      // Return simplified level data
      const levelData = levels.map(level => ({
        id: level.id,
        name: level.name,
        description: level.description,
        difficulty: level.difficulty,
        supportedGameModes: level.supportedGameModes,
        timeToComplete: level.timeToComplete,
        scoreThresholds: level.scoreThresholds
      }));
      
      return res.status(200).json(levelData);
    } catch (error: any) {
      console.error('Error getting levels:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default gameController;

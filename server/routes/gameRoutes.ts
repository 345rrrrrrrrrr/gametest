import { Router } from 'express';
import gameController from '../controllers/gameController';

const router = Router();

// Session management
router.post('/sessions', gameController.createSession);
router.post('/sessions/join', gameController.joinSession);
router.post('/sessions/leave', gameController.leaveSession);

// Game setup
router.post('/sessions/:sessionId/level', gameController.setLevel);
router.post('/sessions/:sessionId/mode', gameController.setGameMode);

// Game control
router.post('/sessions/:sessionId/start', gameController.startGame);
router.post('/sessions/:sessionId/pause', gameController.pauseGame);
router.post('/sessions/:sessionId/end', gameController.endGame);

// Game actions
router.post('/sessions/:sessionId/balls', gameController.createBall);
router.post('/sessions/:sessionId/balls/:ballId/force', gameController.applyForce);

// Game state
router.get('/sessions/:sessionId/state', gameController.getGameState);

// Player profiles
router.get('/players/:playerId/profile', gameController.getProfile);
router.put('/players/:playerId/profile', gameController.updateProfile);

// Levels
router.get('/levels', gameController.getLevels);

export default router;

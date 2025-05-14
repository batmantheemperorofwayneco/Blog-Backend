import express from 'express';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  getCurrentUser 
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/me', authenticate, getCurrentUser);

export default router;
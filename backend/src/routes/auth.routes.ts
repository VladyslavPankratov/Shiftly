import { Router } from 'express';
import { register, login, getCurrentUser, refreshToken, logout, logoutAll } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authMiddleware, logoutAll);
router.get('/me', authMiddleware, getCurrentUser);

export default router;

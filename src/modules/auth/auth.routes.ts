// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from './auth.middleware.js';


const router = Router();

// Public routes
router.post('/register', AuthController.registerUser);
router.post('/login', AuthController.loginUser);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.use(authMiddleware);
router.post('/change-password', AuthController.changePassword);
router.post('/logout', AuthController.logout);
router.get('/profile', AuthController.getProfile);

export const AuthRoutes = router;
import express from 'express';
import {
  forgotPassword,
  githubOAuth,
  googleOAuth,
  login,
  logout,
  refreshToken,
  resetPassword,
  signup,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.post('/auth/logout', logout);
router.post('/auth/refresh', refreshToken);
router.post('/auth/forgot-password', forgotPassword);
router.get('/auth/google', googleOAuth);
router.get('/auth/github', githubOAuth);
router.post('/auth/reset-password', authMiddleware, resetPassword);

export default router;

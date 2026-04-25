import express from 'express';
import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  signup,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.post('/auth/logout', logout);
router.post('/auth/refresh', refreshToken);
router.post('/auth/forgot-password', forgotPassword);

export default router;

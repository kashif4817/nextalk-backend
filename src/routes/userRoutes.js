import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getMe,
  getUserProfile,
  searchUsers,
  setUsername,
  updateProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.get('/users/me', authMiddleware, getMe);
router.get('/users/search', authMiddleware, searchUsers);
router.get('/users/:id', getUserProfile);
router.put('/users/me', authMiddleware, updateProfile);
router.put('/users/me/username', authMiddleware, setUsername);

export default router;

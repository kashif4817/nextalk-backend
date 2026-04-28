import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getMe,
  getAllUsers,
  getUserProfile,
  searchUsers,
  setUsername,
  updatePresence,
  updatePrivacy,
  updateProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.get('/users/me', authMiddleware, getMe);
router.get('/users/search', authMiddleware, searchUsers);
router.get('/users/all', authMiddleware, getAllUsers);
router.get('/users/:id', getUserProfile);
router.put('/users/me', authMiddleware, updateProfile);
router.put('/users/me/username', authMiddleware, setUsername);
router.put('/users/me/privacy', authMiddleware, updatePrivacy);
router.put('/users/me/presence', authMiddleware, updatePresence);

export default router;

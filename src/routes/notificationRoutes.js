import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markAllRead,
  markOneRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', authMiddleware, getNotifications);
router.put('/notifications/read-all', authMiddleware, markAllRead);
router.put('/notifications/:id/read', authMiddleware, markOneRead);

export default router;

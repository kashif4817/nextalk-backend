import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  deleteMessage,
  editMessage,
  forwardMessage,
  getMessages,
  pinMessage,
  sendMessage,
  unpinMessage,
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/messages/:convId', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.put('/messages/:id', authMiddleware, editMessage);
router.delete('/messages/:id', authMiddleware, deleteMessage);
router.post('/messages/:id/pin', authMiddleware, pinMessage);
router.post('/messages/:id/unpin', authMiddleware, unpinMessage);
router.post('/messages/:id/forward', authMiddleware, forwardMessage);

export default router;

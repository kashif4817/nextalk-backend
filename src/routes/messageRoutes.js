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
import {
  getReactions,
  getSeenBy,
  getStarredMessages,
  markSeen,
  reactToMessage,
  removeReaction,
  starMessage,
  unstarMessage,
} from '../controllers/reactionController.js';

const router = express.Router();

router.get('/starred', authMiddleware, getStarredMessages);

router.get('/messages/:convId', authMiddleware, getMessages);
router.post('/messages', authMiddleware, sendMessage);
router.put('/messages/:id', authMiddleware, editMessage);
router.delete('/messages/:id', authMiddleware, deleteMessage);
router.post('/messages/:id/pin', authMiddleware, pinMessage);
router.post('/messages/:id/unpin', authMiddleware, unpinMessage);
router.post('/messages/:id/forward', authMiddleware, forwardMessage);
router.post('/messages/:id/seen', authMiddleware, markSeen);
router.get('/messages/:id/seen', authMiddleware, getSeenBy);
router.post('/messages/:id/react', authMiddleware, reactToMessage);
router.delete('/messages/:id/react', authMiddleware, removeReaction);
router.get('/messages/:id/reactions', authMiddleware, getReactions);
router.post('/messages/:id/star', authMiddleware, starMessage);
router.delete('/messages/:id/star', authMiddleware, unstarMessage);

export default router;

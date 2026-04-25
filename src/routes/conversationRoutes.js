import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createGroup,
  createOrGetDM,
  getAllConversations,
  getConversation,
  updateGroupInfo,
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getAllConversations);
router.get('/conversations/:id', authMiddleware, getConversation);
router.post('/conversations/dm', authMiddleware, createOrGetDM);
router.post('/conversations/group', authMiddleware, createGroup);
router.put('/conversations/:id/group-info', authMiddleware, updateGroupInfo);

export default router;

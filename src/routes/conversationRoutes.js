import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  createGroup,
  createOrGetDM,
  getAllConversations,
  getConversation,
  updateGroupInfo,
  archiveConversation,
  unarchiveConversation,
  pinConversation,
  unpinConversation,
  muteConversation,
  unmuteConversation,
  clearChat,
  markRead,
  deleteForMe,
  leaveGroup,
  addMember,
  removeMember,
  changeRole,
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/conversations', authMiddleware, getAllConversations);
router.post('/conversations/dm', authMiddleware, createOrGetDM);
router.post('/conversations/group', authMiddleware, createGroup);
router.get('/conversations/:id', authMiddleware, getConversation);
router.put('/conversations/:id/group-info', authMiddleware, updateGroupInfo);
router.post('/conversations/:id/archive', authMiddleware, archiveConversation);
router.post('/conversations/:id/unarchive', authMiddleware, unarchiveConversation);
router.post('/conversations/:id/pin', authMiddleware, pinConversation);
router.post('/conversations/:id/unpin', authMiddleware, unpinConversation);
router.post('/conversations/:id/mute', authMiddleware, muteConversation);
router.post('/conversations/:id/unmute', authMiddleware, unmuteConversation);
router.post('/conversations/:id/clear', authMiddleware, clearChat);
router.post('/conversations/:id/read', authMiddleware, markRead);
router.post('/conversations/:id/leave', authMiddleware, leaveGroup);
router.post('/conversations/:id/members', authMiddleware, addMember);
router.delete('/conversations/:id/members/:userId', authMiddleware, removeMember);
router.patch('/conversations/:id/members/:userId/role', authMiddleware, changeRole);
router.delete('/conversations/:id', authMiddleware, deleteForMe);

export default router;

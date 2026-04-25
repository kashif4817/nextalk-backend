import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
} from '../controllers/blockController.js';

const router = express.Router();

router.get('/blocks', authMiddleware, getBlockedUsers);
router.post('/blocks', authMiddleware, blockUser);
router.delete('/blocks/:id', authMiddleware, unblockUser);

export default router;

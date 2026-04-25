import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { forgotPassword, login, logout, refreshToken, signup } from '../controllers/authController.js';
import { getMe, getUserProfile, searchUsers, setUsername, updateProfile } from '../controllers/profileController.js';
import { addContact, getContacts, removeContact, updateContact } from '../controllers/contactController.js';
import { blockUser, getBlockedUsers, unblockUser } from '../controllers/blockController.js';
import { createGroup, createOrGetDM, getAllConversations, getConversation, updateGroupInfo } from '../controllers/conversationController.js';

const router = express.Router();

//authController
router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.post('/auth/logout',logout)
router.post('/auth/refresh',refreshToken)
router.post('/auth/forgot-password',forgotPassword)


//profileController
router.get('/users/me',authMiddleware,getMe);
router.get('/users/search',authMiddleware,searchUsers)
router.get('/users/:id',getUserProfile);
router.put('/users/me', authMiddleware, updateProfile);
router.put('/users/me/username', authMiddleware, setUsername);


// contactController
router.get('/contacts', authMiddleware, getContacts);
router.post('/contacts', authMiddleware, addContact);
router.patch('/contacts/:id', authMiddleware, updateContact);
router.delete('/contacts/:id', authMiddleware, removeContact);


//blockController
router.get('/blocks', authMiddleware, getBlockedUsers);
router.post('/blocks', authMiddleware, blockUser);
router.delete('/blocks/:id', authMiddleware, unblockUser);


// conversationController
router.get('/conversations', authMiddleware, getAllConversations);
router.get('/conversations/:id', authMiddleware, getConversation);
router.post('/conversations/dm', authMiddleware, createOrGetDM);
router.post('/conversations/group', authMiddleware, createGroup);
router.put('/conversations/:id/group-info', authMiddleware, updateGroupInfo);

export default router


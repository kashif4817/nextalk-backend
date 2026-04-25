import express from 'express'
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { forgotPassword, login, logout, refreshToken, signup } from '../controllers/authController.js';
import { getMe, getUserProfile, searchUsers, setUsername, updateProfile } from '../controllers/profileController.js';
import { createConversation, getSingleConversation } from '../controllers/conversationController.js';

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



//userController
// router.get('/users/search',authMiddleware,searchUsers)
// router.get('/users/:id',authMiddleware,getUserProfile)



router.post('/conversation/create',authMiddleware,createConversation)
router.get('/conversations/:id',authMiddleware,getSingleConversation)

export default router


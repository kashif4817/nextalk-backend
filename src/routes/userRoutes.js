import express from 'express'
import { getUserProfile, searchUsers } from '../controllers/userController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { forgotPassword, login, logout, refreshToken, signup } from '../controllers/authController.js';
import { createConversation, getSingleConversation } from '../controllers/conversationController.js';

const router = express.Router();
//authController
router.post('/auth/login', login);
router.post('/auth/signup', signup);
router.post('/auth/logout',logout)
router.post('/auth/refresh',refreshToken)
router.post('/auth/forgot-password',forgotPassword)

//userController
router.get('/users/search',authMiddleware,searchUsers)
router.get('/users/:id',authMiddleware,getUserProfile)



router.post('/conversation/create',authMiddleware,createConversation)
router.get('/conversations/:id',authMiddleware,getSingleConversation)

export default router


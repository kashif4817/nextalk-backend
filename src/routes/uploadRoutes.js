import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadImage, uploadFile, uploadAudio } from '../middlewares/uploadMiddleware.js';
import {
  uploadImageController,
  uploadFileController,
  uploadAudioController,
} from '../controllers/uploadController.js';

const router = express.Router();

router.post('/upload/image', authMiddleware, uploadImage, uploadImageController);
router.post('/upload/file', authMiddleware, uploadFile, uploadFileController);
router.post('/upload/audio', authMiddleware, uploadAudio, uploadAudioController);

export default router;

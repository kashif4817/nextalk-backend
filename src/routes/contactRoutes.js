import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  addContact,
  getContacts,
  removeContact,
  updateContact,
} from '../controllers/contactController.js';

const router = express.Router();

router.get('/contacts', authMiddleware, getContacts);
router.post('/contacts', authMiddleware, addContact);
router.patch('/contacts/:contact_id', authMiddleware, updateContact);
router.delete('/contacts/:contact_id', authMiddleware, removeContact);

export default router;

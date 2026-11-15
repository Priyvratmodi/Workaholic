import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  updatePreferences,
  updateProfile,
  getUserActivity,
  getUserCards,
} from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);

router.patch('/me/preferences', updatePreferences);
router.patch('/me/profile', updateProfile);
router.get('/me/activity', getUserActivity);
router.get('/me/cards', getUserCards);

export default router;

import { Router } from 'express';
import { 
  getUserLearningPreferences,
  updateLearningPreference,
  deleteLearningPreference
} from '../controllers/learningPreference.controller';
import { requireAuth } from '../middlewares/clerk.middleware';

const router = Router();

// Get learning preferences for a user
router.get('/user/:userId', requireAuth, getUserLearningPreferences);

// Create or update learning preference
router.post('/user/:userId', requireAuth, updateLearningPreference);

// Delete learning preference
router.delete('/:preferenceId', requireAuth, deleteLearningPreference);

export default router; 
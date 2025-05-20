import { Router } from 'express';
import { 
  getUserLearningPreferences,
  updateLearningPreference,
  deleteLearningPreference
} from '../controllers/learningPreference.controller';

const router = Router();

// Get learning preferences for a user
router.get('/user/:userId', getUserLearningPreferences);

// Create or update learning preference
router.post('/user/:userId', updateLearningPreference);

// Delete learning preference
router.delete('/:preferenceId', deleteLearningPreference);

export default router; 
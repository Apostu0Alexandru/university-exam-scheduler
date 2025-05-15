import { Router } from 'express';
import { 
  getUserRecommendations,
  getUserCourseRecommendations,
  createRecommendation,
  markRecommendationCompleted,
  deleteRecommendation,
  generateRecommendationsForUser
} from '../controllers/recommendation.controller';
import { requireAuth, requireRole } from '../middlewares/clerk.middleware';

const router = Router();

// User-specific recommendations
router.get('/user/:userId', requireAuth, getUserRecommendations);
router.get('/user/:userId/course/:courseId', requireAuth, getUserCourseRecommendations);

// Mark recommendation as completed (student can do this)
router.patch('/:id/complete', requireAuth, markRecommendationCompleted);

// Admin routes
router.post('/', requireAuth, requireRole(['ADMIN']), createRecommendation);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), deleteRecommendation);

// Generate recommendations for a user (automatic or admin-triggered)
router.post('/generate/:userId', requireAuth, generateRecommendationsForUser);

export default router; 
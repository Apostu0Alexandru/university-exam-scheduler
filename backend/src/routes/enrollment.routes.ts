import { Router } from 'express';
import { 
  getUserEnrollments,
  enrollUserInCourse,
  unenrollUserFromCourse,
  getAvailableCourses
} from '../controllers/enrollment.controller';
import { requireAuth } from '../middlewares/clerk.middleware';

const router = Router();

// Get all enrollments for a user
router.get('/user/:userId', requireAuth, getUserEnrollments);

// Get available courses for enrollment
router.get('/available-courses', requireAuth, getAvailableCourses);

// Enroll a user in a course
router.post('/user/:userId', requireAuth, enrollUserInCourse);

// Unenroll a user from a course
router.delete('/:enrollmentId', requireAuth, unenrollUserFromCourse);

export default router; 
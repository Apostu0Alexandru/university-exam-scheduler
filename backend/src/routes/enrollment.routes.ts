import { Router } from 'express';
import { 
  getUserEnrollments,
  enrollUserInCourse,
  unenrollUserFromCourse,
  getAvailableCourses
} from '../controllers/enrollment.controller';

const router = Router();

// Get all enrollments for a user
router.get('/user/:userId', getUserEnrollments);

// Get available courses for enrollment
router.get('/available-courses', getAvailableCourses);

// Enroll a user in a course
router.post('/user/:userId', enrollUserInCourse);

// Unenroll a user from a course
router.delete('/:enrollmentId', unenrollUserFromCourse);

export default router; 
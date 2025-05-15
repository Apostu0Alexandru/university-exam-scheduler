import { Router } from 'express';
import { 
  getAllExams,
  getExamById,
  getExamsByCourse,
  getExamsForUser,
  createExam,
  updateExam,
  deleteExam
} from '../controllers/exam.controller';
import { requireAuth, requireRole } from '../middlewares/clerk.middleware';

const router = Router();

// Public routes
router.get('/', getAllExams);
router.get('/:id', getExamById);
router.get('/course/:courseId', getExamsByCourse);
router.get('/user/:userId', requireAuth, getExamsForUser);

// Protected routes (admin only)
router.post('/', requireAuth, requireRole(['ADMIN']), createExam);
router.put('/:id', requireAuth, requireRole(['ADMIN']), updateExam);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), deleteExam);

export default router; 
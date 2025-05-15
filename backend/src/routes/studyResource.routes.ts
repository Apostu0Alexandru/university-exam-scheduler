import { Router } from 'express';
import { 
  getAllStudyResources,
  getStudyResourceById,
  getStudyResourcesByCourse,
  createStudyResource,
  updateStudyResource,
  deleteStudyResource
} from '../controllers/studyResource.controller';
import { requireAuth, requireRole } from '../middlewares/clerk.middleware';

const router = Router();

// Public routes
router.get('/', getAllStudyResources);
router.get('/:id', getStudyResourceById);
router.get('/course/:courseId', getStudyResourcesByCourse);

// Protected routes (admin only)
router.post('/', requireAuth, requireRole(['ADMIN']), createStudyResource);
router.put('/:id', requireAuth, requireRole(['ADMIN']), updateStudyResource);
router.delete('/:id', requireAuth, requireRole(['ADMIN']), deleteStudyResource);

export default router; 
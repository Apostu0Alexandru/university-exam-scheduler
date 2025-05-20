import { Router } from 'express';
import userRoutes from './user.routes';
import examRoutes from './exam.routes';
import courseRoutes from './course.routes';
import recommendationRoutes from './recommendation.routes';
import studyResourceRoutes from './studyResource.routes';
import enrollmentRoutes from './enrollment.routes';
import learningPreferenceRoutes from './learningPreference.routes';

const router = Router();

router.use('/users', userRoutes);
router.use('/exams', examRoutes);
router.use('/courses', courseRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/study-resources', studyResourceRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/learning-preferences', learningPreferenceRoutes);

export default router; 
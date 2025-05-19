import { Router } from 'express';
import { getAllCourses } from '../controllers/course.controller';
const router = Router();
router.get('/', getAllCourses);
export default router;

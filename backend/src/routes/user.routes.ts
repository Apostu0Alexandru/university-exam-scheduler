import { Router } from 'express';
import { 
  getProfile, 
  updateRole, 
  getAllUsers,
  getUserById
} from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/clerk.middleware';

const router = Router();

// Get the current authenticated user
router.get('/me', requireAuth, getProfile);

// Get user by ID (can be database ID or Clerk ID)
router.get('/:userId', requireAuth, getUserById);

// Admin routes
router.get('/', requireAuth, requireRole(['ADMIN']), getAllUsers);
router.patch('/:userId/role', requireAuth, requireRole(['ADMIN']), updateRole);

export default router;

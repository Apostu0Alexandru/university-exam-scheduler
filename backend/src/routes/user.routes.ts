import { Router } from 'express';
import { getProfile, updateRole } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/clerk.middleware';

const router = Router();

// Get authenticated user's profile
router.get('/me', requireAuth, getProfile);

// Update user role (admin only)
router.patch('/:userId/role', requireAuth, requireRole(['ADMIN']), updateRole);

export default router;

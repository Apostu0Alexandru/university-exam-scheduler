import { Request, Response, NextFunction } from 'express';
import { PrismaClient, User } from '@prisma/client';
import { ApiError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export const getProfile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    // Only admins can update user roles
    if (req.user.role !== 'ADMIN') {
      throw new ApiError(403, 'Insufficient permissions');
    }
    
    if (!['STUDENT', 'ADMIN'].includes(role)) {
      throw new ApiError(400, 'Invalid role');
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });
    
    return res.json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

// Get user by ID (can be database ID or Clerk ID)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    console.log('Looking up user by ID:', userId);
    
    let user: any = null;
    
    // First check if it's a Clerk ID (user_xxx format)
    if (userId.startsWith('user_')) {
      console.log('Searching by Clerk ID');
      user = await prisma.user.findFirst({
        where: { clerkId: userId },
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          learningPreferences: true,
        },
      });
    }
    
    // If not found by Clerk ID, try to find by database ID
    if (!user) {
      console.log('Not found by Clerk ID, trying database ID');
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          learningPreferences: true,
        },
      });
    }
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    
    console.log('Found user:', {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      enrollments: user.enrollments?.length || 0,
      preferences: user.learningPreferences?.length || 0
    });
    
    return res.json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

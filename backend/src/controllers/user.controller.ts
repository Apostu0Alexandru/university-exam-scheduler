import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
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

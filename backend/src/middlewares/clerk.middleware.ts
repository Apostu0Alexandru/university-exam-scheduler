import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { PrismaClient } from '@prisma/client';
import { ApiError } from './error.middleware';

const prisma = new PrismaClient();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        clerkId: string;
        email: string;
        role: string;
      };
    }
  }
}

// Clerk authentication middleware
export const requireAuth = ClerkExpressRequireAuth();

// User lookup middleware to attach our database user to the request
export const attachDatabaseUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth?.userId) {
      return next();
    }

    const clerkId = req.auth.userId;
    
    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });
    
    if (!user && req.auth.sessionClaims?.email) {
      // Create a new user with data from Clerk
      const firstName = req.auth.sessionClaims.firstName as string || '';
      const lastName = req.auth.sessionClaims.lastName as string || '';
      const email = req.auth.sessionClaims.email as string;
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          role: 'STUDENT', // Default role
        },
      });
    }
    
    if (user) {
      // Attach user to request
      req.user = {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      };
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    
    next();
  };
};
